/**
 * Makes @angular/build's AOT compiler host read `.pug` templateUrls.
 *
 * Since @angular/build 22.2.4, `host.readResource` returns '' for any file
 * whose extension is not .htm/.html/.svg, without reading it. The fs
 * intercept never sees the read, so every `.pug` template compiles empty
 * and the build still exits 0. With component style HMR on
 * (NG_HMR_CSTYLES=1), `host.resourceNameToFileName` also maps any
 * non-template resource to `<hash>.css`. Both checks use a module-level
 * extension list, so the host factory is wrapped instead.
 */

const fs = require("fs");
const path = require("path");

const HOST_MODULE_PATHS = [
  "src/tools/angular/angular-host.js",
  "src/tools/esbuild/angular/angular-host.js",
];

let hostModule;
let originalCreateHost;

function isPug(filename) {
  return typeof filename === "string" && filename.endsWith(".pug");
}

function findHostModule(projectRequire) {
  const buildRoot = path.dirname(
    projectRequire.resolve("@angular/build/package.json"),
  );
  const hostModulePath = HOST_MODULE_PATHS.map((file) =>
    path.join(buildRoot, file),
  ).find((file) => fs.existsSync(file));
  if (!hostModulePath) {
    throw new Error(
      `puglite: cannot find angular-host.js in ${buildRoot}; this @angular/build version is not supported.`,
    );
  }
  return projectRequire(hostModulePath);
}

function wrapHost(host) {
  const readResource = host.readResource;
  host.readResource = async function (filename) {
    if (isPug(filename)) return this.readFile(filename) ?? "";
    return readResource.call(this, filename);
  };

  const resourceNameToFileName = host.resourceNameToFileName;
  host.resourceNameToFileName = function (resourceName, containingFile) {
    if (!isPug(resourceName)) {
      return resourceNameToFileName.call(this, resourceName, containingFile);
    }
    const resolvedPath = path.join(path.dirname(containingFile), resourceName);
    return this.fileExists(resolvedPath) ? resolvedPath : null;
  };
  return host;
}

function patchCompilerHost(projectRequire) {
  if (originalCreateHost) return;
  hostModule = findHostModule(projectRequire);
  originalCreateHost = hostModule.createAngularCompilerHost;
  hostModule.createAngularCompilerHost = function (...args) {
    return wrapHost(originalCreateHost.apply(this, args));
  };
}

function unpatchCompilerHost() {
  if (!originalCreateHost) return;
  hostModule.createAngularCompilerHost = originalCreateHost;
  originalCreateHost = undefined;
  hostModule = undefined;
}

module.exports = { patchCompilerHost, unpatchCompilerHost };
