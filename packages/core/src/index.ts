import { Builder } from './builder'
import { Plugin } from './context'

export * from './builder'
export * from './context'

export namespace Linearite {
  export type MacroSytax =
    | `PKG_${ 'NAME' | 'VERSION' }`
    // (pkgName = '@scope/name') => name
    | 'L_NAME'
  export type Inherit = 'auto' | 'inherit' | true
  export function isInherit(v: any): v is 'inherit' {
    return ['auto', 'inherit', true].includes(v)
  }
  export interface PKGMeta {
    name: string
    version: string
    description: string
  }
  export type BuilderOpts<N extends Plugin.Names> =
    & Builder.Opts
    & Builder.Confs[
      Builder.InferName<N>
    ]
  export type BuilderProp<N extends Plugin.Names> =
    | Linearite.Inherit
    | boolean
    | Builder.Types
    | BuilderOpts<N>
  export interface Confs<N extends Plugin.Names> {
    /**
     * builder config
     */
    builder?: {
      matrix?: {}
      builder?: BuilderProp<N>
    }
  }
  export type Configuration<N extends Plugin.Names> =
    N extends N
      ? N extends Plugin.Builders
        ? Confs<N>['builder']
      : N extends keyof Plugin.Confs
        ? Plugin.Confs[N]
      : never
      : never
}

export const defineConfiguration = <N extends Plugin.Names>(conf: Linearite.Configuration<N>) => conf

export default Linearite
