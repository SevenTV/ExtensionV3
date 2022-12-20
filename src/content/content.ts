// Inject extension into site
const inject = () => {
	// Script
	const script = document.createElement("script");
	script.src = chrome.runtime.getURL("site.js");
	script.id = "seventv";
	script.type = "module";

	// Style
	const style = document.createElement("link");
	style.rel = "stylesheet";
	style.type = "text/css";
	style.href = chrome.runtime.getURL("styles.css");
	style.setAttribute("charset", "utf-8");
	style.setAttribute("content", "text/html");
	style.setAttribute("http-equiv", "content-type");
	style.id = "seventv-stylesheet";

	(document.head || document.documentElement).appendChild(script);
	(document.head || document.documentElement).appendChild(style);
};

(() => {
	inject();
})();
