export type U2I<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
