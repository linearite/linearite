import Linearite, { Context, Plugin } from '@linearite/core'
import { merge, omit } from './utils'
import minimatch from 'minimatch'
import { removeConfKeys } from './inner/use-plugins'

export class overridesService {
  public matrix: ReturnType<typeof Linearite.calcConfMatrix>
  constructor(
    public ctx: Context<Plugin.Names>
  ) {
    this.matrix = Linearite.calcConfMatrix(ctx.config)
  }
  calc(workspace: Linearite.Workspace) {
    let { scope } = this.ctx.config
    let scopes: string[]
    if (!Array.isArray(scope))
      scopes = [scope]
    else
      scopes = scope

    const overrideConfigs: Linearite.Configuration<Plugin.Names>[] = []
    this.matrix.forEach((link, i) => {
      const conf = link.reduce((acc, [keys, computeConf]) => {
        if (keys.length === 0) {
          // keys 为 0 时意味着这是一个根配置，直接返回
          return omit(computeConf, removeConfKeys)
        }
        const weight = keys.reduce((acc, key) => {
          // TODO 处理其他的匹配模式，再将 use plugins 的逻辑和次数的统一维护
          return acc + ([
            ...scopes.map(scope => `@${scope}/${key}`),
            key,
          ].reduce((b, glob) => b || minimatch(workspace.meta.name, glob), false)
            ? 2
            : 0)
        }, 0)
        return weight <= 0 ? acc : merge(acc, omit(computeConf, removeConfKeys))
      }, {})
      if (Object.keys(conf).length > 0) {
        overrideConfigs.push(
          i === 0 ? conf : Object.assign(omit(this.ctx.config, removeConfKeys), conf)
        )
      }
    })
    return overrideConfigs
  }
}

Context.service('overrides', overridesService)
