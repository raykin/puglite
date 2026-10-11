/**
 * Puglite Vitest Builder
 *
 * Angular builder that runs Vitest with Pug template transformation.
 *
 * Features:
 * - Transforms .pug files to HTML strings via Vite plugin
 * - Enables jsdom environment for browser API support
 * - Supports file filters for running specific tests
 *
 * Limitation:
 * - TestBed with external templates does NOT work in Vitest
 * - See README.md for recommended testing patterns
 */

const path = require("path");
const { createRequire } = require("module");
const { readFileSync } = require("fs");
const debug = require("util").debuglog("puglite");

const projectRequire = createRequire(path.join(process.cwd(), "package.json"));

async function* buildVitest(options, context) {
  debug("buildVitest() called");
  const { startVitest } = projectRequire("vitest/node");

  // Get file filters from CLI args
  const cliArgs = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith("--") && arg.endsWith(".spec.ts"));
  const filters = options.include || cliArgs;

  const compileHtml = require("../../lib/compile-html");

  // Vite plugin: Transform .pug imports to HTML strings
  const pugVitePlugin = {
    name: "puglite-vitest",
    enforce: "pre",
    load(id) {
      const cleanId = id.split("?")[0];
      if (!cleanId.endsWith(".pug")) return null;

      try {
        const pugSource = readFileSync(cleanId, "utf-8");
        const html = compileHtml(pugSource, { filename: cleanId });

        return `export default ${JSON.stringify(html)};`;
      } catch (error) {
        console.error(`[puglite] Error compiling ${cleanId}:`, error);
        throw error;
      }
    },
  };

  const vitestConfig = {
    run: true,
    plugins: [pugVitePlugin],
    test: {
      globals: true,
      environment: options.environment || "jsdom",
    },
  };

  try {
    const vitest = await startVitest("test", filters, vitestConfig);

    if (!vitest) {
      yield { success: false };
      return;
    }

    await vitest.close();

    const hasFailures = vitest.state.getCountOfFailedTests() > 0;
    yield { success: !hasFailures };
  } catch (error) {
    console.error("[puglite] Vitest error:", error);
    yield { success: false, error: error.message };
  }
}

const { createBuilder } = projectRequire("@angular-devkit/architect");
module.exports = createBuilder(buildVitest);
module.exports.default = module.exports;
