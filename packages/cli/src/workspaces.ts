import glob from 'minimatch'
import Linearite, { Context } from '@linearite/core'
import Workspace = Linearite.Workspace

export type Workspaces = Record<string, Workspace[]>

declare module '@linearite/core' {
  export interface Context<N> {
    workspaces: Workspaces & IterableIterator<Workspace>
  }
}

Context.service('workspaces', class {
  constructor(root: Context) {
    const store: Record<string, Workspace> = {}

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
