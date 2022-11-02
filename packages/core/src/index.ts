export namespace Builder {
  export type Platform = 'cjs' | 'esm' | 'iife' | 'umd'
  export interface CommonOpts {
    target: string | string[]
    format: Platform
    define?: Record<string, string>
    minify?: boolean
    external?: string[]
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both'
  }
  export type Opts = {
    conf: CommonOpts
  } & ({
    type: 'esbuild'
    conf: {}
  } | {
    /**
     * @deprecated unsupported
     */
    type: 'swc'
  })
  export type Options = boolean | Opts['type'] | Opts
}

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
    builder?: Inherit | Builder.Options
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

export default Linearite;
