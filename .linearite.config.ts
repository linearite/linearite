export default {
  builder: {
    type: 'esbuild',
    platform: 'node'
  },
  matrix: {
    // TODO dts unable resolve
    // '*': {
    //   builder: 'dts',
    //   exclude: ['@linearite/cli']
    // }
  },
  overrides: {
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
