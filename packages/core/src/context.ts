import * as cordis from 'cordis'
import type { Command } from 'commander'

import Linearite from './index'
import { Builder } from './builder'

export type Plugin<N extends Plugin.Names> = {
  name: N
} & (
  | {
    call: (ctx: Context<N>) => void
  }
  | (
    N extends `builder-${Builder.Types}`
      ? {
        conf: Linearite.BuilderOpts<N>
        call: (ctx: Context<N>, conf: Linearite.BuilderOpts<N>) => void
      }
      : never
  )
)

export const definePlugin = <N extends Plugin.Names>(plugin: Plugin<N>) => plugin

export namespace Plugin {
  export interface Confs {
  }
  export type Names = keyof Confs | (
    Builder.Types extends infer B
      ? B extends string
        ? `builder-${B}`
        : never
      : never
  )
  export function r<N extends Names>(n: N) {
    const l = ['@linearite/plugin-', 'linearite-plugin-', '']
    for (const p of l) {
      try {
        return require(`${p}${n}`).default as Plugin<N>
      } catch {}
    }
    throw new Error(`plugin ${n} not found`)
  }
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

export class Context<N extends Plugin.Names = Plugin.Names>
  extends cordis.Context<Context.Config<N>> {

  static defaultBuilder: Builder.Types = 'esbuild'

  constructor(public program: Command, options?: Context.Config<N>) {
    super(options)
    this.initBuild(program, options)
  }

  initBuild(program: Command, options?: Context.Config<`builder-${Builder.Types}`>) {
    let builderType: Builder.Types | undefined
    if (Linearite.isInherit(options?.builder)) {
      builderType = Context.defaultBuilder
    }
    program
      .command('build')
      .action(() => {
        console.log()
      })
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
    return this.commands[name] = this.program.command(name)
  }
}

export namespace Context {
  export type Config<N extends Plugin.Names> =
    & cordis.Context.Config
    & Linearite.Configuration<N>
}
