import { getRandomInt } from "@/common/Rand";
import { TypedWorkerMessage, WorkerMessage, WorkerMessageType } from ".";
import { WorkerDriver } from "./worker.driver";

export class WorkerPort {
	id: symbol;

	platform: Platform | null = null;
	channel: CurrentChannel | null = null;
	identity: TwitchIdentity | YouTubeIdentity | null = null;
	user: SevenTV.User | null = null;

	constructor(private driver: WorkerDriver, private port: MessagePort) {
		this.id = Symbol(`seventv-worker-port-${getRandomInt(1000, 9999)}`);
		this.driver.log.debug("Port opened:", this.id.toString());

		port.addEventListener("message", (ev) => this.onMessage(ev));
		port.start();
	}

	private onMessage(ev: MessageEvent) {
		const { type, data } = ev.data as WorkerMessage<WorkerMessageType>;

		switch (type) {
			case "STATE": {
				const { platform, identity, channel, user } = data as TypedWorkerMessage<"STATE">;

				if (platform) this.platform = platform;
				if (identity) {
					this.identity = identity;

					this.driver.emit("identity_updated", this.identity, this);
				}
				if (channel) {
					this.channel = channel;

					this.driver.log.debugWithObjects(["Channel updated"], [this.channel]);
					this.driver.emit("start_watching_channel", this.channel, this);
				}
				if (user) {
					this.user = user;

					this.driver.emit("user_updated", this.user, this);
				}

				break;
			}
			case "CLOSE":
				if (this.channel) {
					this.driver.emit("stop_watching_channel", this.channel, this);
				}

				this.driver.ports.delete(this.id);
				this.driver.log.debug("Port closed", this.id.toString());
				break;
		}
	}

	public postMessage<T extends WorkerMessageType>(type: T, data: TypedWorkerMessage<T>): void {
		this.port.postMessage({
			type: type,
			data: data,
		});
	}
}
