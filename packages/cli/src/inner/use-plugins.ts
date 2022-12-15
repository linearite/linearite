import Linearite, { Context, Plugin } from '@linearite/core'
import { omit } from '../utils'
import minimatch from 'minimatch'

const removeConfKeys = Linearite.InnerConfKeys.filter(key => key !== 'builder')

export function computeRelativeConfs(
  scope: Linearite.Configuration<Plugin.Names>['scope'],
  matrix: ReturnType<typeof Linearite.calcConfMatrix>,
  workspaces: Linearite.Workspace[]
) {
  const scopes = Array.isArray(scope) ? scope : [scope]
  const confs = [] as Linearite.Configuration<Plugin.Names>[]
  workspaces.forEach((workspace) => {
    const name = workspace.meta.name
    matrix.forEach(link => {
      let [preWeight, matchIndex] = [0, -1]
      link.forEach(([keys, computeConf], index) => {
        if (keys.length === 0) {}
        const weight = keys.length === 0
          ? 1
          : keys.reduce((acc, key) => {
            return acc + ([
              ...scopes.map(scope => `@${scope}/${key}`),
              key,
            ].reduce((b, glob) => b || minimatch(glob, name), false)
              ? 2
              : 0)
          }, 0)
        if (weight > preWeight) {
          preWeight = weight
          matchIndex = index
        }
      })
      if (matchIndex > -1) {
        confs.push(omit(link[matchIndex][1], removeConfKeys))
      }
    })
  })
  return confs
}

export default function (
  conf: Linearite.Configuration<Plugin.Names>,
  matrix: ReturnType<typeof Linearite.calcConfMatrix>,
  workspaces: Linearite.Workspace[]
) {
  const confs = computeRelativeConfs(conf.scope, matrix, workspaces)
  const plugins = [] as Plugin<Plugin.Names>[]
  confs
    .reduce((acc, conf) => {
      Object
        .keys(conf)
        .forEach(k => {
          if (k === 'builder') {
            const prop = conf[k]
            if (typeof prop === 'string') {
              acc.add(prop)
            } else if (typeof prop === 'boolean') {
              acc.add(Context.defaultBuilder)
            } else if (typeof prop === 'object') {
              prop.type && acc.add(prop.type)
            }
          } else {
            acc.add(k)
          }
        })
      return acc
    }, new Set<string>())
    .forEach(k => {
      try {
        plugins.push(Plugin.r(k as Plugin.Names))
      } catch (e) {
        console.error(e)
        console.warn(`you can use \`linearite plugin install ${k}\` to install plugin`)
      }
    })
  return plugins
}
