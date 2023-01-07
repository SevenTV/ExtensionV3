import { ChangeMap, EventContext } from "..";
import type { WorkerPort } from "../worker.port";

export async function onEntitlementCreate(
	ctx: EventContext,
	cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>,
	port: WorkerPort,
) {
	if (!cm.object) return;

	const platform = port.platform;
	if (!platform) return; // no platform set

	const obj = cm.object;
	if (!cm.object || !obj.user || !obj.user.connections?.length) return;

	const cid = obj.user.connections.find((x) => x.platform === platform)?.id ?? "";

	// Send the entitlement to the client
	port.postMessage("ENTITLEMENT_CREATED", {
		kind: obj.kind,
		ref_id: obj.ref_id,
		user_id: cid,
	});
}

export async function onEntitlementDelete(
	ctx: EventContext,
	cm: ChangeMap<SevenTV.ObjectKind.ENTITLEMENT>,
	port: WorkerPort,
) {
	if (!cm.object) return;

	const platform = port.platform;
	if (!platform) return; // no platform set

	const obj = cm.object;
	if (!cm.object || !obj.user || !obj.user.connections?.length) return;

	const cid = obj.user.connections.find((x) => x.platform === platform)?.id ?? "";

	// Send the entitlement to the client
	port.postMessage("ENTITLEMENT_DELETED", {
		kind: obj.kind,
		ref_id: obj.ref_id,
		user_id: cid,
	});
}
