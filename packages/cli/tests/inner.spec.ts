import { Command } from 'commander'

import { Context, Linearite, Plugin } from '@linearite/core'
import { onBuild } from '../src/inner/on-build'
import { expect } from 'chai'
import { computeRelativeConfs } from '../src/inner/use-plugins'

describe('inner', function () {
  describe('onBuild', function () {
    const ctx = new Context(new Command(), {})
    it('should trigger build:item when trigger build', function (done) {
      setTimeout(async () => {
        ctx.emit('build')
        await new Promise(re => setTimeout(re, 10))
        done('don\'t trigger build:item')
      }, 10)
      ctx.on('build', onBuild.bind(this, ctx, [
        {
          meta: { name: 'foo' },
          path: 'packages/foo'
        }
      ]))
      ctx.on('build:item', workspace => {
        try {
          expect(workspace).to.be.deep.equal({
            meta: { name: 'foo' },
            path: 'packages/foo'
          })
        } catch (e) {
          done(e)
        }
        done()
      })
    })
  })
  describe('usePlugins', function () {
    it('should compute relative confs', function () {
      const matrix = Linearite.calcConfMatrix({
        builder: 'esbuild',
        tag: 'test',
        matrix: {
          '*': {
            tag: 'test-*'
          },
          foo: { builder: 'dts' },
          bar: {
            tag: 'test-bar'
          }
        },
        overides: {
          fuu: { builder: 'dts' },
          foo: {
            tag: 'test-foo'
          }
        }
      })
      expect(
        computeRelativeConfs('test', matrix, [{
          meta: { name: '@test/foo' },
          path: 'packages/foo'
        }])
      ).to.be.deep.equal([
        { tag: 'test-foo' },
        { tag: 'test-*' },
        { builder: 'dts' }
      ])
      expect(
        computeRelativeConfs('test', matrix, [{
          meta: { name: '@test/bar' },
          path: 'packages/bar'
        }, {
          meta: { name: '@test/fuu' },
          path: 'packages/fuu'
        }])
      ).to.be.deep.equal([
        { builder: 'esbuild', tag: 'test' },
        { tag: 'test-*' },
        { tag: 'test-bar' },
        { builder: 'dts' }
      ])
    })
  })
})
