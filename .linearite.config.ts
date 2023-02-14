export default {
  builder: {
    type: 'esbuild',
    platform: 'node'
  },
  matrix: {
    '*': {
      builder: 'dts',
      exclude: ['@linearite/cli']
    }
  },
  overides: {
    '@linearite/cli': {
      builder: {
        type: 'esbuild',
        outdir: 'bin',
        format: 'cjs',
        platform: 'node',
        define: {
          PKG_NAME: '"linearite"',
          PKG_VERSION: '"${{PKG_VERSION}}"',
          PKG_DESCRIPTION: '"${{PKG_DESCRIPTION}}"'
        },
      },
    }
  }
}
