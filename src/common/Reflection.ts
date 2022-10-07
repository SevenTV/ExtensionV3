export function definePropertyProxy(object: any, prop: string, handler: ProxyHandler<any>) {
	let proxy: any;
	definePropertyHook(object, prop, {
		value: (v) => proxy = v && typeof v == 'object' ? new Proxy(v, handler) : undefined,
		get: (v) => proxy ?? v
	});
}

export function defineFunctionHook<O>(object: O, prop: string, callback: (this: O, hooked: Function, ...args: any[]) => any) {
	let hooked: any;
	definePropertyHook(object, prop, {
		value: (v) => hooked = typeof v == 'function' ? function(this: O, ...args: any[]) {return Reflect.apply(callback, this, [v, ...args])} : undefined,
		get: (v) => hooked ?? v
	});
}

export function definePropertyHook(object: any, prop: string, hooks: { set?: (v: any) => any, get?: (v: any) => any, value?: (v: any) => void }) {
	const storeProp = `_SEVENTV_store_${prop}`;

	if (!Reflect.has(object, storeProp)) {
		object[storeProp] = object[prop];
	}

	hooks.value?.(object[storeProp]);

	Reflect.defineProperty(object, prop, {
		configurable: true,
		set: (v) => {
			const newV = hooks.set ? hooks.set(v) : v;

			object[storeProp] = newV;

			hooks.value?.(newV);
		},
		get: () => hooks.get ? hooks.get(object[storeProp]) : object[storeProp]
	});

	return storeProp;
}

export function unsetPropertyHook(object: any, prop: string) {
	const storeProp = `_SEVENTV_store_${prop}`;

	Reflect.deleteProperty(object, prop);

	if (Reflect.has(object, storeProp)) {
		object[prop] = object[storeProp];

		Reflect.deleteProperty(object, storeProp);
	}
}

export function defineNamedEventHandler<K extends keyof HTMLElementEventMap>(target: HTMLElement, namespace: string, event: K, handler: (ev: HTMLElementEventMap[K]) => void) {
	const storeProp = `_SEVENTV_${namespace}_handler_${event}`;

	const oldHandler = Reflect.get(target, storeProp);
	if (oldHandler) target.removeEventListener(event, oldHandler);

	target.addEventListener(event, handler);
	Reflect.set(target, storeProp, handler);
}

export function unsetNamedEventHandler<K extends keyof HTMLElementEventMap>(target: HTMLElement, namespace: string, event: K) {
	const storeProp = `_SEVENTV_${namespace}_handler_${event}`;

	const oldHandler = Reflect.get(target, storeProp);
	if (oldHandler) target.removeEventListener(event, oldHandler);

	Reflect.deleteProperty(target, storeProp);
}