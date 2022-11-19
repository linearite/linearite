import fs from 'fs'
import path from 'path'

export function isPromiseFulfilledResult<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled'
}

export async function treeDirPaths(dir: string, opts = {
  exclude: ['node_modules', '.git'],
}) {
  const paths = await fs.promises.readdir(dir)
  const dirs = (
    await Promise.all(paths
      .map(async p => {
        if (opts.exclude.includes(p)) {
          return null
        }
        const stat = await fs.promises.stat(path.resolve(dir, p))
        return stat.isDirectory() ? p : null
      })
    )
  )
    .filter(Boolean)
  await Promise.all(dirs.map(async d => {
    const subPaths = await treeDirPaths(path.resolve(dir, d), opts)
    dirs.push(...subPaths.map(p => path.join(d, p)))
  }))
  return dirs
}
