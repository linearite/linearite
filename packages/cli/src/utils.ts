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

/**
 * merge all fields and recursively merge all object fields
 */
export function merge<T extends Record<string, any>>(...objs: T[]): T {
  const result = {} as T
  for (const obj of objs) {
    for (const key in obj) {
      const val = obj[key]
      if (Array.isArray(val)) {
        if (Array.isArray(result[key])) {
          result[key].push(...val as any[])
        } else {
          result[key] = val
        }
        continue
      }
      if (typeof val === 'object' && val !== null) {
        (result as any)[key] = merge(result[key] || {}, val)
        continue
      }
      result[key] = val
    }
  }
  return result
}
