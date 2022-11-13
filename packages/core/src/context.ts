import * as cordis from 'cordis'
import type { Command } from 'commander'

import Linearite from './index'
import { Builder } from './builder'

export type BuilderPlugin<N extends Plugin.Names> = N extends `builder-${Builder.Types}`
  ? {
    name: N
    conf: Omit<Linearite.BuilderOpts<N>, 'type'>
    call: (ctx: Context<N>, conf: Omit<Linearite.BuilderOpts<N>, 'type'>) => void
  }
  : never

export type Plugin<N extends Plugin.Names> = {
  name: N
} & (
  | {
    call: (ctx: Context<N>) => void
  }
  | BuilderPlugin<N>
)

export const definePlugin = <N extends Plugin.Names>(plugin: Plugin<N>) => plugin

export namespace Plugin {
  export interface Confs {
  }
  export type Builders = Builder.Types extends (infer B extends string)
    ? `builder-${B}`
    : never
  export type Names = keyof Confs | Builders
  export function r<N extends Names>(n: N) {
    const l = ['@linearite/plugin-', 'linearite-plugin-', '']
    for (const p of l) {
      try {
        return require(`${p}${n}`).default as Plugin<N>
      } catch {}
    }
    throw new Error(`plugin ${n} not found`)
  }
  export function isBuilder<N extends Names>(p: Plugin<N>): p is BuilderPlugin<N> {
    return p.name.startsWith('builder-')
  }
  export function isNotBuilder<N extends Names>(p: Plugin<N>): p is Exclude<Plugin<N>, BuilderPlugin<N>> {
    return !isBuilder(p)
  }
}

export interface Events<
  N extends Plugin.Names,
  C extends Context<N> = Context<N>
> extends cordis.Events<C> {
  /**
   * supplement cli package, builder plugin is not care about this event
   *
   * @param workspaces
   */
  'build'(workspaces?: string[]): void
}

export interface Context<N> {
  [Context.config]: Context.Config<N>
  [Context.events]: Events<N, this>
}

/**
 * @internal
 */
const CommandSymbol = Symbol('command')

function registerBuildCommand<N extends Plugin.Names = Plugin.Names>(ctx: Context<N>) {
  ctx
    [CommandSymbol]('build')
    .action(async (options: {
      workspaces?: string[]
    }) => {
      await ctx.parallel('build', options.workspaces)
    })
}

export class Context<N extends Plugin.Names = Plugin.Names>
  extends cordis.Context<Context.Config<N>> {

  static defaultBuilder: Builder.Types = 'esbuild'

  constructor(public program: Command, options?: Context.Config<N>) {
    super(options)
    this.initBuild(program, options)
  }

  initBuild(program: Command, options?: Context.Config<Plugin.Builders>) {
    if (!options.builder)
      return

    let isInherit = Linearite.isInherit(options.builder)
    let builderType: Builder.Types | undefined
    if (isInherit) {
      builderType = Context.defaultBuilder
    }
    if (typeof options.builder === 'object') {
      builderType = options.builder.type
    }
    const builder = Plugin.r(`builder-${builderType}`)
    if (Plugin.isBuilder(builder)) {
      const builderOpts = isInherit
        ? builder.conf
        : typeof options.builder === 'object'
          ? options.builder
          : builder.conf

      // @ts-ignore
      builder.call(this, builderOpts)
      registerBuildCommand(this)
    } else
      throw new Error(`"builder-${builderType}" is not a builder plugin`)
  }

  public commands: Record<string, Command> = {}

  command(name: string) {
    if (name === 'build') {
      // forbid register build command
      throw new Error('build command is reserved')
    }
    return this[CommandSymbol](name)
  }

  [CommandSymbol](name: string) {
    return this.commands[name] = this.program
      .command(name)
      .option('-w, --workspaces <workspaces>', 'workspaces, support glob pattern and comma separated')
  }

  register<N extends Plugin.Names>(plugin: Plugin<N>) {
    if (Plugin.isBuilder(plugin)) {
      // forbid register builder plugin
      throw new Error('builder plugin is reserved')
    }
    if (Plugin.isNotBuilder(plugin)) {
      plugin.call(this as any)
    }
  }
}

export namespace Context {
  export type Config<N extends Plugin.Names> =
    & cordis.Context.Config
    & Linearite.Configuration<N>
}
