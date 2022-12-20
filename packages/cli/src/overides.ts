import Linearite, { Context, Plugin, resolveBuilderOpts } from '@linearite/core'
import { merge } from './utils'

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
  calc(workspace: Linearite.Workspace, c = this.ctx.config) {
    // TODO analysis whether resolve matrix field's overides field
    const { overides, ...config } = c
    const keys = Object.keys(overides || {})
    let overideConfig: Linearite.Configuration<Plugin.Names> = {}
    if (keys.length > 0) {
      for (const key of keys) {
        if (workspace.meta.name.startsWith(key)) {
          overideConfig = merge(overideConfig, overides[key])
        }
      }
      overideConfig = this.calc(workspace, overideConfig)
    }
    let result = merge(config, overideConfig)
    // check is root callback
    if (c === this.ctx.config) {
      let [, builderOpts] = resolveBuilderOpts(result.builder)
      result.builder = builderOpts
    }
    return result as CalcBuilderConf
  }
  _calc(workspace: Linearite.Workspace, c = this.ctx.config) {
    const overideConfs: Linearite.Configuration<Plugin.Names>[] = []
    // TODO clac every matrix items link overides
  }
}

Context.service('overides', OveridesService)
