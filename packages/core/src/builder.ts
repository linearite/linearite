export namespace Builder {
  export type Format = 'cjs' | 'esm' | 'iife' | 'umd'
  /**
   * declare module '@linearite/core' {
   *   export namespace Builder {
   *     export interface Confs {
   *       name: SpecialConf
   *     }
   *   }
   * }
   */
  export interface Confs {}
  export type Types = keyof Confs
  export interface Opts {
    type: Types
    target: string | string[]
    format: Format | Format[]
    define?: Record<string, string>
    minify?: boolean
    external?: string[]
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both'
  }
}
