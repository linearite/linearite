import { definePlugin } from '@linearite/core'
import { CompilerOptions } from 'typescript';

export interface TSConfig {
  files?: string[];
  exlude?: string[];
  include?: string[];
  extends?: string;
  compilerOptions: CompilerOptions;
}

declare module '@linearite/core' {
  namespace Builder {
    // @ts-ignore
    interface Confs extends Builder.Confs {
      dts: {
        tsconfig?: string | TSConfig
      }
    }
  }
}

export default definePlugin({
  name: 'builder-dts',
  conf: {
    target: [],
    format: [],
  },
  call: (opts, conf) => {
  }
})
