/** @type {import('@linearite/core').Linearite.Configuration} */
export default {
  builder: {
    type: 'esbuild',
    platform: 'node'
  },
  overides: {
    '@linerite/cli': {
      builder: {
        outdir: 'bin',
        format: 'cjs',
        define: {
          PKG_NAME: 'linearite',
          PKG_VERSION: '${{PKG_VERSION}}',
          PKG_DESCRIPTION: '${{PKG_DESCRIPTION}}'
        },
      },
    }
  }
}
