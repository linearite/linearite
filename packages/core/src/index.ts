import { Builder, BuilderConfs } from './builder'
import { Plugin } from './context'
import { L2T, U2I } from './type'

export * from './type'
export * from './utils'
export * from './builder'
export * from './context'

export function compileMacroSyntax(str: string, workspace: Linearite.Workspace): string {
  const macroSyntax: L2T<Linearite.MacroSyntax> = [
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
  export type MacroSyntax =
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
      types?: string
      module?: string
      version?: string
      description?: string
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      optionalDependencies?: Record<string, string>
    }
    path: string
  }
  export interface FuzzyConfMap {
    /**
     * support fuzzy prefix matching
     * @example
     * | 'file://packages/*'
     *
     * | '@scope/*'
     */
    [K: string]: Configuration<Plugin.Names>
  }
  interface DefaultConf<N extends Plugin.Names = Plugin.Names> {
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
    exclude?: string[]
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
    matrix?: FuzzyConfMap
    overrides?: FuzzyConfMap
  }
  export const InnerConfKeys = ['scope', 'exclude', 'builder', 'matrix', 'overrides'] as L2T<keyof DefaultConf>
  export type Configuration<N extends Plugin.Names> =
    & DefaultConf<N>
    & Pick<Plugin.Confs, Exclude<N, Plugin.Builders>>
  export function confFieldWalker<
    N extends Exclude<Plugin.Names, Plugin.Builders> | 'builder',
    T extends any,
    NN extends N extends 'builder' ? Plugin.Builders : N
  >(
    name: N, conf: Configuration<Plugin.Names>,
    walker: (field: Configuration<Plugin.Names>[N], k: string[]) => T,
    prefix = []
  ): T[] {
    const fields: T[] = []
    if (conf[name])
      fields.push(walker(conf[name], prefix))

    Object.entries(
      conf.matrix || {}
    ).concat(Object.entries(
      conf.overrides || {}
    )).forEach(([key, conf]) => {
      fields.push(...confFieldWalker(
        name, conf, walker, prefix.concat(key)
      ))
    })
    return fields
  }
  /**
   * 计算配置矩阵
   * `conf.matrix` 字段触发新增配置线
   * `conf.overrides` 字段触发往当前配置线中新增规则
   * 输出一个多条配置线的配置矩阵
   */
  export function calcConfMatrix(
    c: Configuration<Plugin.Names>,
    matrix: [keys: string[], conf: Configuration<Plugin.Names>][][] = [],
    index = 0,
    prefix: string[] = []
  ) {
    if (!matrix[index]) {
      matrix.push([])
    }
    matrix[index].push([prefix, c])
    if (c.matrix) {
      Object.entries(c.matrix).forEach(([key, conf], i) => {
        calcConfMatrix(conf, matrix, matrix.length, prefix.concat(key))
      })
    }
    if (c.overrides) {
      Object.entries(c.overrides).forEach(([key, conf]) => {
        calcConfMatrix(conf, matrix, index, prefix.concat(key))
      })
    }
    return matrix
  }
}

export const defineConfiguration = <N extends Plugin.Names>(conf: Linearite.Configuration<N>) => conf

export default Linearite
