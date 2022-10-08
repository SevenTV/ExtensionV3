/* eslint-disable @typescript-eslint/no-explicit-any */

export function definePropertyProxy<T>(object: T, prop: keyof T, handler: ProxyHandler<any>) {
	let proxy: any;
	definePropertyHook(object, prop, {
		value: (v) => {
			if (v && typeof v == "object") {
				proxy = new Proxy(v, handler);
			} else {
				proxy = undefined;
			}
		},
		get: (v) => proxy ?? v,
	});
}

export function defineFunctionHook<T>(
	object: T,
	prop: keyof T,
	callback: (this: T, old: ((...args: any[]) => any) | null, ...args: any[]) => any,
) {
	let hooked: (...args: any[]) => any;
	definePropertyHook(object, prop as keyof T, {
		value: (v) => {
			const old = typeof v == "function" ? v : undefined;
			hooked = function (this: T, ...args: any[]) {
				return Reflect.apply(callback, this, [old, ...args]);
			};
		},
		get: (v) => hooked ?? v,
	});
}

export function definePropertyHook<T = any>(
	object: T,
	prop: keyof T,
	hooks: { set?: (newVal: any, oldVal: any) => any; get?: (v: any) => any; value?: (v: any) => void },
) {
	if (!object) return;

	const storeProp = `_SEVENTV_store_${prop as string}`;

	if (!Reflect.has(object as any, storeProp)) {
		object[storeProp as keyof T] = object[prop];
	}

	hooks.value?.(object[storeProp as keyof T]);

	Reflect.defineProperty(object as unknown as object, prop, {
		configurable: true,
		set: (v) => {
			const oldV = object[storeProp as keyof T];
			const newV = hooks.set ? hooks.set(v, oldV) : v;

			object[storeProp as keyof T] = newV;

			hooks.value?.(newV);
		},
		get: () => (hooks.get ? hooks.get(object[storeProp as keyof T]) : object[storeProp as keyof T]),
	});

	return storeProp;
}

export function unsetPropertyHook(object: any, prop: string) {
	if (!object) return;

	const storeProp = `_SEVENTV_store_${prop}`;

	Reflect.deleteProperty(object, prop);

	if (Reflect.has(object, storeProp)) {
		object[prop] = object[storeProp];

		Reflect.deleteProperty(object, storeProp);
	}
}

export function defineNamedEventHandler<K extends keyof HTMLElementEventMap>(
	target: HTMLElement,
	namespace: string,
	event: K,
	handler: (ev: HTMLElementEventMap[K]) => void,
) {
	if (!target) return;

	const storeProp = `_SEVENTV_${namespace}_handler_${event}`;

	const oldHandler = Reflect.get(target, storeProp);
	if (oldHandler) target.removeEventListener(event, oldHandler);

	target.addEventListener(event, handler);
	Reflect.set(target, storeProp, handler);
}

export function unsetNamedEventHandler<K extends keyof HTMLElementEventMap>(
	target: HTMLElement,
	namespace: string,
	event: K,
) {
	if (!target) return;

	const storeProp = `_SEVENTV_${namespace}_handler_${event}`;

	const oldHandler = Reflect.get(target, storeProp);
	if (oldHandler) target.removeEventListener(event, oldHandler);

	Reflect.deleteProperty(target, storeProp);
}
