import { definePlugin } from '@linearite/core'

declare module '@linearite/core' {
  namespace Builder {
    // @ts-ignore
    interface Confs extends Builder.Confs {
      esbuild: {}
    }
  }
}

export default definePlugin({
  name: 'builder-esbuild',
  conf: {
    target: ['node12'],
    format: ['umd', 'esm'],
  },
  call: (ctx, conf) => {
    ctx.on('build:item', (workspace, opts) => {
      console.log(
        [...ctx.workspaces]
      )
      console.log('build:item', workspace, opts)
    })
  }
})
