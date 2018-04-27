export const isString = value =>
  typeof value === 'string' || value instanceof String

export const isObject = value =>
  !!value && (typeof value == 'object' || typeof value == 'function')

export const isFunc = value => typeof value == 'function'

export const ssr = typeof window === 'undefined'

export const _global =
  typeof global !== 'undefined'
    ? global
    : typeof window !== 'undefined'
      ? window
      : {}
