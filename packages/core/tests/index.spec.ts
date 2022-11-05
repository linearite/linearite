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
