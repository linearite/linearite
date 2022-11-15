#!/usr/bin/env node
import * as fs from 'fs'
import * as path from 'path'

import { Command } from 'commander'
import Linearite, { Context, Plugin } from '@linearite/core'
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

function getConf() {
  const confPath = getConfPath()
  if (confPath.endsWith('.ts')) {
    require('esbuild-register/dist/node').register()
  }
  return require(
    path.resolve(
      process.cwd(),
      confPath
    )
  ).default
}

async function main() {
  const program = new Command('line')

  program
    .version('0.0.1')

  const conf = getConf()
  const context = new Context(program, conf)
  Object
    .keys(conf)
    .filter(k => !InnerConfKeys.includes(k as typeof InnerConfKeys[number]))
    .forEach(k => {
      try {
        const plugin = Plugin.r(k as Plugin.Names)
        context.register(plugin)
      } catch (e) {
        console.error(e)
        console.warn(`you can use \`linearite plugin ${k}\` to install plugin`)
      }
    })

  program.parse()
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
