import * as process from 'process'
import * as child_process from 'child_process'
import { CompilerOptions } from 'typescript'
import * as ts from 'typescript'

import { createUseBuilderMatrix, definePlugin, resolveBuilderOpts } from '@linearite/core'
import fs from 'fs'

export interface TSConfig {
  files?: string[]
  exclude?: string[]
  include?: string[]
  extends?: string
  compilerOptions: CompilerOptions
}

declare module '@linearite/core' {
  // @ts-ignore
  interface BuilderConfs extends BuilderConfs {
    dts: {
      /**
       * @default 'tsconfig.json'
       * 默认为当前工作区的根目录
       * 如果配置的为路径，则会覆盖默认路径
       * 如果为配置，则会合并默认路径文件的配置
       */
      tsconfig?: string | TSConfig
    }
  }
}

const useMatrix = createUseBuilderMatrix<'dts'>(({
  conf,
  format,
  platform,
  filedResolver,
}) => {
  if (!['single-dts', 'multiple-dts'].includes(format))
    throw new Error('dts only support single-dts or multiple-dts format')

  if (platform)
    console.warn('dts not support platform')
  if (conf.minify)
    console.warn('dts not support minify')
  if (conf.external)
    console.warn('dts not support external')
  if (conf.define)
    console.warn('dts not support define')

  if (conf.sourcemap && typeof conf.sourcemap !== 'boolean')
    console.warn('dts sourceMap option only support boolean')

  // TODO resolve [typeVersions](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#version-selection-with-typesversions)

  const tsconfigPath = typeof conf.tsconfig === 'string'
    ? conf.tsconfig
    : 'tsconfig.json'
  const { config, error } = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  if (error) throw error
  return {
    include: filedResolver('input'),
    compilerOptions: Object.assign(config.compilerOptions, {
      outDir: filedResolver('outfile'),
      declaration: true,
      declarationMap: conf.sourcemap,
      emitDeclarationOnly: true,
    }),
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
      const confs = ctx.overrides.calc(workspace)
      await Promise.all(confs.map(async ({ builder }) => {
        const [, conf] = resolveBuilderOpts(builder)
        if (conf.type !== 'dts') return

        const matrixResolver = useMatrix(conf)
        ctx.logger.info(ctx.pluginName, 'build:item', workspace.meta.name, opts, conf)
        await matrixResolver(workspace, (buildOpts: TSConfig) => {
          return new Promise(async (resolve, reject) => {
            const fileName = `.temp.tsconfig.${
              workspace.path.replace('/', '_').replace(/\\/g, '_')
            }.json`
            await fs.promises.writeFile(fileName, JSON.stringify(buildOpts))
            const c = child_process.spawn('npx', [
              'tsc',
              '-p', fileName,
            ], {
              stdio: 'inherit',
            })
            c.stdout?.pipe(process.stdout)
            c.stderr?.pipe(process.stderr)
            c.on('close', code => {
              if (code === 0)
                resolve()
              else
                reject(new Error(`tsc exited with code ${code}`))
            })
          })
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
