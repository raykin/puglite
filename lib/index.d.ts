export interface Options {
  /** Used to improve error reporting. */
  filename?: string;
  /** Adds whitespace to the resulting HTML. May also be a string of whitespace to indent with. */
  pretty?: boolean | string;
  /** Specifies the default doctype (e.g. "html"). */
  doctype?: string;
  /** Base directory for the project (kept for pug API compatibility). */
  basedir?: string;
  /** Enables template function caching keyed by filename. */
  cache?: boolean;
}

export type LocalsObject = Record<string, unknown>;

export interface TemplateFunction {
  /** Templates are static: locals are ignored. */
  (locals?: LocalsObject): string;
  /** Always empty in puglite: include/extends were removed. */
  dependencies: string[];
}

export type Callback = (err: Error | null, html?: string) => void;

export const name: string;
export const cache: Record<string, TemplateFunction>;
export const runtime: Record<string, Function>;

export function compile(source: string, options?: Options): TemplateFunction;
export function compileFile(path: string, options?: Options): TemplateFunction;
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
