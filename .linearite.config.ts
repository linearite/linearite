/** @type {import('@linearite/core').Linearite.Configuration} */
export default {
  builder: {
    type: 'esbuild',
    platform: 'node'
  },
  // overides: [{
  //   rules: '@linerite/cli',
  //   builder: {
  //     define: {
  //       PKG_NAME: 'linearite',
  //       PKG_VERSION: '0.0.0',
  //       PKG_DESCRIPTION: 'linearite is a tool for building monorepo'
  //     },
  //   },
  // }],
}
