import { log } from "@/common/Logger";
import { ChangeMap, EventContext } from "../events";
import { getLocal, sendTabNotify } from "../net.worker";

export async function onEntitlementCreate(ctx: EventContext, cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>) {
	if (!cm.object) return;

	const platform = getLocal()?.platform;
	if (!platform) return; // no platform set

	// Mutate the entitlement
	// Map out connection IDs
	const obj = cm.object;
	if (!cm.object || !obj.user || !obj.user.connections?.length) return;

	obj.cid = obj.user.connections.find((x) => x.platform === platform)?.id ?? "";

	delete obj.user;

	// Insert the cosmetic into the database
	await ctx.db
		.withErrorFallback(ctx.db.entitlements.put(obj), () =>
			ctx.db.entitlements.where("id").equals(obj.id).modify(obj),
		)
		.catch((err) => log.error("Net/EventAPI", "Failed to insert entitlement", err));

	// Notify the UI about the new entitlement
	sendTabNotify("entitlements:create", {
		ref_id: obj.ref_id,
		slot: obj.kind,
		cid: obj.cid,
	});
}
