/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Hooks the defined property on the passed object, whenever the property is accessed, a Proxy object will be returned instead.
 * Setting a hook will overwrite all previous hooks for the property.
 * @param object Object to hook
 * @param prop Property to define as a proxy
 * @param handler Proxy handler for the defined property
 */
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

/**
 * Hooks the function on the defined property, whenever the defined property is updated it is automatically hooked.
 * Setting a hook will overwrite all previous hooks for the property.
 * @param object Object to hook
 * @param prop Function to hook
 * @param callback Callback run whenever the hooked function is called, the original function is provided as the first argument to the callback.
 */
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

/**
 * Hooks the passed object, and calls the defined callback functions when the defined property is set or accessed.
 * Setting a hook will overwrite all previous hooks for the property.
 * @param object Object to hook
 * @param prop Property to hook
 * @param hooks An object containing the hooks to call when the hooked property is set or accessed.
 * @param hooks.set Callback to call when the defined property is set, argument passed contains the stored value of the property, should return the desired value to set.
 * @param hooks.get Callback to call when the defined property is accessed, argument passed contains the stored value of the property, returns the passed value to the accessor.
 * @param hooks.value Callback to call when the defined property is set similarly to the `set` hook, however the `value` hook also gets called initially for the current value upon hook definition.
 * @returns Property on the parent object where the base value is stored. Can be used to bypass getters and read the true value of a property.
 */
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

/**
 * Unhooks the defined property on the passed object, the value of the property is returned to its stored value, and all hooks are removed.
 * @param object Object to remove hook from
 * @param prop Property to unhook
 */
export function unsetPropertyHook(object: any, prop: string) {
	if (!object) return;

	const storeProp = `_SEVENTV_store_${prop}`;

	Reflect.deleteProperty(object, prop);

	if (Reflect.has(object, storeProp)) {
		object[prop] = object[storeProp];

		Reflect.deleteProperty(object, storeProp);
	}
}

/**
 * Defines a named event handler on the passed element.
 * Setting an event which has already been set under the same namespace, will overwrite the previous event handler for that event.
 * @param target Element to listen to event on
 * @param namespace Namespace to store event handler under
 * @param event Event type
 * @param handler Handler function to call upon event emit
 */
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

/**
 * Unsets the event handler on the passed element in the namespace provided.
 * @param target Element to remove handler from
 * @param namespace Namespace of the event
 * @param event Event type
 */
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
