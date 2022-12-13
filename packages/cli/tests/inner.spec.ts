import { Command } from 'commander'

import { Context, Linearite, Plugin } from '@linearite/core'
import { onBuild } from '../src/inner/on-build'
import { expect } from 'chai'
import { computeRelativeConfs } from '../src/inner/register-plugins'

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
  describe('registerPlugins', function () {
    it('should compute relative confs', function () {
      const conf = {
        builder: 'esbuild',
        tag: 'test',
        matrix: {
          foo: { builder: 'dts' },
          bar: { builder: 'esbuild' }
        },
        overides: {
          fuu: { builder: 'dts' },
          foo: {
            tag: 'test-foo'
          }
        }
      } as Linearite.Configuration<Plugin.Names>
      expect(
        computeRelativeConfs('test', Linearite.calcConfMatrix(conf), [{
          meta: { name: '@test/foo' },
          path: 'packages/foo'
        }])
      ).to.be.deep.equal([
        { tag: 'test-foo' },
        { builder: 'dts' },
        { builder: 'esbuild' }
      ])
    })
  })
})
