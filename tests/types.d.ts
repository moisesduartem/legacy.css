declare module "node:path" {
  export function resolve(...paths: string[]): string;
}

declare module "node:url" {
  export function pathToFileURL(path: string): { href: string };
}

declare module "jsdom" {
  export class JSDOM {
    constructor(html?: string, options?: Record<string, unknown>);

    __legacyRestoreGlobals?: () => void;
    window: any;
  }
}
