export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".well-known/appspecific/com.chrome.devtools.json","lumos-logo.png"]),
	mimeTypes: {".json":"application/json",".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.C1-5z2H0.js","app":"_app/immutable/entry/app.K4o7E6Pp.js","imports":["_app/immutable/entry/start.C1-5z2H0.js","_app/immutable/chunks/entry.BWPmeUkX.js","_app/immutable/chunks/scheduler.B2QSKqcC.js","_app/immutable/entry/app.K4o7E6Pp.js","_app/immutable/chunks/scheduler.B2QSKqcC.js","_app/immutable/chunks/index.BRMTjanE.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/hogwarts",
				pattern: /^\/api\/hogwarts\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/hogwarts/_server.js'))
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
