export const isString = value =>
  typeof value === 'string' || value instanceof String

export const _global =
  typeof global !== 'undefined'
    ? global
    : typeof window !== 'undefined'
      ? window
      : {}
