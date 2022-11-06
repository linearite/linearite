import { Builder } from './builder'

export * from './builder'
export * from './context'

export namespace Linearite {
  export type MacroSytax =
    | `PKG_${ 'NAME' | 'VERSION' }`
    // (pkgName = '@scope/name') => name
    | 'L_NAME'
  export type Inherit = 'auto' | 'inherit' | true
  export function isInherit(v: Inherit): v is 'inherit' {
    return ['auto', 'inherit', true].includes(v)
  }
  export function resolveInherit<T>(v: Inherit | boolean, defaultValue: T): T | false {
    return v && isInherit(v) ? defaultValue : false
  }
  export interface PKGMeta {
    name: string
    version: string
    description: string
  }
  export interface Configuration<B extends Builder.Types> {
    /**
     * builder config
     */
    builder?: Inherit | boolean | Builder.Types | (Builder.Opts & Builder.Confs[B])
    /**
     * auto with tag when publish package
     *
     * support {@link Linearite.MacroSytax} variables
     *
     * @default "${{L_NAME}}@${{PKG_VERSION}}"
     */
    autoTag?: Inherit | boolean | string | ((pkgMeta: PKGMeta, conf: this) => string)
    /**
     * check commit message
     *
     * @default true
     */
    cmMsgRule?: Inherit | boolean
  }
}

export const defineConfiguration = <B extends Builder.Types>(conf: Linearite.Configuration<B>) => conf

export default Linearite
