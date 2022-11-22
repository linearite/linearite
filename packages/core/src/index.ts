import { Builder, BuilderConfs } from './builder'
import { Plugin } from './context'
import { L2T, U2I } from './type'

export * from './type'
export * from './builder'
export * from './context'

export function compileMacroSyntax(str: string, workspace: Linearite.Workspace): string {
  const macroSyntax: L2T<Linearite.MacroSytax> = [
    'PKG_NAME',
    'PKG_VERSION',
    'PKG_DESCRIPTION',
    'L_NAME'
  ]
  // support space in `${{ }}`, like `${{  PKG_NAME  }}`
  const macroSyntaxReg = new RegExp(`\\$\\{{\\s*(${macroSyntax.join('|')})\\s*}}`, 'g')
  return str.replace(macroSyntaxReg, (_, macro) => {
    switch (macro) {
      case 'PKG_NAME':
        return workspace.meta.name
      case 'PKG_VERSION':
        return workspace.meta.version
      case 'PKG_DESCRIPTION':
        return workspace.meta.description
      case 'L_NAME':
        return workspace.meta.name.replace(/^@[^/]+\//, '')
    }
  })
}

export namespace Linearite {
  export type MacroSytax =
    | `PKG_${ 'NAME' | 'VERSION' | 'DESCRIPTION' }`
    // (pkgName = '@scope/name') => name
    | 'L_NAME'
  export type Inherit = 'auto' | 'inherit' | true
  export function isInherit(v: any): v is 'inherit' {
    return ['auto', 'inherit', true].includes(v)
  }
  export interface Workspace {
    meta: {
      name?: string
      main?: string
      module?: string
      version?: string
      description?: string
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      optionalDependencies?: Record<string, string>
    }
    path: string
  }
  export const InnerConfKeys = ['scope', 'builder', 'overides'] as const
  export type Configuration<N extends Plugin.Names> = {
    /**
     * scope of workspace, support multi scope
     *
     * @default package name, rule:
     *                              | `@workspaces/${scope}`
     *
     *                              | `workspaces-${scope}`
     *
     *                              | `${scope}-workspace`
     *
     *                              | `${scope}`
     */
    scope?: string | string[]
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
            ? BuilderConfs[Builder.InferName<N>]
          : never
          : never
      >
    /**
     * key support fuzzy prefix matching
     * @example
     * {
     *   'scope@plugin-': {
     *     // ...
     *   }
     * }
     */
    overides?: Record<string, Configuration<Plugin.Names>>
  } & Pick<Plugin.Confs, Exclude<N, Plugin.Builders>>
}

export const defineConfiguration = <N extends Plugin.Names>(conf: Linearite.Configuration<N>) => conf

export default Linearite
