import Linearite, { Context, Plugin, resolveBuilderOpts } from '@linearite/core'
import { merge } from './utils'

type CalcBuilderConf =
  & Linearite.Configuration<Plugin.Names>
  & { builder: ReturnType<typeof resolveBuilderOpts>[1] }

export class OveridesService {
  constructor(
    public ctx: Context<Plugin.Names>
  ) {
  }
  calc(workspace: string, c = this.ctx.config) {
    const { overides, ...config } = c
    const keys = Object.keys(overides || {})
    let overideConfig: Linearite.Configuration<Plugin.Names> = {}
    if (keys.length > 0) {
      for (const key of keys) {
        if (workspace.startsWith(key)) {
          overideConfig = merge(overideConfig, overides[key])
        }
      }
      overideConfig = this.calc(workspace, overideConfig)
    }
    let result = merge(config, overideConfig)
    // check is root callback
    if (c === this.ctx.config) {
      let [builder, builderOpts] = resolveBuilderOpts(result.builder)
      result.builder = builderOpts
      // TODO resolve builder
    }
    return result as CalcBuilderConf
  }
}

Context.service('overides', OveridesService)
