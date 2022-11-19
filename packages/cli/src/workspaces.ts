import * as fs from 'fs'
import * as path from 'path'

import glob from 'minimatch'
import Linearite, { Context } from '@linearite/core'
import Workspace = Linearite.Workspace

import { isPromiseFulfilledResult, treeDirPaths } from './utils'

declare module '@linearite/core' {
  export interface Context<N> {
    workspaces: WorkspacesService
  }
}

export type Workspaces = Record<string, Workspace[]>

export const INNER = Symbol('inner')

export type WorkspacesService =
  & Workspace[]
  & Record<string, Workspace[]>
  & IterableIterator<Workspace>
  & {
    [INNER]: Workspace[]
  }

const innerStore: Record<string, Workspace> = {}

export const store = new Proxy({} as WorkspacesService, {
  get(target, key) {
    const keys = Object.keys(innerStore)
    switch (key) {
      case Symbol.iterator:
        return function* () {
          for (const key of keys) {
            yield innerStore[key]
          }
        }
      case INNER:
        return innerStore
      case 'length':
        return keys.length
    }
    if (typeof key === 'string') {
      if (Number.isInteger(+key)) {
        return innerStore[keys[+key]]
      }
      return glob
        .match(keys, key)
        .map(key => innerStore[key])
    }
  }
})

export async function initWorkspaces() {
  const root = process.cwd()
  const workspaceMeta = JSON.parse(
    fs.readFileSync(path.resolve(
      root,
      'package.json'
    )).toString()
  )
  const workspacesProp = workspaceMeta.workspaces
  if (workspacesProp === undefined) {
    throw new Error('not found workspaces')
  }
  const workspacesGlob = Array.isArray(workspacesProp) ? workspacesProp : [workspacesProp]
  const allDirs = await treeDirPaths(root)
  const dirs = allDirs.filter(d => workspacesGlob.some(g => glob(d, g)))
  const promiseResults = await Promise.allSettled<Workspace>(dirs.map(async d => {
    const pkgPath = path.resolve(root, d, 'package.json')
    if (
      !await fs.promises.stat(pkgPath)
        .then(() => true)
        .catch(() => false)
    ) {
      throw new Error(`not found package.json in ${d}`)
    }
    return {
      meta: JSON.parse(
        (
          await fs.promises.readFile(pkgPath)
        ).toString()
      ),
      path: d,
    }
  }))
  const workspaces = promiseResults
    .map(r => {
      if (r.status === 'rejected') {
        if (r.reason instanceof Error) {
          console.warn(r.reason.message)
        } else {
          console.error(r.reason)
        }
      }
      return r
    })
    .filter(isPromiseFulfilledResult)
    .map(r => r.value)
  workspaces.forEach(w => innerStore[w.meta.name] = w)
}

Context.service('workspaces', class {
  constructor(root?: Context) { return store }
})
