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
})

export const definePlugin = <N extends Plugin.Names>(plugin: Plugin<N>) => plugin

export namespace Plugin {
  export interface Confs {
  }
  export type Names = keyof Confs
}

export interface Events<
  N extends Plugin.Names,
  C extends Context<N> = Context<N>
> extends cordis.Events<C> {
}

export interface Context<N> {
  [Context.config]: Context.Config<N>
  [Context.events]: Events<N, this>
}

export class Context<N extends Plugin.Names>
  extends cordis.Context<Context.Config<N>> {
  constructor(public program: Command, options?: Context.Config<N>) {
    super(options)
  }

  public commands: Record<string, Command> = {}

  command(name: string) {
    if (name === 'build') {
      // forbid register build command
      throw new Error('build command is reserved')
    }
    return this.#command(name)
  }

  #command(name: string) {
    const c = this.program.command(name)
    this.commands[name] = c
    return c
  }
}

export namespace Context {
  export type Config<N extends Plugin.Names> = cordis.Context.Config & Linearite.Configuration<N>
}
