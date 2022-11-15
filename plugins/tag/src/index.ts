import Linearite, { definePlugin } from '@linearite/core'

declare module '@linearite/core' {
  export namespace Plugin {
    export interface Confs {
      /**
       * auto with tag when publish package
       *
       * support {@link Linearite.MacroSytax} variables
       *
       * @default "${{L_NAME}}@${{PKG_VERSION}}"
       */
      'tag': Linearite.Inherit | boolean | string | ((pkgMeta: Linearite.PKGMeta) => string)
    }
  }
}

export default definePlugin({
  name: 'tag',
  call(ctx) {
  }
})
