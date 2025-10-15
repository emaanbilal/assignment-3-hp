

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.C4dRiPld.js","_app/immutable/chunks/scheduler.B2QSKqcC.js","_app/immutable/chunks/index.BRMTjanE.js"];
export const stylesheets = ["_app/immutable/assets/2.E3IkhWRk.css"];
export const fonts = [];
