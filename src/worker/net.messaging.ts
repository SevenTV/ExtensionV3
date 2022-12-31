import { NetWorkerMessage, NetWorkerMessageType, TypedNetWorkerMessage } from ".";
import { seventv } from "./net.http.worker";

export const onTabMessage = <T extends NetWorkerMessageType>(type: T, msg: NetWorkerMessage<T>) => {
	switch (type) {
		case NetWorkerMessageType.EVENTS_SUB:
			break;
		case NetWorkerMessageType.NOTIFY: {
			const data = msg.data as TypedNetWorkerMessage<NetWorkerMessageType.NOTIFY>;

			switch (data.key) {
				case "presences:self:write":
					seventv.writePresence();
					break;
			}
			break;
		}
		default:
			break;
	}
};
