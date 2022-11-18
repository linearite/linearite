import glob from 'minimatch'
import Linearite, { Context } from '@linearite/core'
import Workspace = Linearite.Workspace
import * as fs from 'fs'
import * as path from 'path'

export type Workspaces = Record<string, Workspace[]>

declare module '@linearite/core' {
  export interface Context<N> {
    workspaces: Workspaces & IterableIterator<Workspace>
  }
}

export async function treeDirPaths(dir: string, opts = {
  exclude: ['node_modules', '.git'],
}) {
  const paths = await fs.promises.readdir(dir)
  const dirs = (
    await Promise.all(paths
      .map(async p => {
        if (opts.exclude.includes(p)) {
          return null
        }
        const stat = await fs.promises.stat(path.resolve(dir, p))
        return stat.isDirectory() ? p : null
      })
    )
  )
    .filter(Boolean)
  await Promise.all(dirs.map(async d => {
    const subPaths = await treeDirPaths(path.resolve(dir, d), opts)
    dirs.push(...subPaths.map(p => path.join(d, p)))
  }))
  return dirs
}

export async function initWorkspaces(store: Record<string, Workspace>) {
  const root = process.cwd()
  const workspaceMeta = JSON.parse(
    fs.readFileSync(path.resolve(
      root,
      'package.json'
    )).toString()
  )
  const workspaces = workspaceMeta.workspaces
  if (workspaces === undefined) {
    throw new Error('not found workspaces')
  }
  const workspacesGlob = Array.isArray(workspaces) ? workspaces : [workspaces]
  const allDirs = await treeDirPaths(root)
  const dirs = allDirs.filter(d => workspacesGlob.some(g => glob(d, g)))
  const workspacesMetas = await Promise.all(dirs.map(async d => JSON.parse(
    (
      await fs.promises.readFile(path.resolve(
        root,
        d,
        'package.json'
      ))
    ).toString()
  )))
  workspacesMetas.forEach(meta => {
    store[meta.name] = {
      meta,
      dir: path.resolve(root, meta.name),
    }
  })
}

Context.service('workspaces', class {
  constructor(root: Context) {
    const store: Record<string, Workspace> = {}
    initWorkspaces(store)
      .catch(e => {
        console.error(e)
        process.exit(1)
      })

    return new Proxy({} as Workspaces, {
      get(target, key) {
        const keys = Object.keys(store)
        switch (key) {
          case Symbol.iterator:
            return function* () {
              for (const key of keys) {
                yield store[key]
              }
            }
          case 'length':
            return keys.length
        }
        if (typeof key === 'string') {
          return glob
            .match(keys, key)
            .map(key => store[key])
        }
      }
    })
  }
})
