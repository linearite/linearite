import { expect } from 'chai'
import Linearite, { defineConfiguration } from '@linearite/core'

describe('core', function () {
  it('should test isInherit function', function () {
    expect(Linearite.isInherit('auto')).to.be.true
    expect(Linearite.isInherit('inherit')).to.be.true
    expect(Linearite.isInherit(true)).to.be.true
    // @ts-expect-error
    expect(Linearite.isInherit(false)).to.be.false
    // @ts-expect-error
    expect(Linearite.isInherit('')).to.be.false
    // @ts-expect-error
    expect(Linearite.isInherit('false')).to.be.false
  })
  it('should test resolveInherit function', function () {
    expect(Linearite.resolveInherit('auto', 'foo')).to.equal('foo')
    expect(Linearite.resolveInherit('inherit', 'foo')).to.equal('foo')
    expect(Linearite.resolveInherit(true, 'foo')).to.equal('foo')
    expect(Linearite.resolveInherit(false, 'foo')).to.equal(false)
    expect(Linearite.resolveInherit(undefined, 'foo')).to.equal(false)
    // @ts-expect-error
    expect(Linearite.resolveInherit('', 'foo'))
      .to.equal(false)
    // @ts-expect-error
    expect(Linearite.resolveInherit('false', 'foo'))
      .to.equal(false)
  })
  it('should test defineConfiguration function', () => {
    expect(defineConfiguration({
      builder: true,
      autoTag: true,
      cmMsgRule: true
    })).to.be.deep.equal({
      builder: true,
      autoTag: true,
      cmMsgRule: true
    })
  })
})
