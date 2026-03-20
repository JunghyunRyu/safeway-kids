export const debugLog = __DEV__ ? console.log.bind(console) : () => {};
export const debugWarn = __DEV__ ? console.warn.bind(console) : () => {};
export const debugError = __DEV__ ? console.error.bind(console) : () => {};
