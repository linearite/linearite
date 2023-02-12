export function resolveArray<T>(arr: T | T[]) {
  return Array.isArray(arr) ? arr : [arr]
}
