import { Ref, reactive, toRef } from "vue";
import { until } from "@vueuse/core";
import { useLiveQuery } from "./useLiveQuery";
import { useWorker } from "./useWorker";
import { db } from "@/db/idb";

const data = reactive({
	cosmetics: {} as Record<SevenTV.ObjectID, SevenTV.Cosmetic>,
	entitlementBuffers: {
		"+": [] as SevenTV.Entitlement[],
		"-": [] as SevenTV.Entitlement[],
	},

	userBadges: {} as Record<string, SevenTV.Cosmetic<"BADGE">[]>,
	userPaints: {} as Record<string, SevenTV.Cosmetic<"PAINT">[]>,

	staticallyAssigned: {} as Record<string, Record<string, never>>,
});

let init = false;
let flushTimeout: number | null = null;

export function useCosmetics() {
	if (!init) {
		init = true;

		const { target } = useWorker();

		useLiveQuery(
			() => db.cosmetics.toArray(),
			(result) => {
				data.cosmetics = {};

				for (const cos of result) {
					data.cosmetics[cos.id] = cos;
				}
			},
		);

		// Assign legacy V2 static cosmetics
		target.addEventListener("static_cosmetics_fetched", (e) => {
			const { badges, paints } = e.detail;

			// Assign legacy static badges
			for (const badge of badges) {
				for (const u of badge.user_ids) {
					if (data.userBadges[u]) continue;

					data.userBadges[u] = [badge];
					data.staticallyAssigned[u] = {};
				}

				badge.user_ids.length = 0;

				data.cosmetics[badge.id] = badge;
			}

			// Assign legacy static paints
			for (const paint of paints) {
				for (const u of paint.user_ids) {
					if (data.userPaints[u]) continue;

					data.userPaints[u] = [paint];
					data.staticallyAssigned[u] = {};
				}

				paint.user_ids.length = 0;

				data.cosmetics[paint.id] = paint;
			}
		});
	}

	/**
	 * Bind or unbind an entitlement to a user
	 *
	 * @param ent The entitlement to bind or unbind
	 * @param mode "+" to bind, "-" to unbind
	 */
	function setEntitlement(ent: SevenTV.Entitlement, mode: "+" | "-") {
		if (data.staticallyAssigned[ent.user_id]) {
			// If user had statically assigned cosmetics,
			// clear them so they be properly set with live data
			data.userBadges[ent.user_id] = [];
			data.userPaints[ent.user_id] = [];
			delete data.staticallyAssigned[ent.user_id];
		}

		data.entitlementBuffers[mode].push(ent);

		flush();
	}

	// Flush schedules the entitlement buffer
	//
	// This operation processes a time gap between grants and revokations
	// in order to allow the UI to update smoothly
	function flush() {
		if (flushTimeout) return;

		flushTimeout = window.setTimeout(() => {
			const add = data.entitlementBuffers["+"].splice(0, data.entitlementBuffers["+"].length);
			const del = data.entitlementBuffers["-"].splice(0, data.entitlementBuffers["-"].length);

			for (const ent of del) {
				const l = userListFor(ent.kind);
				if (!l[ent.user_id]) continue;

				const idx = l[ent.user_id].findIndex((b) => b.id === ent.ref_id);
				if (idx !== -1) l[ent.user_id].splice(idx, 1);
			}

			flushTimeout = window.setTimeout(async () => {
				for (const ent of add) {
					const l = userListFor(ent.kind);
					if (!l[ent.user_id]) l[ent.user_id] = [];

					awaitCosmetic(ent.ref_id).then((cos) => {
						const idx = l[ent.user_id].findIndex((b) => b.id === ent.ref_id);
						if (idx === -1) {
							l[ent.user_id].push(cos as never);
						}
					});
				}
			}, 50);

			flushTimeout = null;
		}, 50);
	}

	function awaitCosmetic(id: SevenTV.ObjectID) {
		return until(data.cosmetics[id]).not.toBeUndefined();
	}

	function userListFor(kind: SevenTV.EntitlementKind) {
		return {
			BADGE: data.userBadges,
			PAINT: data.userPaints,
			EMOTE_SET: {},
		}[kind];
	}

	function userBadges(id: SevenTV.ObjectID): Ref<SevenTV.Cosmetic<"BADGE">[]> {
		if (!data.userBadges[id]) data.userBadges[id] = [];

		return toRef(data.userBadges, id);
	}

	function userPaints(id: SevenTV.ObjectID): Ref<SevenTV.Cosmetic<"PAINT">[]> {
		if (!data.userPaints[id]) data.userPaints[id] = [];

		return toRef(data.userPaints, id);
	}

	return {
		setEntitlement,
		userBadges,
		userPaints,
	};
}
