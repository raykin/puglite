/**
 * Puglite Application Builder (esbuild)
 *
 * Wraps @angular/build's buildApplication and intercepts fs reads so
 * Angular's AOT resource loader receives compiled HTML for `.pug`
 * templateUrls. Mirrors Angular's naming: browser = webpack,
 * application = esbuild.
 *
 * Constraints:
 * - NG_BUILD_PARALLEL_TS must be disabled before @angular/build loads
 *   (env read at module load): parallel TS runs in worker threads where
 *   the fs patch does not exist.
 * - AOT is forced: JIT reads templates via esbuild's Go I/O, which is
 *   unpatchable from Node.
 */

process.env.NG_BUILD_PARALLEL_TS = "0";

const path = require("path");
const { createRequire } = require("module");
const debug = require("util").debuglog("puglite");
const { patchFs, unpatchFs } = require("./fs-intercept");

const projectRequire = createRequire(path.join(process.cwd(), "package.json"));

function loadEsbuildPlugins(pluginPaths, workspaceRoot) {
  const plugins = [];
  for (const pluginPath of pluginPaths || []) {
    const mod = require(path.resolve(workspaceRoot, pluginPath));
    const value = mod.default || mod;
    plugins.push(...(Array.isArray(value) ? value : [value]));
  }
  const stencilPlugin = stencilEmptyGlobPlugin(workspaceRoot);
  if (stencilPlugin) plugins.push(stencilPlugin);
  return plugins;
}

// Stencil's runtime contains a dynamic `import(`./${bundleId}.entry.js`)`
// that esbuild resolves as a glob and warns about when it matches nothing.
// The entries load at runtime, so the warning is noise.
function stencilEmptyGlobPlugin(workspaceRoot) {
  try {
    // Resolve the main entry: @stencil/core's exports map hides package.json.
    createRequire(path.join(workspaceRoot, "package.json")).resolve(
      "@stencil/core",
    );
  } catch {
    return null;
  }
  return {
    name: "puglite-silence-stencil-empty-glob",
    setup(build) {
      const logOverride = build.initialOptions.logOverride || {};
      if (!("empty-glob" in logOverride)) {
        build.initialOptions.logOverride = {
          ...logOverride,
          "empty-glob": "silent",
        };
      }
    },
  };
}

async function* buildPugApplication(options, context) {
  debug("buildPugApplication() called");
  if (options.aot === false) {
    context.logger.warn(
      'puglite:application requires AOT; forcing "aot": true (JIT template reads bypass the pug intercept).',
    );
  }
  options.aot = true;

  const codePlugins = loadEsbuildPlugins(
    options.plugins,
    context.workspaceRoot,
  );
  delete options.plugins;

  const stats = patchFs();
  try {
    const { buildApplication } = projectRequire("@angular/build");

    yield* buildApplication(
      options,
      context,
      codePlugins.length ? { codePlugins } : undefined,
    );
    debug(`pug templates compiled: ${stats.compiled}`);
  } finally {
    unpatchFs();
  }
}

const { createBuilder } = projectRequire("@angular-devkit/architect");
module.exports = createBuilder(buildPugApplication);
module.exports.default = module.exports;
module.exports.loadEsbuildPlugins = loadEsbuildPlugins;
