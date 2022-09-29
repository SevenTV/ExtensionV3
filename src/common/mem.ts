export function destroyObject(obj: Record<any, any>): void {
	for (const prop in obj) {
		const property = obj[prop];
		if (property === null || typeof property === "undefined") {
			continue;
		}

		if (typeof property === "object") {
			destroyObject(property);
		} else {
			obj[prop] = undefined;
		}
	}
}
