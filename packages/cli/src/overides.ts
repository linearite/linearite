import Linearite, { Context, Plugin } from '@linearite/core'
import { merge } from './utils'

export class OveridesService {
  constructor(
    public ctx: Context<Plugin.Names>
  ) {
  }
  calc(workspace: string, c = this.ctx.config): Linearite.Configuration<Plugin.Names> {
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
    return merge(config, overideConfig)
  }
}

Context.service('overides', OveridesService)
