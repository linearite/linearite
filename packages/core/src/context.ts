import * as cordis from 'cordis'
import type { Command } from 'commander'

import Linearite from './index'
import { Builder } from './builder'

export type Plugin<N extends Plugin.Names> = {
  type: string
  name: N
} & ({
  type: 'command'
  call: (ctx: Context<N>) => void
} | {
  type: 'builder'
  conf: Omit<Builder.Opts, 'type'> & Plugin.Confs[N]
  call: (ctx: Context<N>, opts: Omit<Builder.Opts, 'type'> & Plugin.Confs[N]) => void
})

export const definePlugin = <N extends Plugin.Names>(plugin: Plugin<N>) => plugin

export namespace Plugin {
  export interface Confs extends Builder.Confs {}
  export type Names = keyof Confs
  function isPlugin(v: any): v is Plugin<Names> {
    return v
      && typeof v === 'object'
      && 'type' in v
      && 'name' in v
      && 'call' in v
  }
  export function r<N extends Plugin.Names>(name: N) {
    const prefixArr = ['@linearite/plugin-', 'linearite-plugin-', '']
    let module: Plugin<N> | undefined
    let error: Error | undefined
    for (const prefix of prefixArr) {
      try {
        module = require(`${prefix}${name}`).default
        if (!isPlugin(module)) {
          module = undefined
          // noinspection ExceptionCaughtLocallyJS
          throw new Error(`Plugin ${name} is not valid`)
        }
        break
      } catch (e) {
        error = e
      }
    }
    if (!module) {
      throw error
    }
    return module
  }
}

export interface Events<C extends Context<Builder.Types> = Context<Builder.Types>> extends cordis.Events<C> {
}

export interface Context<B> {
  [Context.config]: Context.Config<B>
  [Context.events]: Events<this>
}

export class Context<B extends Builder.Types> extends cordis.Context<Context.Config<B>> {
  constructor(
    public program: Command,
    options?: Context.Config<B>,
  ) {
    super(options)
    options.builder && this.initBuilder(program, options)
  }

  initBuilder(
    program: Command,
    options?: Context.Config<B>,
  ) {
    let builderOpts: string | Builder.Opts & Builder.Confs[B]
    if (Linearite.isInherit(options.builder)) {
      builderOpts = 'esbuild'
    } else {
      if (
        typeof options.builder === 'string'
        || typeof options.builder === 'object'
      ) {
        builderOpts = options.builder
      }
    }
    if (typeof builderOpts === 'string') {
      const plugin = Plugin.r(builderOpts as Builder.Types)
      if (plugin.type !== 'builder') {
        throw new Error(`plugin ${builderOpts} is not a builder`)
      }
      plugin.call(this, plugin.conf)
    }
    if (typeof builderOpts === 'object') {
      const plugin = Plugin.r(builderOpts.type)
      if (plugin.type !== 'builder') {
        throw new Error(`plugin ${builderOpts.type} is not a builder`)
      }
      plugin.call(this, builderOpts)
    }
    program.command('build')
      .action(() => {
        console.log('build')
      })
  }

  regiter(plugin: Plugin<any>) {
    if (plugin.type === 'command') {
      plugin.call(this)
    } else if (plugin.type === 'builder') {
      throw new Error('builder plugin should not be registered')
    } else {
      throw new Error(`unknown plugin type: ${
        // @ts-ignore
        plugin.type
      }`)
    }
  }
}

export namespace Context {
  export interface Config<B extends Builder.Types> extends cordis.Context.Config, Linearite.Configuration<B> {
  }
}
