"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync, spawn } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const demoDir = path.join(repoRoot, "angular-puglite-demo");
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
