import { Command } from 'commander'

import { Context } from '@linearite/core'
import { onBuild } from '../src/inner/on-build'
import { expect } from 'chai'

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
})
