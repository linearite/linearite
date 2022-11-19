import { Plugin } from './context'
import Linearite from './index'

export namespace Builder {
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
  export interface Confs {}
  export type Types = keyof Confs
  export type InferName<N extends Plugin.Names> = N extends `builder-${infer B extends Types}`
    ? B : never
  export interface Opts {
    type: Types
    target: string | string[]
    format: Format | Format[]
    /**
     * @default 'dist'
     */
    outdir?: string
    /**
     * output filename
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
