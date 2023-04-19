import { expect } from 'chai'
import Linearite, { compileMacroSyntax, defineConfiguration, Plugin } from '@linearite/core'

describe('core', function () {
  it('should test isInherit function', function () {
    expect(Linearite.isInherit('auto')).to.be.true
    expect(Linearite.isInherit('inherit')).to.be.true
    expect(Linearite.isInherit(true)).to.be.true
    expect(Linearite.isInherit(false)).to.be.false
    expect(Linearite.isInherit('')).to.be.false
    expect(Linearite.isInherit('false')).to.be.false
  })
  it('should test defineConfiguration function', function () {
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
      overrides: {
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
      overrides: {
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
          overrides: {
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
      ], 'should return all keys with nested matrix and overrides')
  })
  it('should test calcConfMatrix function', () => {
    const cases = {
      'should resolve simplify conf': [
        {
          builder: 'dts',
        },
        conf => [
          [
            [[], conf]
          ]
        ],
      ],
      'should resolve conf with matrix': [
        {
          builder: 'dts',
          matrix: {
            a: {
              builder: 'esbuild',
            },
            b: {
              builder: 'dts',
            }
          }
        },
        conf => [
          [
            [[], conf]
          ],
          [
            [['a'], conf.matrix.a]
          ],
          [
            [['b'], conf.matrix.b]
          ]
        ]
      ],
      'should resolve conf with matrix and overrides': [
        {
          builder: 'dts',
          matrix: {
            a: {
              builder: 'esbuild',
            },
            b: {
              builder: 'dts',
            }
          },
          overrides: {
            c: {
              builder: 'esbuild',
            },
            d: {
              builder: 'dts',
            }
          }
        },
        conf => [
          [
            [[], conf],
            [['c'], conf.overrides.c],
            [['d'], conf.overrides.d]
          ],
          [
            [['a'], conf.matrix.a]
          ],
          [
            [['b'], conf.matrix.b]
          ]
        ]
      ],
      'should resolve nest conf': [
        {
          builder: 'dts',
          matrix: {
            'a': {
              builder: 'dts'
            },
            'b': {
              builder: 'esbuild',
              overrides: {
                'c': {
                  builder: 'dts'
                },
                'd': {
                  builder: 'esbuild'
                }
              }
            },
            'e': {
              builder: 'esbuild',
              matrix: {
                'f': {
                  builder: 'dts'
                },
                'g': {
                  builder: 'esbuild'
                }
              }
            }
          },
          overrides: {
            'h': {
              builder: 'dts',
              matrix: {
                'i': {
                  builder: 'dts'
                },
                'j': {
                  builder: 'esbuild'
                }
              },
              overrides: {
                'k': {
                  builder: 'dts'
                }
              }
            }
          },
        },
        conf => [
          [
            [[], conf],
            [['h'], conf.overrides.h],
            [['h', 'k'], conf.overrides.h.overrides.k]
          ],
          [
            [['a'], conf.matrix.a]
          ],
          [
            [['b'], conf.matrix.b],
            [['b', 'c'], conf.matrix.b.overrides.c],
            [['b', 'd'], conf.matrix.b.overrides.d]
          ],
          [
            [['e'], conf.matrix.e]
          ],
          [
            [['e', 'f'], conf.matrix.e.matrix.f]
          ],
          [
            [['e', 'g'], conf.matrix.e.matrix.g]
          ],
          [
            [['h', 'i'], conf.overrides.h.matrix.i]
          ],
          [
            [['h', 'j'], conf.overrides.h.matrix.j]
          ]
        ]
      ],
    } as Record<string, [
      Linearite.Configuration<Plugin.Names>,
      (conf: Linearite.Configuration<Plugin.Names>) => any[]
    ]>
    Object.entries(cases).forEach(([message, [conf, calcResult]]) => {
      const [actual, expected] = [Linearite.calcConfMatrix(conf), calcResult(conf)]
      actual.forEach((actualItem, i) => {
        const expectedItem = expected[i]
        // omit actualItem[number][1] overrides and matrix fields
        actualItem.forEach((actualItemItem) => {
          delete actualItemItem[1].overrides
          delete actualItemItem[1].matrix
        })
        // omit expectedItem[number][1] overrides and matrix fields
        expectedItem.forEach((expectedItemItem) => {
          delete expectedItemItem[1].overrides
          delete expectedItemItem[1].matrix
        })
        expect(actualItem, `${message} - [${i}]`).to.be.deep.equal(expectedItem)
      })
      expect(actual)
        .to.be.lengthOf(expected.length, `${message} - should have same length`)
    })
  })
})
