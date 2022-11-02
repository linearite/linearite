export namespace Builder {
  export type Platform = 'cjs' | 'esm' | 'iife' | 'umd'
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
    format: Platform
    define?: Record<string, string>
    minify?: boolean
    external?: string[]
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both'
  }
}

export type Plugin<N extends Builder.Types> = {
  type: string
  name: N
} & ({
  type: 'command'
  call: (args: any[], conf: any) => void
} | {
  type: 'builder'
  call: (opts: Builder.Opts & Builder.Confs[N], conf: Linearite.Options) => void
})

export const definePlugin = <N extends Builder.Types>(plugin: Plugin<N>) => plugin

export namespace Linearite {
  export type MacroSytax =
    | `PKG_${ 'NAME' | 'VERSION' }`
    // (pkgName = '@scope/name') => name
    | 'L_NAME'
  export type Inherit = 'auto' | 'inherit' | true
  export function isInherit(v: Inherit): v is 'inherit' {
    return ['auto', 'inherit', true].includes(v)
  }
  export interface PKGMeta {
    name: string
    version: string
    description: string
  }
  export interface Options {
    /**
     * builder config
     */
    builder?: Inherit | boolean | Builder.Types | Builder.Opts
    /**
     * auto with tag when publish package
     *
     * support {@link Linearite.MacroSytax} variables
     *
     * @default "${{L_NAME}}@${{PKG_VERSION}}"
     */
    autoTag?: Inherit | boolean | string | ((pkgMeta: PKGMeta, conf: Linearite.Options) => string)
    /**
     * check commit message
     *
     * @default true
     */
    cmMsgRule?: Inherit | boolean
  }
}

export default Linearite
