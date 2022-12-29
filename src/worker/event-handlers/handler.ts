import { log } from "@/common/Logger";
import type { ChangeMap, EventContext, ObjectTypeOfKind } from "../events";
import { onEmoteSetUpdate } from "./emote_set.update.handler";

export function handleDispatchedEvent(ctx: EventContext, type: string, cm: ChangeMap<SevenTV.ObjectKind>) {
	switch (type) {
		case "emote_set.update": {
			onEmoteSetUpdate(ctx, cm as ChangeMap<SevenTV.ObjectKind.EMOTE_SET>);
			break;
		}

		default:
			break;
	}
}

export function iterateChangeMap<T extends SevenTV.ObjectKind>(cm: ChangeMap<T>, h: ChangeMapHandler<T>) {
	for (const v of Object.values(h)) {
		const hook = v as ChangeMapHook;

		for (const x of cm.pulled ?? []) {
			hook.pulled?.(x.value, x.old_value);
			log.debug("Net/EventAPI", `PULL (${cm.kind}) ${cm.id}/${String(x.key)}`, JSON.stringify(x.old_value));
		}
		for (const x of cm.pushed ?? []) {
			hook.pushed?.(x.value, x.old_value);
			log.debug("Net/EventAPI", `PUSH (${cm.kind}) ${cm.id}/${String(x.key)}`, JSON.stringify(x.value));
		}

		if (typeof cm.object === "object") {
			hook.object?.(cm.object);
			log.debug("Net/EventAPI", `OBJECT (${cm.kind}) ${cm.id}`, JSON.stringify(cm.object));
		}
	}
}

export type ChangeMapHandler<T extends SevenTV.ObjectKind> = {
	[Property in keyof ObjectTypeOfKind[T]]?: ChangeMapHook;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ChangeMapHook {
	pulled?: (newValue: any, oldValue: any) => void;
	pushed?: (newValue: any, oldValue: any) => void;
	object?: (value: any) => void;
}
