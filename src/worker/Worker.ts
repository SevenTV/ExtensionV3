const sw = (self as unknown) as SharedWorkerGlobalScope;

declare let onconnect: (e: MessageEvent) => void;

sw.onconnect = function(conn) {
	for (const port of conn.ports) {
		port.postMessage("foo");

		port.addEventListener("message", () => {
			port.postMessage("bar!");
		});
	}
};
