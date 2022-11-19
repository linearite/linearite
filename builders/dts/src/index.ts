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
  // @ts-ignore
  interface BuilderConfs extends BuilderConfs {
    dts: {
      tsconfig?: string | TSConfig
    }
  }
}

export default definePlugin({
  name: 'builder-dts',
  conf: {
    target: [],
    format: [],
    platform: [],
  },
  call: (opts, conf) => {
  }
})
