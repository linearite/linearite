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
  matrix.forEach(link => {
    let [preWeight, matchIndex] = [0, -1]
    link.forEach(([keys, computeConf], index) => {
      if (keys.length === 0) {}
      const weight = keys.length === 0
        ? 1
        : keys.reduce((acc, key) => {
          return acc + workspaces.reduce((acc, workspace) => {
            const name = workspace.meta.name
            return [
              minimatch(key, name),
              minimatch(`@${scope}/${key}`, name)
            ].reduce((b, m) => b || m, false) ? 1 : 0
          }, 0)
        }, 1)
      if (weight > preWeight) {
        preWeight = weight
        matchIndex = index
      }
    })
    if (matchIndex > -1) {
      confs.push(omit(link[matchIndex][1], removeConfKeys))
    }
  })
  return confs
}

export default function (conf: Linearite.Configuration<Plugin.Names>, workspaces: Linearite.Workspace[]) {
}
