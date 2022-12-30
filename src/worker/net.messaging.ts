import { NetWorkerMessageType } from ".";

export const onTabMessage = (type: NetWorkerMessageType, data: unknown) => {
	switch (type) {
		case NetWorkerMessageType.EVENTS_SUB:
			break;

		default:
			break;
	}
};
