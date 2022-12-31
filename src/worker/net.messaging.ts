import { NetWorkerMessageType } from ".";

export const onTabMessage = (type: NetWorkerMessageType) => {
	switch (type) {
		case NetWorkerMessageType.EVENTS_SUB:
			break;

		default:
			break;
	}
};
