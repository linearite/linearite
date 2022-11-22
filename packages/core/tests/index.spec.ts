import { expect } from 'chai'
import Linearite, { compileMacroSyntax, defineConfiguration } from '@linearite/core'

describe('core', function () {
  it('should test isInherit function', function () {
    expect(Linearite.isInherit('auto')).to.be.true
    expect(Linearite.isInherit('inherit')).to.be.true
    expect(Linearite.isInherit(true)).to.be.true
    expect(Linearite.isInherit(false)).to.be.false
    expect(Linearite.isInherit('')).to.be.false
    expect(Linearite.isInherit('false')).to.be.false
  })
  it('should test defineConfiguration function', () => {
    expect(defineConfiguration({
      builder: true,
    })).to.be.deep.equal({
      builder: true,
    })
  })
  describe('compileMacroSyntax', function () {
    it('should test compileMacroSyntax function', function () {
      const workspace = {
        meta: {
          name: '@linearite/core',
          version: '1.0.0',
          description: 'Linearite core',
        },
        path: '/path/to/workspace',
      }
      expect(compileMacroSyntax('${{PKG_NAME}}@${{PKG_VERSION}}', workspace))
        .to.be.equal('@linearite/core@1.0.0')
      expect(compileMacroSyntax('${{PKG_DESCRIPTION}}', workspace))
        .to.be.equal('Linearite core')
      expect(compileMacroSyntax('${{L_NAME}}@${{PKG_VERSION}}', workspace))
        .to.be.equal('core@1.0.0')
    })
  })
})
