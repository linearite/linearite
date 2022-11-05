import * as cordis from 'cordis'

import Linearite from './index'
import { Builder } from './builder'

export type Plugin<N extends Builder.Types> = {
  type: string
  name: N
} & ({
  type: 'command'
  call: (ctx: Context<N>) => void
} | {
  type: 'builder'
  call: (ctx: Context<N>, opts: Builder.Opts & Builder.Confs[N]) => void
})

export const definePlugin = <N extends Builder.Types>(plugin: Plugin<N>) => plugin

export interface Events<C extends Context<Builder.Types> = Context<Builder.Types>> extends cordis.Events<C> {
}

export interface Context<B> {
  [Context.config]: Context.Config<B>
  [Context.events]: Events<this>
}

export class Context<B extends Builder.Types> extends cordis.Context<Context.Config<B>> {
  constructor(options?: Context.Config<B>) {
    super(options)
  }
}

export namespace Context {
  export interface Config<B extends Builder.Types> extends cordis.Context.Config, Linearite.Configuration<B> {
  }
}
