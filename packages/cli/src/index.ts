#!/usr/bin/env node
import * as fs from 'fs'
import * as path from 'path'

import { Command } from 'commander'
import Linearite, { Context, Plugin } from '@linearite/core'

import './services'
import './overrides'
import './logger'
import { store, INIT } from './workspaces'
import { onBuild } from './inner/on-build'
import usePlugins from './inner/use-plugins'

declare const PKG_VERSION: string
declare const PKG_DESCRIPTION: string

let isBuild = true

try {
  PKG_VERSION
  PKG_DESCRIPTION
} catch (e) {
  if (e instanceof ReferenceError) {
    isBuild = false
  } else {
    console.error(e)
  }
}

declare module '@linearite/core' {
  export interface Events<N, C> {
    'build:item'(workspace: Linearite.Workspace, opts?: Parameters<Events<N, C>['build']>[0]): void
  }
}

const { InnerConfKeys } = Linearite

const CONF_PATH = process.env.LINEARITE_CONF_PATH

function getConfPath() {
  if (CONF_PATH) {
    return CONF_PATH
  }
  const files = fs.readdirSync('.')
  const target = files.find(f => f.startsWith('linearite.config') || f.startsWith('.linearite.config'))
  if (target === undefined) {
    throw new Error('not found config file')
  }
  return target
}

function getConf(confPath?: string) {
  let conf: Linearite.Configuration<Plugin.Names>
  if (confPath.endsWith('.ts')) {
    require('esbuild-register/dist/node').register()
  }
  conf = require(
    path.resolve(confPath)
  ).default
  if (conf.scope) {
    conf.scope = Array.isArray(conf.scope) ? conf.scope : [conf.scope]
  } else {
    const pkg = require(path.resolve('package.json'))
    /**
     * match pkg name by rule:
     * | `@workspaces/${scope}`
     * | `workspaces-${scope}`
     * | `${scope}-workspace`
     * | `${scope}`
     */
    conf.scope = pkg.name.match(/@workspaces\/(.+)|workspaces-(.+)|(.+)-workspace|(.+)/)?.slice(1).filter(Boolean) ?? []
  }
  return conf
}

async function main() {
  const program = new Command('line')

  if (isBuild) {
    program
      .version(PKG_VERSION)
      .description(PKG_DESCRIPTION)
  } else {
    program
      .version('[internal build]')
      .description('linearite CLI(internal build).')
  }

  program
    .option('-c, --conf <path>', 'config file path', getConfPath())
    .option('-w, --workspaces <workspaces>', 'workspaces, support glob pattern and comma separated')

  /**
   * parse program global options
   */
  program.parseOptions(process.argv.slice(2))

  const {
    conf: confPath,
    workspaces: workspacesOpt,
  } = program.opts<{
    conf: string
    workspaces: string
  }>()

  const workspaceGlobStrArr = workspacesOpt?.split(',').map(w => w.trim()) ?? []

  await store[INIT]()

  const conf = getConf(confPath)
  const context = new Context(program, conf)

  const workspaces = workspaceGlobStrArr
    .map(w => {
      const prefixes = Array.isArray(conf.scope)
        ? conf.scope.map(s => `@${s}/*`)
        : [`@${conf.scope}/*`]
      prefixes.push('*')
      return prefixes
        .map(p => store[`${p}${w}`])
        .flat()
    })
    .flat()

  context
    .on('build', onBuild.bind(null, context, workspaces))

  context
    .on('ready', () => {
      const plugins = usePlugins(conf, context.overrides.matrix, workspaces)
      plugins.forEach(p => context.register(p))

      console.log(`loaded plugins ${
        // @ts-ignore
        plugins.map(p => p.name).join(', ')
      } for workspaces:\n${
        workspaces.map(w => `* ${w.meta.name}`).join('\n')
      }\n`)
      program.parse()
    })

  await context.start()
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
