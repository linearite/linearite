import path from 'path'
import * as process from 'process'
import * as child_process from 'child_process'
import { CompilerOptions } from 'typescript'

import { createUseBuilderMatrix, definePlugin, resolveBuilderOpts } from '@linearite/core'

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

const useMatrix = createUseBuilderMatrix<'dts'>(({
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
  if (conf.external)
    console.warn('dts not support external')
  if (conf.define)
    console.warn('dts not support define')

  if (conf.sourcemap && typeof conf.sourcemap !== 'boolean')
    console.warn('dts sourceMap option only support boolean')

  // TODO resolve [typeVersions](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#version-selection-with-typesversions)

  // replace `workspace.path` as '', because `tsc` command cwd is set as `workspace.path`
  return {
    ...(
      typeof conf.tsconfig === 'string'
        ? { extends: conf.tsconfig.replace(workspace.path, '.'), }
        : {}
    ),
    include: filedResolver('input').map(p => p.replace(workspace.path, '.')),
    compilerOptions: {
      outDir: filedResolver('outfile').replace(workspace.path, '.'),
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
        if (conf.type !== 'dts') return

        const matrixResolver = useMatrix(conf)
        ctx.logger.info(ctx.pluginName, 'build:item', workspace.meta.name, opts, conf)
        await matrixResolver(workspace, (buildOpts: TSConfig) => {
          return new Promise((resolve, reject) => {
            const c = child_process.spawn('npx', [
              'tsc',
              ...(buildOpts.extends ? ['-p', buildOpts.extends] : []),
              ...Object.entries(buildOpts.compilerOptions).flatMap(([k, v]) => (
                ['boolean', 'undefined'].includes(typeof v)
                  ? (v === true ? [`--${k}`] : [])
                  : [`--${k}`, v as string]
              )),
            ], {
              stdio: 'inherit',
              cwd: path.join(process.cwd(), workspace.path),
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
