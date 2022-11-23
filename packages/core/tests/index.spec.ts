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
  it('should test confFieldWalker function', function () {
    expect(Linearite.confFieldWalker('builder', {
    }, (field, k) => k)).to.be.deep.equal([], 'should return empty array')

    expect(Linearite.confFieldWalker('builder', {
      builder: true,
      matrix: {
        'foo': { builder: 'dts' },
        'fuu': { builder: 'esbuild' },
        'fuo': {}
      },
      overides: {
        'bar': { builder: 'dts' },
        'ber': { builder: 'esbuild' },
        'bor': {},
      }
    }, () => 1))
      .to.be.lengthOf(5, 'should return 5 items')
      .that.to.be.deep.equal([...Array(5).fill(1)], 'all items should be 1')

    expect(Linearite.confFieldWalker('builder', {
      builder: 'dts',
      matrix: {
        'foo': { builder: 'dts' },
        'fuu': { builder: 'esbuild' },
        'fuo': {}
      },
      overides: {
        'bar': { builder: 'dts' },
        'ber': { builder: 'esbuild' },
        'bor': {},
      }
    }, (field, k) => k))
      .to.be.deep.equal([
        [],
        ['foo'],
        ['fuu'],
        ['bar'],
        ['ber'],
      ], 'should return all keys')

    expect(Linearite.confFieldWalker('builder', {
      builder: 'dts',
      matrix: {
        'foo': {
          builder: 'dts',
          matrix: {
            'bar': { builder: 'dts' }
          },
          overides: {
            'ber': { builder: 'esbuild' }
          }
        },
        'fuu': { builder: 'esbuild' },
        'fuo': {}
      }
    }, (field, k) => k))
      .to.be.deep.equal([
        [],
        ['foo'],
        ['foo', 'bar'],
        ['foo', 'ber'],
        ['fuu'],
      ], 'should return all keys with nested matrix and overides')
  })
})
