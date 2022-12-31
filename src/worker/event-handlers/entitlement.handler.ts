import { log } from "@/common/Logger";
import { ChangeMap, EventContext } from "../events";
import { getLocal } from "../net.worker";

export function onEntitlementCreate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>) {
	if (!cm.object) return;

	const platform = getLocal()?.platform;
	if (!platform) return; // no platform set

	// Mutate the entitlement
	// Map out connection IDs
	const obj = cm.object;
	if (!cm.object || !obj.user || !obj.user.connections?.length) return;

	obj.cid = obj.user.connections.find((x) => x.id === platform)?.id ?? "";

	delete obj.user;

	// Insert the cosmetic into the database
	ctx.db
		.withErrorFallback(ctx.db.entitlements.put(cm.object), () =>
			ctx.db.entitlements.where("id").equals(cm.object.id).modify(cm.object),
		)
		.catch(log.error);
}
