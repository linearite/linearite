import mock from 'mock-fs'
import type FileSystem from 'mock-fs/lib/filesystem'
import Linearite from '@linearite/core'
import { initWorkspaces, store } from '../src/workspaces'
import { expect } from 'chai'

function createWorkspace(pkg: Linearite.Workspace['meta']) {
  return {
    'package.json': JSON.stringify(pkg)
  } as FileSystem.DirectoryItems
}

describe('Workspaces', function () {
  const common: FileSystem.DirectoryItems = {
    'package.json': JSON.stringify({
      name: 'test-workspaces',
      workspaces: ['packages/*', 'plugins/*']
    })
  }
  it('should init workspaces', async () => {
    mock({
      ...common,
      packages: ['foo', 'fuo', 'fuu'].reduce((acc, cur) => ({
        ...acc,
        [cur]: createWorkspace({
          name: `@test/${cur}`,
        })
      }), {
        // test empty folder
        'bar': {}
      })
    })
    expect(store).to.be.empty
    await initWorkspaces(store)
    expect(Object.keys(store))
      .to.have.lengthOf(3)
  })
})
