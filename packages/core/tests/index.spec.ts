import { expect } from 'chai'
import Linearite from '@linearite/core'

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
})
