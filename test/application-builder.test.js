"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync, spawn } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const demoDir = process.env.PUGLITE_DEMO_DIR
  ? path.resolve(process.env.PUGLITE_DEMO_DIR)
  : path.join(repoRoot, "angular-puglite-demo");
const distDir = path.join(demoDir, "dist", "angular-puglite-demo-application");
const fsInterceptPath = path.join(
  repoRoot,
  "builders",
  "application",
  "fs-intercept.js",
);

function runNodeScript(script, cwd) {
  return execFileSync(process.execPath, ["-e", script], {
    encoding: "utf8",
    cwd,
  });
}

describe("application builder fs-intercept", function () {
  // Run in a child process: the patch mutates global fs and must not leak
  // into the jest worker, which reads .pug fixtures elsewhere.
  it("compiles .pug reads and passes everything else through", function () {
    const out = runNodeScript(`
      const { patchFs, stats } = require(${JSON.stringify(fsInterceptPath)});
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'puglite-fsint-'));
      fs.writeFileSync(path.join(dir, 't.pug'), 'p hi');
      fs.writeFileSync(path.join(dir, 't.txt'), 'p hi');
      patchFs();
      patchFs(); // idempotent: second call must not double-wrap
      const pugFile = path.join(dir, 't.pug');
      const buf = fs.readFileSync(pugFile);
      fs.promises.readFile(pugFile, 'utf8').then((viaPromise) => {
        console.log(JSON.stringify({
          str: fs.readFileSync(pugFile, 'utf8'),
          bufIsBuffer: Buffer.isBuffer(buf),
          bufText: buf.toString('utf8'),
          txt: fs.readFileSync(path.join(dir, 't.txt'), 'utf8'),
          viaPromise,
          compiled: stats.compiled,
        }));
      });
    `);
    const result = JSON.parse(out);
    assert.strictEqual(result.str, "<p>hi</p>");
    assert.strictEqual(result.bufIsBuffer, true);
    assert.strictEqual(result.bufText, "<p>hi</p>");
    assert.strictEqual(result.txt, "p hi");
    assert.strictEqual(result.viaPromise, "<p>hi</p>");
    assert.strictEqual(result.compiled, 3);
  });

  it("surfaces pug compile errors instead of returning content", function () {
    let failure;
    try {
      // stderr piped, not inherited: the expected crash must not spill a
      // scary stack trace into the jest output.
      execFileSync(
        process.execPath,
        [
          "-e",
          `
        const { patchFs } = require(${JSON.stringify(fsInterceptPath)});
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'puglite-fsint-'));
        const bad = path.join(dir, 'bad.pug');
        fs.writeFileSync(bad, 'div(unclosed');
        patchFs();
        fs.readFileSync(bad, 'utf8');
      `,
        ],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
    } catch (error) {
      failure = error;
    }
    assert.ok(failure, "reading a broken .pug should crash the process");
    assert.match(failure.stderr, /Puglite compilation failed/);
  });

  // TypeScript's sys.readFile swallows read errors and returns undefined,
  // which Angular turns into an empty template. The intercept must record
  // the error so the builder can fail the build.
  it("records pug compile errors that TypeScript swallows", function () {
    const out = runNodeScript(
      `
      const { createRequire } = require('module');
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const ts = createRequire(path.join(process.cwd(), 'package.json'))('typescript');
      const { patchFs, stats } = require(${JSON.stringify(fsInterceptPath)});
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'puglite-fsint-'));
      const bad = path.join(dir, 'bad.pug');
      fs.writeFileSync(bad, 'div(unclosed');
      patchFs();
      const viaTs = ts.sys.readFile(bad);
      const recorded = [...stats.errors.entries()].map(([f, e]) => [f, e.message]);
      fs.writeFileSync(bad, 'p fixed');
      const fixed = ts.sys.readFile(bad);
      console.log(JSON.stringify({ viaTs: viaTs === undefined ? null : viaTs, recorded, bad, fixed, left: stats.errors.size }));
    `,
      demoDir,
    );
    const result = JSON.parse(out);
    assert.strictEqual(result.viaTs, null);
    assert.strictEqual(result.recorded.length, 1);
    assert.strictEqual(result.recorded[0][0], result.bad);
    assert.match(result.recorded[0][1], /Puglite compilation failed/);
    assert.strictEqual(result.fixed, "<p>fixed</p>");
    assert.strictEqual(result.left, 0);
  });

  it("stops failing builds for a broken .pug that was deleted", function () {
    const out = runNodeScript(`
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const { patchFs, failOnPugErrors } = require(${JSON.stringify(fsInterceptPath)});
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'puglite-fsint-'));
      const bad = path.join(dir, 'bad.pug');
      fs.writeFileSync(bad, 'div(unclosed');
      patchFs();
      try { fs.readFileSync(bad); } catch {}
      async function* builds() {
        yield { success: true };
        fs.unlinkSync(bad);
        yield { success: true };
      }
      (async () => {
        const results = [];
        const logger = { error() {} };
        for await (const r of failOnPugErrors(builds(), logger)) results.push(r.success);
        console.log(JSON.stringify(results));
      })();
    `);
    assert.deepStrictEqual(JSON.parse(out), [false, true]);
  });

  function runTemplateSwitch(steps) {
    return JSON.parse(
      runNodeScript(`
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const { patchFs, failOnPugErrors } = require(${JSON.stringify(fsInterceptPath)});
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'puglite-fsint-'));
      const component = path.join(dir, 'app.ts');
      const bad = path.join(dir, 'bad.pug');
      fs.writeFileSync(bad, 'div(unclosed');
      fs.writeFileSync(path.join(dir, 'good.pug'), 'p ok');
      const useTemplate = (name) => {
        fs.writeFileSync(component, "@Component({ templateUrl: './" + name + "' }) class App {}");
        fs.readFileSync(component);
        try { fs.readFileSync(path.join(dir, name)); } catch {}
      };
      patchFs();
      const steps = ${JSON.stringify(steps)};
      async function* builds() {
        for (const step of steps) {
          if (step === 'unknown-reader') { try { fs.readFileSync(bad); } catch {} }
          else if (step !== 'no-reads') useTemplate(step);
          yield { success: true };
        }
      }
      (async () => {
        const results = [];
        for await (const r of failOnPugErrors(builds(), { error() {} })) results.push(r.success);
        console.log(JSON.stringify(results));
      })();
    `),
    );
  }

  it("stops failing builds once no component uses the broken .pug", function () {
    assert.deepStrictEqual(runTemplateSwitch(["bad.pug", "good.pug"]), [
      false,
      true,
    ]);
  });

  it("keeps failing builds while a component still uses the broken .pug", function () {
    assert.deepStrictEqual(runTemplateSwitch(["bad.pug", "no-reads"]), [
      false,
      false,
    ]);
  });

  it("keeps failing builds for a broken .pug read without a known component", function () {
    assert.deepStrictEqual(runTemplateSwitch(["unknown-reader", "no-reads"]), [
      false,
      false,
    ]);
  });

  it("unpatchFs restores the original fs functions", function () {
    const out = runNodeScript(`
      const fs = require('fs');
      const orig = [fs.readFileSync, fs.promises.readFile, fs.createReadStream];
      const { patchFs, unpatchFs } = require(${JSON.stringify(fsInterceptPath)});
      patchFs();
      const patched = [fs.readFileSync, fs.promises.readFile, fs.createReadStream]
        .map((fn, i) => fn !== orig[i]);
      unpatchFs();
      const restored = [fs.readFileSync, fs.promises.readFile, fs.createReadStream]
        .map((fn, i) => fn === orig[i]);
      console.log(JSON.stringify({ patched, restored }));
    `);
    const result = JSON.parse(out);
    assert.deepStrictEqual(result.patched, [true, true, true]);
    assert.deepStrictEqual(result.restored, [true, true, true]);
  });
});

describe("application builder compiler-host patch", function () {
  const compilerHostPath = path.join(
    repoRoot,
    "builders",
    "application",
    "compiler-host.js",
  );

  it("reads .pug resources through the real @angular/build compiler host", function () {
    const out = runNodeScript(
      `
      const Module = require('module');
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const projectRequire = Module.createRequire(path.join(process.cwd(), 'package.json'));
      const { patchCompilerHost, unpatchCompilerHost } = require(${JSON.stringify(compilerHostPath)});
      const ts = projectRequire('typescript');
      const buildRoot = path.dirname(projectRequire.resolve('@angular/build/package.json'));
      const hostModule = projectRequire(path.join(buildRoot, 'src/tools/angular/angular-host.js'));
      const original = hostModule.createAngularCompilerHost;

      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'puglite-host-'));
      const component = path.join(dir, 'app.ts');
      fs.writeFileSync(component, '');
      fs.writeFileSync(path.join(dir, 'app.pug'), 'p from pug');
      fs.writeFileSync(path.join(dir, 'app.html'), '<p>from html</p>');
      fs.writeFileSync(path.join(dir, 'app.css'), 'p {}');

      const createHost = () => hostModule.createAngularCompilerHost(ts, {}, {
        externalStylesheets: new Map(),
        modifiedFiles: new Set(),
      });

      (async () => {
        const hashModule = path.join(buildRoot, 'src/utils/hash.js');
        if (fs.existsSync(hashModule)) await projectRequire(hashModule).initializeHash();
        patchCompilerHost(projectRequire);
        patchCompilerHost(projectRequire);
        const host = createHost();
        const pugFile = host.resourceNameToFileName('./app.pug', component);
        const result = {
          pugFile: path.relative(dir, pugFile),
          pug: await host.readResource(pugFile),
          missingPug: host.resourceNameToFileName('./missing.pug', component),
          html: await host.readResource(host.resourceNameToFileName('./app.html', component)),
          cssFile: host.resourceNameToFileName('./app.css', component),
        };
        unpatchCompilerHost();
        result.restored = hostModule.createAngularCompilerHost === original;
        console.log(JSON.stringify(result));
      })();
    `,
      demoDir,
    );
    const result = JSON.parse(out);
    assert.strictEqual(result.pugFile, "app.pug");
    assert.strictEqual(result.pug, "p from pug");
    assert.strictEqual(result.missingPug, null);
    assert.strictEqual(result.html, "<p>from html</p>");
    assert.match(result.cssFile, /^[^/]+\.css$/);
    assert.strictEqual(result.restored, true);
  });
});

describe("builder schemas", function () {
  const angularBuildDir = path.join(
    demoDir,
    "node_modules",
    "@angular",
    "build",
    "src",
    "builders",
  );

  // Angular reads several options without its own fallback and relies on
  // schema defaults (prebundle, extractLicenses), so ours must match.
  it.each([
    ["application", "application"],
    ["application-dev-server", "dev-server"],
  ])("%s keeps Angular's defaults", function (pugliteName, angularName) {
    const ours = require(
      path.join(repoRoot, "builders", pugliteName, "schema.json"),
    ).properties;
    const angular = require(
      path.join(angularBuildDir, angularName, "schema.json"),
    ).properties;
    const mismatches = Object.keys(ours)
      .filter((key) => angular[key] && "default" in angular[key])
      .filter(
        (key) =>
          JSON.stringify(ours[key].default) !==
          JSON.stringify(angular[key].default),
      );
    assert.deepStrictEqual(mismatches, []);
  });
});

describe("application builders with a stubbed @angular/build", function () {
  const builderIndexPath = path.join(
    repoRoot,
    "builders",
    "application",
    "index.js",
  );
  const devServerIndexPath = path.join(
    repoRoot,
    "builders",
    "application-dev-server",
    "index.js",
  );

  it("forces aot, fails on pug errors and unpatches fs after a throw", function () {
    const out = runNodeScript(
      `
      const Module = require('module');
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const projectRequire = Module.createRequire(path.join(process.cwd(), 'package.json'));
      const ts = projectRequire('typescript');
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'puglite-stub-'));
      fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"stub-app"}');
      const good = path.join(dir, 'good.pug');
      const bad = path.join(dir, 'bad.pug');
      fs.writeFileSync(good, 'p ok');
      fs.writeFileSync(bad, 'div(unclosed');

      const origRead = fs.readFileSync;
      let mode;
      const seen = [];
      const stubPath = projectRequire.resolve('@angular/build');
      const stub = new Module(stubPath);
      stub.loaded = true;
      stub.exports = {
        buildApplication: async function* (options) {
          seen.push({ mode, aot: options.aot, patched: fs.readFileSync !== origRead });
          if (mode === 'throw') throw new Error('boom');
          ts.sys.readFile(mode === 'bad' ? bad : good);
          yield { success: true };
        },
      };
      require.cache[stubPath] = stub;

      const { buildPugApplication } = require(${JSON.stringify(builderIndexPath)});
      const warnings = [];
      const errors = [];
      const context = {
        workspaceRoot: dir,
        logger: { warn: (m) => warnings.push(m), error: (m) => errors.push(m) },
      };
      async function collect(it) {
        const results = [];
        for await (const r of it) results.push(r.success);
        return results;
      }
      (async () => {
        mode = 'good';
        const goodResults = await collect(buildPugApplication({ aot: false }, context));
        mode = 'bad';
        const badResults = await collect(buildPugApplication({}, context));
        mode = 'throw';
        let thrown = null;
        try { await collect(buildPugApplication({}, context)); } catch (e) { thrown = e.message; }
        console.log(JSON.stringify({
          seen, goodResults, badResults, thrown, warnings, errors,
          restored: fs.readFileSync === origRead,
        }));
      })();
    `,
      demoDir,
    );
    const result = JSON.parse(out);
    assert.deepStrictEqual(
      result.seen.map((s) => [s.aot, s.patched]),
      [
        [true, true],
        [true, true],
        [true, true],
      ],
    );
    assert.strictEqual(result.warnings.length, 1);
    assert.match(result.warnings[0], /requires AOT/);
    assert.deepStrictEqual(result.goodResults, [true]);
    assert.deepStrictEqual(result.badResults, [false]);
    assert.strictEqual(result.errors.length, 1);
    assert.match(result.errors[0], /Puglite compilation failed for .*bad\.pug/);
    assert.strictEqual(result.thrown, "boom");
    assert.strictEqual(result.restored, true);
  });

  it("dev-server fills in the project and target like Angular does", function () {
    const out = runNodeScript(
      `
      const { resolveBuildTarget } = require(${JSON.stringify(devServerIndexPath)});
      const context = { target: { project: 'demo', target: 'serve' } };
      console.log(JSON.stringify({
        short: resolveBuildTarget({ buildTarget: ':build-application:development' }, context),
        full: resolveBuildTarget({ buildTarget: 'other:build-application' }, context),
        missing: resolveBuildTarget({}, context),
      }));
    `,
      demoDir,
    );
    const result = JSON.parse(out);
    assert.deepStrictEqual(result.short, {
      project: "demo",
      target: "build-application",
      configuration: "development",
    });
    assert.deepStrictEqual(result.full, {
      project: "other",
      target: "build-application",
    });
    assert.deepStrictEqual(result.missing, {
      project: "demo",
      target: "build",
      configuration: "development",
    });
  });
});

describe("stencil empty-glob auto-silence", function () {
  const builderIndexPath = path.join(
    repoRoot,
    "builders",
    "application",
    "index.js",
  );

  // Child process with the demo as cwd: the builder module resolves
  // @angular-devkit/architect from the invoking project at load time.
  function runDetection(setupStencilMock, buildInitialOptions) {
    const out = runNodeScript(
      `
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'puglite-stencil-'));
      fs.writeFileSync(path.join(workspace, 'package.json'), '{"name":"fake-app"}');
      if (${setupStencilMock}) {
        // Mirror the real @stencil/core: exports map does NOT expose
        // ./package.json, only the main entry resolves.
        const pkgDir = path.join(workspace, 'node_modules', '@stencil', 'core');
        fs.mkdirSync(pkgDir, { recursive: true });
        fs.writeFileSync(path.join(pkgDir, 'index.cjs'), 'module.exports = {};');
        fs.writeFileSync(
          path.join(pkgDir, 'package.json'),
          JSON.stringify({
            name: '@stencil/core',
            version: '0.0.0-mock',
            exports: { '.': { require: './index.cjs' } },
          }),
        );
      }
      const { loadEsbuildPlugins } = require(${JSON.stringify(builderIndexPath)});
      const plugins = loadEsbuildPlugins(undefined, workspace);
      const build = { initialOptions: ${JSON.stringify(buildInitialOptions)} };
      for (const p of plugins) p.setup(build);
      console.log(JSON.stringify({
        names: plugins.map((p) => p.name),
        logOverride: build.initialOptions.logOverride || null,
      }));
    `,
      demoDir,
    );
    return JSON.parse(out);
  }

  it("silences empty-glob when @stencil/core resolves from the workspace", function () {
    const result = runDetection(true, {});
    assert.deepStrictEqual(result.names, [
      "puglite-silence-stencil-empty-glob",
    ]);
    assert.deepStrictEqual(result.logOverride, { "empty-glob": "silent" });
  });

  it("keeps a user-set empty-glob override", function () {
    const result = runDetection(true, {
      logOverride: { "empty-glob": "warning" },
    });
    assert.deepStrictEqual(result.logOverride, { "empty-glob": "warning" });
  });

  it("adds no plugin without @stencil/core", function () {
    const result = runDetection(false, {});
    assert.deepStrictEqual(result.names, []);
    assert.strictEqual(result.logOverride, null);
  });
});

describe("puglite:application builder", function () {
  jest.setTimeout(240000);

  it("builds the demo with compiled pug templates, flat output", function () {
    fs.rmSync(distDir, { recursive: true, force: true });
    execFileSync(
      "npx",
      ["ng", "run", "angular-puglite-demo:build-application"],
      {
        cwd: demoDir,
        encoding: "utf8",
      },
    );

    // outputPath.browser === '' must flatten output (no browser/ subdir)
    assert.ok(
      fs.existsSync(path.join(distDir, "index.html")),
      "index.html missing at dist root",
    );
    assert.ok(
      !fs.existsSync(path.join(distDir, "browser")),
      "unexpected browser/ subdirectory",
    );

    const bundles = fs.readdirSync(distDir).filter((f) => f.endsWith(".js"));
    const joined = bundles
      .map((f) => fs.readFileSync(path.join(distDir, f), "utf8"))
      .join("\n");
    assert.ok(
      joined.includes("Hello from Puglite!"),
      "compiled hello.pug template not found in JS bundles",
    );
    assert.ok(
      !joined.includes(".hello-container\n"),
      "raw pug source leaked into bundle",
    );

    const mainJs = fs.readFileSync(path.join(distDir, "main.js"), "utf8");
    assert.ok(
      mainJs.includes("puglite-plugin-marker"),
      "esbuild plugin from the plugins option was not applied",
    );
  });

  it("fails the build on a broken pug template", function () {
    const pugFile = path.join(demoDir, "src", "app", "showcase", "hello.pug");
    const pugSource = fs.readFileSync(pugFile, "utf8");
    let failure;
    try {
      fs.writeFileSync(pugFile, "div(unclosed\n  p broken\n");
      execFileSync(
        "npx",
        ["ng", "run", "angular-puglite-demo:build-application"],
        { cwd: demoDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
    } catch (error) {
      failure = error;
    } finally {
      fs.writeFileSync(pugFile, pugSource);
    }
    assert.ok(failure, "build with a broken .pug exited 0");
    assert.match(
      `${failure.stdout}${failure.stderr}`,
      /Puglite compilation failed for .*hello\.pug/,
    );
  });
});

describe("puglite:application-dev-server builder", function () {
  jest.setTimeout(180000);

  const port = 4299;
  let server;

  afterEach(() => {
    // Negative pid kills the whole process group: killing the npx wrapper
    // alone leaves the ng/vite grandchild alive, which keeps jest from exiting.
    if (server && server.exitCode === null) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {}
    }
  });

  it("serves the demo over vite with compiled pug templates", async function () {
    server = spawn(
      "npx",
      ["ng", "run", "angular-puglite-demo:serve-application"],
      {
        cwd: demoDir,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true,
      },
    );
    let log = "";
    server.stdout.on("data", (d) => (log += d));
    server.stderr.on("data", (d) => (log += d));

    const deadline = Date.now() + 120000;
    let indexHtml;
    while (Date.now() < deadline) {
      if (server.exitCode !== null) {
        throw new Error(
          `dev server exited early (${server.exitCode}):\n${log}`,
        );
      }
      try {
        const res = await fetch(`http://localhost:${port}/`);
        if (res.ok) {
          indexHtml = await res.text();
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    assert.ok(indexHtml, `dev server did not respond within 120s:\n${log}`);

    const mainMatch = indexHtml.match(/src="\/?(main[^"]*\.js)"/);
    assert.ok(
      mainMatch,
      `no main script tag in served index.html:\n${indexHtml}`,
    );
    const mainRes = await fetch(`http://localhost:${port}/${mainMatch[1]}`);
    assert.strictEqual(mainRes.status, 200);
    const mainJs = await mainRes.text();
    assert.ok(
      mainJs.includes("Hello from Puglite!"),
      "compiled hello.pug template not found in served main bundle",
    );
    assert.ok(
      mainJs.includes("puglite-plugin-marker"),
      "build target's esbuild plugin was not applied by the dev server",
    );

    // Watch mode: editing the .pug template must trigger a rebuild that
    // serves the newly compiled HTML.
    const pugFile = path.join(demoDir, "src", "app", "showcase", "hello.pug");
    const pugSource = fs.readFileSync(pugFile, "utf8");
    const watchMarker = `watch-rebuild-${Date.now()}`;
    try {
      fs.writeFileSync(pugFile, `${pugSource}  p ${watchMarker}\n`);

      const rebuildDeadline = Date.now() + 60000;
      let rebuilt = false;
      while (Date.now() < rebuildDeadline && !rebuilt) {
        await new Promise((r) => setTimeout(r, 1000));
        // Re-resolve main from index.html: the bundle name can change on rebuild.
        const html = await (await fetch(`http://localhost:${port}/`)).text();
        const m = html.match(/src="\/?(main[^"]*\.js)"/);
        if (!m) continue;
        const js = await (
          await fetch(`http://localhost:${port}/${m[1]}`)
        ).text();
        rebuilt = js.includes(watchMarker);
      }
      assert.ok(
        rebuilt,
        `edited .pug content not served within 60s of the edit:\n${log}`,
      );
    } finally {
      fs.writeFileSync(pugFile, pugSource);
    }
  });
});
