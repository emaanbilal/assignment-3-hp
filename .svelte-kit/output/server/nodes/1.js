

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.BGQmVXtO.js","_app/immutable/chunks/scheduler.B2QSKqcC.js","_app/immutable/chunks/index.BRMTjanE.js","_app/immutable/chunks/entry.BWPmeUkX.js"];
export const stylesheets = [];
export const fonts = [];
