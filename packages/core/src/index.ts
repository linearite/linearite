import { Builder } from './builder'
import { Plugin } from './context'
import { U2I } from './type'

export * from './type'
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
  export interface Workspace {
    name: string
    version: string
    description: string
    dependencies: Record<string, string>
    devDependencies: Record<string, string>
  }
  export const InnerConfKeys = ['matrix', 'builder', 'overides'] as const
  export type Configuration<N extends Plugin.Names> = {
    /**
     * builder config
     */
    builder?:
      | Linearite.Inherit
      | boolean
      | Builder.Types
      | Builder.Opts & U2I<
        N extends N
          ? N extends Plugin.Builders
            ? Builder.Confs[Builder.InferName<N>]
          : never
          : never
      >
  } & Pick<Plugin.Confs, Exclude<N, Plugin.Builders>>
}

export const defineConfiguration = <N extends Plugin.Names>(conf: Linearite.Configuration<N>) => conf

export default Linearite
