import { createUseBuilderMatrix, definePlugin, resolveBuilderOpts } from '@linearite/core'
import { CompilerOptions } from 'typescript'

export interface TSConfig {
  files?: string[]
  exlude?: string[]
  include?: string[]
  extends?: string
  compilerOptions: CompilerOptions
}

declare module '@linearite/core' {
  // @ts-ignore
  interface BuilderConfs extends BuilderConfs {
    dts: {
      tsconfig?: string | TSConfig
    }
  }
}

const useMatrix = createUseBuilderMatrix(({
  conf,
  format,
  platform,
  workspace,
  filedResolver,
}) => {
  if (!['single-dts', 'multiple-dts'].includes(format))
    throw new Error('dts only support single-dts or multiple-dts format')

  if (platform)
    console.warn('dts not support platform')
  if (conf.minify)
    console.warn('dts not support minify')
  if (conf.sourcemap)
    console.warn('dts not support sourcemap')
  if (conf.external)
    console.warn('dts not support external')
  if (conf.define)
    console.warn('dts not support define')

  if (conf.sourcemap && typeof conf.sourcemap !== 'boolean')
    console.warn('dts not support sourcemap')

  // TODO resolve [typeVersions](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#version-selection-with-typesversions)

  return {
    include: filedResolver('input'),
    compilerOptions: {
      outDir: filedResolver('outfile'),
      declaration: true,
      declarationMap: conf.sourcemap,
      emitDeclarationOnly: true,
    },
  } as TSConfig
})

export default definePlugin({
  name: 'builder-dts',
  conf: {
    // control build dts version
    target: ['*'],
    // control dts is single or multiple
    format: ['multiple-dts'],
    // useless
    platform: [],
  },
  call: ctx => {
    ctx.on('build:item', async (workspace, opts) => {
      const confs = ctx.overides.calc(workspace)
      await Promise.all(confs.map(async ({ builder }) => {
        const [, conf] = resolveBuilderOpts(builder)
        const matrixResolver = useMatrix(conf)
        ctx.logger.info(ctx.pluginName, 'build:item', workspace.meta.name, opts, conf)
        await matrixResolver(workspace, async (buildOpts: TSConfig) => {
          // TODO to build target
        })
        ctx.logger.info(
          ctx.pluginName,
          !opts.watch
            ? `build:item ${workspace.meta.name} success`
            : `build:item is watching ${workspace.meta.name}`
        )
      }))
    })
  }
})
