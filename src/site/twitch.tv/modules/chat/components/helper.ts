import { hasBadContrast, darken, parseToRgba } from "color2k";
import { getChatController } from "@/site/twitch.tv";

// Temporary solution
const darkTheme = getChatController()?.props.theme ?? true;

const calculated = new Map<boolean, Map<string, string>>();
calculated.set(true, new Map<string, string>());
calculated.set(false, new Map<string, string>());

export function normalizeColor(colour: string, readableColors: boolean): string {
	let temp = colour.toLowerCase();
	const shouldShiftUp = readableColors === darkTheme;
	const backgroundColor = shouldShiftUp ? "#0f0e11" : "#faf9fa";

	if (!hasBadContrast(temp, "readable", backgroundColor)) return temp;

	// See if we have calculated the value
	const stored = calculated.get(shouldShiftUp)?.get(colour);
	if (stored) return stored;

	const rgb = parseToRgba(temp).slice(0, 3);

	if (shouldShiftUp && rgb.every((e) => e < 36)) {
		calculated.get(shouldShiftUp)?.set(colour, "#7a7a7a");
		return "#7a7a7a";
	}

	let i = 0;

	while (hasBadContrast(temp, "readable", backgroundColor) && i < 50) {
		temp = darken(temp, 0.1 * (shouldShiftUp ? -1 : 1));
		i++;
	}

	calculated.get(shouldShiftUp)?.set(colour, temp);

	return temp;
}
