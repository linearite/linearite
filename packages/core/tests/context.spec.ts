import { Context } from '@linearite/core'
import { Command } from 'commander'
import { expect } from 'chai'

describe('context', function () {
  it('should init context', function () {
    const ctx = new Context(new Command('line-test'), {})
    expect(ctx).to.be.an.instanceOf(Context)
    // no build command
    expect(ctx.commands['build'])
      .to.be.undefined
  })
  it('should init conetxt with build command', () => {
    const ctx = new Context(new Command('line-test'), { builder: 'inherit' })
    expect(ctx).to.be.an.instanceOf(Context)
    expect(ctx.commands['build'])
      .to.be.an.instanceOf(Command)
  })
  it('should init context with custom build command', () => {
    Context.defaultBuilder = 'dts'
    const ctx0 = new Context(new Command('line-test'), { builder: 'inherit' })
    expect(ctx0).to.be.an.instanceOf(Context)
    expect(ctx0.commands['build'])
      .to.be.an.instanceOf(Command)
    expect(Object.keys(ctx0.plugins))
      .to.include('builder-dts')

    const ctx1 = new Context(new Command('line-test'), { builder: 'esbuild' })
    expect(ctx1).to.be.an.instanceOf(Context)
    expect(ctx1.commands['build'])
      .to.be.an.instanceOf(Command)
    expect(Object.keys(ctx1.plugins))
      .to.include('builder-esbuild')
  })
})
