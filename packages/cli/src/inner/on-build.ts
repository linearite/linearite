import inquirer from 'inquirer'

import Linearite, { Context, Plugin } from '@linearite/core'

import { store } from '../workspaces'

export const onBuild = async (context: Context<Plugin.Names>, workspaces: Linearite.Workspace[], opts) => {
  let curWorkspaces = workspaces
  if (curWorkspaces.length === 0) {
    const allWorkspaces = [...store]
    if (opts.all) {
      curWorkspaces = allWorkspaces
    } else {
      let choices = [ 'all' ].concat(allWorkspaces.map(({ meta }) => meta.name))
      const result = await inquirer.prompt<{
        workspaces: string[]
      }>([{
        type: 'checkbox',
        loop: false,
        name: 'workspaces',
        message: 'select target workspaces',
        validate(input: string[]) {
          if (input.length > 1 && input.includes('all')) {
            return 'you can only select all or other workspaces'
          }
          return input.length > 0
        },
        choices
      }])
      if (result.workspaces.includes('all')) {
        curWorkspaces = allWorkspaces
      } else {
        curWorkspaces = result.workspaces
          .map(w => store[w])
          .flat()
      }
    }
  } else {
    if (opts.all) {
      console.warn('ignore --all option')
    }
  }
  if (curWorkspaces.length === 0) {
    console.warn('no workspaces to build')
    return
  }
  return Promise.all(curWorkspaces?.map(async workspace => {
    await context.parallel('build:item', workspace, opts)
  }))
}
