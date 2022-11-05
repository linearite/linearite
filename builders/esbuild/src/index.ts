import { definePlugin } from '@linearite/core'

declare module '@linearite/core' {
  export namespace Builder {
    export interface Confs {
      esbuild: {}
    }
  }
}

export default definePlugin({
  name: 'esbuild',
  type: 'builder',
  call: (ctx, conf) => {
  }
})
