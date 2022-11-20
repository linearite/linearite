import { Plugin } from './context'
import Linearite from './index'

export interface BuilderConfs {}

export namespace Builder {
  export type Platform = 'browser' | 'node' | 'neutral'
  export type Format = 'cjs' | 'esm' | 'iife' | 'umd'
  /**
   * declare module '@linearite/core' {
   *   export namespace Builder {
   *     // ignore recusive type error, because it is work
   *     // @ts-ignore
   *     export interface Confs extends Confs {
   *       name: SpecialConf
   *     }
   *   }
   * }
   */
  export interface Confs extends BuilderConfs {}
  export type Types = keyof Confs
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
    external?: string[]
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both'
  }
  export type Configuration<N extends Plugin.Names> =
    & Opts
    & Confs[InferName<N>]
}
