import mock from 'mock-fs'
import type FileSystem from 'mock-fs/lib/filesystem'
import { expect } from 'chai'
import Linearite from '@linearite/core'

import { createWorkspacesService, initWorkspaces, store } from '../src/workspaces'

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
      }),
      plugins: ['foo', 'fuo', 'fuu'].reduce((acc, cur) => ({
        ...acc,
        [cur]: createWorkspace({
          name: `@test/plugin-${cur}`,
        })
      }), {})
    })
    expect(store).to.be.empty
    await initWorkspaces(store)
    expect(Object.keys(store))
      .to.have.lengthOf(6)
      .and.to.include.members([
        '@test/foo',
        '@test/fuo',
        '@test/fuu',
        '@test/plugin-foo',
        '@test/plugin-fuo',
        '@test/plugin-fuu'
      ])
    mock.restore()
  })
  it('should get target workspace', async () => {
    mock({
      ...common,
      packages: ['foo', 'fuo', 'fuu'].reduce((acc, cur) => ({
        ...acc,
        [cur]: createWorkspace({
          name: `@test/${cur}`,
        })
      }), {})
    })
    await initWorkspaces(store)
    expect(store['@test/foo']).to.be.an('object')
    expect(store['@test/foo']).to.have.property('meta')
    expect(store['@test/foo'].meta).to.have.property('name', '@test/foo')
    expect(store['@test/foo']).to.have.property('path', 'packages/foo')
    mock.restore()
  })
  describe('Service', function () {
    const service = createWorkspacesService()
    before(async () => {
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
        }),
        plugins: ['foo', 'fuo', 'fuu'].reduce((acc, cur) => ({
          ...acc,
          [cur]: createWorkspace({
            name: `@test/plugin-${cur}`,
          })
        }), {})
      })
      await initWorkspaces(store)
      mock.restore()
    })

    it('should get all workspaces', async () => {
      expect(service.length).to.equal(6)
      expect(Array.from(service)).to.have.lengthOf(6)
    })
    it('should get workspaces by glob', async () => {
      expect(service['@test/*']).to.have.lengthOf(6)
      expect(service['@test/plugin-*']).to.have.lengthOf(3)
    })
  })
})
