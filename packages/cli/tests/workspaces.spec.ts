import mock from 'mock-fs'
import type FileSystem from 'mock-fs/lib/filesystem'
import { expect } from 'chai'
import Linearite from '@linearite/core'

import { initWorkspaces, INNER, store } from '../src/workspaces'

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
  let innerS = store[INNER]
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
    expect(innerS).to.be.empty
    await initWorkspaces()
    expect(Object.keys(innerS))
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
    await initWorkspaces()
    expect(innerS['@test/foo']).to.be.an('object')
    expect(innerS['@test/foo']).to.have.property('meta')
    expect(innerS['@test/foo'].meta).to.have.property('name', '@test/foo')
    expect(innerS['@test/foo']).to.have.property('path', 'packages/foo')
    mock.restore()
  })
  describe('Service', function () {
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
      await initWorkspaces()
      mock.restore()
    })

    it('should get all workspaces', async () => {
      expect(store.length).to.equal(6)
      expect(Array.from(store)).to.have.lengthOf(6)
    })
    it('should get workspaces by glob', async () => {
      expect(store['@test/*']).to.have.lengthOf(6)
      expect(store['@test/plugin-*']).to.have.lengthOf(3)
    })
  })
})
