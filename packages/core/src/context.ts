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
  call: (ctx: Context<N>, opts: Builder.Opts & Plugin.Confs[N]) => void
})

export const definePlugin = <N extends Plugin.Names>(plugin: Plugin<N>) => plugin

export namespace Plugin {
  export interface Confs extends Builder.Confs {}
  export type Names = keyof Confs
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
  }

  regiter<N extends Plugin.Names>(plugin: Plugin<N>) {}
}

export namespace Context {
  export interface Config<B extends Builder.Types> extends cordis.Context.Config, Linearite.Configuration<B> {
  }
}
