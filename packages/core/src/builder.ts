import { Plugin } from './context'
import Linearite from './index'

/**
 * declare module '@linearite/core' {
 *   // ignore recusive type error, because it is work
 *   // @ts-ignore
 *   export interface BuilderConfs extends BuilderConfs {
 *     name: SpecialConf
 *   }
 * }
 */
export interface BuilderConfs {}

export namespace Builder {
  export type Platform = 'browser' | 'node' | 'neutral'
  export type Format = 'cjs' | 'esm' | 'iife' | 'umd'
  export type Types = keyof BuilderConfs
  export type InferName<N extends Plugin.Names> = N extends `builder-${infer B extends Types}`
    ? B : never
  export interface Opts {
    type: Types
    target: string | string[]
    format: Format | Format[]
    platform: Platform | Platform[]
    /**
     * entry points
     * @default 'src/index.ts'
     *
     * TODO support glob
     */
    input?: string | string[]
    /**
     * @default 'dist'
     */
    outdir?: string
    /**
     * output filename, only support one entry point
     *
     * @default will falback as follows:
     *
     * * esm: `workspace.meta.module`
     *
     * * cjs: `workspace.meta.main`
     *
     * if workspace package.json not define module or main field, will fallback to:
     *
     * '[outdir]/index.[format]'
     *
     * TODO support multi entry points
     * TODO support package.json [exports field](https://nodejs.org/api/packages.html#packages_subpath_exports)
     */
    outfile?: string | ((outdir: string, format: Format, workspace: Linearite.Workspace) => string)
    define?: Record<string, string>
    minify?: boolean
    /**
     * @default workspace dependencies
     */
    external?: string[] | ((dep: string[], devDep: string[], workspace: Linearite.Workspace) => string[])
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both'
  }
  export type Dir = (...paths: string[]) => string
  export function fieldResolve<K extends keyof Opts, T extends Opts[K]>(
    key: K, def: T, opts: {
      dir: Dir
      workspace: Linearite.Workspace
    }
  ): T {
    switch (key) {
      case 'input':
      case 'outfile':
      case 'external':
        // TODO support
      default:
        return def
    }
  }
  export type Configuration<N extends Plugin.Names> =
    & Opts
    & BuilderConfs[InferName<N>]
}
