import Linearite, { Plugin } from '@linearite/core'
import { omit } from '../utils'
import minimatch from 'minimatch'

const removeConfKeys = Linearite.InnerConfKeys.filter(key => key !== 'builder')

export function computeRelativeConfs(
  scope: string,
  matrix: ReturnType<typeof Linearite.calcConfMatrix>,
  workspaces: Linearite.Workspace[]
) {
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
              key,
              `@${scope}/${key}`
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

export default function (conf: Linearite.Configuration<Plugin.Names>, workspaces: Linearite.Workspace[]) {
}
