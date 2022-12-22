import Linearite, { Context, Plugin, resolveBuilderOpts } from '@linearite/core'
import { merge, omit } from './utils'

type CalcBuilderConf =
  & Linearite.Configuration<Plugin.Names>
  & { builder: ReturnType<typeof resolveBuilderOpts>[1] }

export class OveridesService {
  public matrix: ReturnType<typeof Linearite.calcConfMatrix>
  constructor(
    public ctx: Context<Plugin.Names>
  ) {
    this.matrix = Linearite.calcConfMatrix(ctx.config)
  }
  calc(workspace: Linearite.Workspace) {
    const overideConfigs: Linearite.Configuration<Plugin.Names>[] = []
    this.matrix.forEach(link => {
      const conf = link.reduce((acc, [keys, computeConf]) => {
        // TODO 非第一个元素的其他矩阵组需要合并根的配置
        if (keys.length === 0) {
          return acc
        }
        return keys.reduce((acc, key) => {
          return acc + (workspace.meta.name.startsWith(key) ? 2 : 0)
        }, 0) > 0
          ? merge(acc, omit(computeConf, Linearite.InnerConfKeys))
          : acc
      }, {})
      if (Object.keys(conf).length > 0) {
        overideConfigs.push(conf)
      }
    })
    return overideConfigs
  }
}

Context.service('overides', OveridesService)
