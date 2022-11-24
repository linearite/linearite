import chalk from 'chalk'

import { Context } from '@linearite/core'

import { OveridesService } from './overides'
import { WorkspacesService } from './workspaces'

declare module '@linearite/core' {
  export interface Context<N> {
    workspaces: WorkspacesService
    corlorful: import('chalk').Chalk
    overides: OveridesService
  }
}

Context.service('corlorful', class {
  constructor() {
    return chalk
  }
})
