import { definePlugin } from '@linearite/core'

declare module '@linearite/core' {
  export namespace Builder {
    export interface Confs {
      dts: {}
    }
  }
}

export default definePlugin({
  name: 'dts',
  type: 'builder',
  call: (opts, conf) => {
  }
})
