import { Plugin } from './context'

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
    define?: Record<string, string>
    minify?: boolean
    external?: string[]
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both'
  }
  export type Configuration<N extends Plugin.Names> =
    & Opts
    & Confs[InferName<N>]
}
