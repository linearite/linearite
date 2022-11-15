import * as cordis from 'cordis'
import type { Command } from 'commander'

import Linearite from './index'
import { Builder } from './builder'

type BuilderPluginConf<N extends Plugin.Names> = Omit<Builder.Configuration<N>, 'type'>

export type BuilderPlugin<N extends Plugin.Names> = N extends `builder-${Builder.Types}`
  ? {
    name: N
    conf: BuilderPluginConf<N>
    call: (ctx: Context<N>, conf: BuilderPluginConf<N>) => void
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
   */
  'build'(workspaces?: string[], opts?: {
    /**
     * tell build plugin need watch file change
     */
    isWatch?: boolean
  }): void
}

export interface Context<N> {
  [Context.config]: Context.Config<N>
  [Context.events]: Events<N, this>
}

/**
 * @internal
 */
const CommandSymbol = Symbol('command')

/**
 * @internal
 */
const RegisterSymbol = Symbol('register')

function registerBuildCommand<N extends Plugin.Names = Plugin.Names>(ctx: Context<N>) {
  ctx
    [CommandSymbol]('build')
    .description('build workspaces')
    .option('-w, --watch', 'watch file change')
    .action(async (options: {
      watch: boolean
      workspaces?: string
    }) => {
      await ctx.parallel('build', options.workspaces.split(','), {
        isWatch: options.watch
      })
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
    } else {
      if (typeof options.builder === 'string') {
        builderType = options.builder as Builder.Types
      }
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
      this[RegisterSymbol](builder)
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

  public plugins: Record<string, Plugin<Plugin.Names>> = {}

  register<N extends Plugin.Names>(plugin: Plugin<N>) {
    if (Plugin.isBuilder(plugin)) {
      // forbid register builder plugin
      throw new Error('builder plugin is reserved')
    }
    this[RegisterSymbol](plugin)
  }

  [RegisterSymbol]<N extends Plugin.Names>(plugin: Plugin<N>) {
    // @ts-ignore
    this.plugins[plugin.name] = plugin

    if (Plugin.isBuilder(plugin)) {
      return
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
