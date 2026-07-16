export interface Options {
  /** Used to improve error reporting. */
  filename?: string;
  /** Adds whitespace to the resulting HTML. May also be a string of whitespace to indent with. */
  pretty?: boolean | string;
  /** Specifies the default doctype (e.g. "html"). */
  doctype?: string;
  /**
   * When false, debugging instrumentation is stripped from the compiled
   * template. Defaults to true for compile()/render(), false for
   * compileClient*().
   */
  compileDebug?: boolean;
  /**
   * When true, runtime helper functions are inlined into the compiled
   * template. Defaults to false for compile(), true for compileClient*().
   */
  inlineRuntimeFunctions?: boolean;
  /** Base directory for the project (kept for pug API compatibility). */
  basedir?: string;
  /** List of global names available inside templates. */
  globals?: string[];
  /** When true, locals are namespaced under `self` instead of a with-block. */
  self?: boolean;
  /** Enables template function caching keyed by filename. */
  cache?: boolean;
  /** Prints the compiled function source to stderr. */
  debug?: boolean;
}

export interface ClientOptions extends Options {
  /** Name of the generated template function. Defaults to "template". */
  name?: string;
  /** When true, the generated source includes a module.exports assignment. */
  module?: boolean;
}

export type LocalsObject = Record<string, unknown>;

export interface TemplateFunction {
  (locals?: LocalsObject): string;
  /** Always empty in puglite: include/extends were removed. */
  dependencies: string[];
}

export interface CompileClientResult {
  body: string;
  /** Always empty in puglite: include/extends were removed. */
  dependencies: string[];
}

export type Callback = (err: Error | null, html?: string) => void;

export const name: string;
export const cache: Record<string, TemplateFunction | string>;
export const runtime: Record<string, Function>;

export function compile(source: string, options?: Options): TemplateFunction;
export function compileFile(path: string, options?: Options): TemplateFunction;
export function compileClient(source: string, options?: ClientOptions): string;
export function compileClientWithDependenciesTracked(
  source: string,
  options?: ClientOptions,
): CompileClientResult;
export function compileFileClient(
  path: string,
  options?: ClientOptions,
): string;

export function render(
  source: string,
  options?: Options & LocalsObject,
): string;
export function render(
  source: string,
  options: (Options & LocalsObject) | undefined,
  callback: Callback,
): void;
export function render(source: string, callback: Callback): void;

export function renderFile(
  path: string,
  options?: Options & LocalsObject,
): string;
export function renderFile(
  path: string,
  options: (Options & LocalsObject) | undefined,
  callback: Callback,
): void;
export function renderFile(path: string, callback: Callback): void;

export function __express(
  path: string,
  options: Options & LocalsObject,
  callback: Callback,
): void;
