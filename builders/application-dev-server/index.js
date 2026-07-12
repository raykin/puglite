/**
 * Puglite Application Dev Server Builder (esbuild/vite)
 *
 * Wraps @angular/build's executeDevServerBuilder. The vite dev server
 * builds in-process via buildApplicationInternal, so the same fs
 * intercept used by puglite:application applies here.
 *
 * The builder context is patched because Angular's dev server selects
 * the vite pipeline only when the buildTarget's builder name is
 * `@angular/build:application` — `puglite:application` is mapped to it.
 */

process.env.NG_BUILD_PARALLEL_TS = "0";

const path = require("path");
const { createRequire } = require("module");
const debug = require("util").debuglog("puglite");
const { patchFs } = require("../application/fs-intercept");
const { loadEsbuildPlugins } = require("../application");

const projectRequire = createRequire(path.join(process.cwd(), "package.json"));

const builderNameMap = new Map([
  ["puglite:application", "@angular/build:application"],
]);

function patchBuilderContext(context, buildTarget) {
  const origGetBuilderName = context.getBuilderNameForTarget;
  context.getBuilderNameForTarget = async (target) => {
    const name = await origGetBuilderName.call(context, target);
    return builderNameMap.get(name) || name;
  };

  const origGetTargetOptions = context.getTargetOptions;
  context.getTargetOptions = async (target) => {
    const targetOptions = await origGetTargetOptions.call(context, target);
    if (
      target.project === buildTarget.project &&
      target.target === buildTarget.target &&
      target.configuration === buildTarget.configuration
    ) {
      targetOptions.aot = true;
      // Stock @angular/build validates these options; "plugins" is ours.
      delete targetOptions.plugins;
    }
    return targetOptions;
  };
}

async function* servePugApplication(options, context) {
  debug("servePugApplication() called");
  patchFs();

  const { targetFromTargetString } = projectRequire(
    "@angular-devkit/architect",
  );
  const buildTarget = targetFromTargetString(options.buildTarget);
  const buildTargetOptions = await context.getTargetOptions(buildTarget);
  const buildPlugins = loadEsbuildPlugins(
    buildTargetOptions.plugins,
    context.workspaceRoot,
  );
  patchBuilderContext(context, buildTarget);

  const { executeDevServerBuilder } = projectRequire("@angular/build");
  yield* executeDevServerBuilder(
    options,
    context,
    buildPlugins.length ? { buildPlugins } : undefined,
  );
}

const { createBuilder } = projectRequire("@angular-devkit/architect");
module.exports = createBuilder(servePugApplication);
module.exports.default = module.exports;
