const darkTheme = true;

function idk(e: number[]) {
	const t = idk2(e);
	let n = t[0],
		o = t[1],
		i = t[2];
	return (
		(o /= 100),
		(i /= 108.883),
		(n = (n /= 95.047) > 0.008856 ? Math.pow(n, 1 / 3) : 7.787 * n + 16 / 116),
		[
			116 * (o = o > 0.008856 ? Math.pow(o, 1 / 3) : 7.787 * o + 16 / 116) - 16,
			500 * (n - o),
			200 * (o - (i = i > 0.008856 ? Math.pow(i, 1 / 3) : 7.787 * i + 16 / 116)),
		]
	);
}

function idk2(e: number[]) {
	let t = e[0] / 255,
		n = e[1] / 255,
		r = e[2] / 255;
	return [
		100 *
			(0.4124 * (t = t > 0.04045 ? Math.pow((t + 0.055) / 1.055, 2.4) : t / 12.92) +
				0.3576 * (n = n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92) +
				0.1805 * (r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92)),
		100 * (0.2126 * t + 0.7152 * n + 0.0722 * r),
		100 * (0.0193 * t + 0.1192 * n + 0.9505 * r),
	];
}

function idk3(e: number[]) {
	let t = 0,
		n = 0,
		r = 0,
		o = 0;
	const i = e[0] ?? 0,
		a = e[1],
		s = e[2];
	return (
		i <= 8
			? (o = ((n = (100 * i) / 903.3) / 100) * 7.787 + 16 / 116)
			: ((n = 100 * Math.pow((i + 16) / 116, 3)), (o = Math.pow(n / 100, 1 / 3))),
		[
			(t =
				t / 95.047 <= 0.008856
					? (t = (95.047 * (a / 500 + o - 16 / 116)) / 7.787)
					: 95.047 * Math.pow(a / 500 + o, 3)),
			n,
			(r =
				r / 108.883 <= 0.008859
					? (r = (108.883 * (o - s / 200 - 16 / 116)) / 7.787)
					: 108.883 * Math.pow(o - s / 200, 3)),
		]
	);
}

function idk4(e: number[]) {
	let t, n, r;
	const o = e[0] / 100,
		i = e[1] / 100,
		a = e[2] / 100;
	return (
		(n = -0.9689 * o + 1.8758 * i + 0.0415 * a),
		(r = 0.0557 * o + -0.204 * i + 1.057 * a),
		(t =
			(t = 3.2406 * o + -1.5372 * i + -0.4986 * a) > 0.0031308
				? 1.055 * Math.pow(t, 1 / 2.4) - 0.055
				: (t *= 12.92)),
		(n = n > 0.0031308 ? 1.055 * Math.pow(n, 1 / 2.4) - 0.055 : (n *= 12.92)),
		(r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : (r *= 12.92)),
		[
			255 * (t = Math.min(Math.max(0, t), 1)),
			255 * (n = Math.min(Math.max(0, n), 1)),
			255 * (r = Math.min(Math.max(0, r), 1)),
		]
	);
}

function idk5(e: number[]) {
	const n = [e[0], e[1], e[2]].map(function (e) {
		return (e /= 255) <= 0.03928 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2];
}

function calculateContrast(e: number[], n: number[]) {
	const t = idk5(e) + 0.05,
		a = idk5(n) + 0.05;
	return t > a ? t / a : a / t;
}

export function normalizeColour(colour: string, highContrast: boolean): string {
	const normalized = colour.substring(1).toLowerCase();
	const asArray = [normalized.substring(0, 2), normalized.substring(2, 4), normalized.substring(4, 6)].map((e) =>
		parseInt(e, 16),
	);
	if (
		highContrast === darkTheme &&
		asArray.every(function (e) {
			return e < 36;
		})
	)
		return "7A7A7A";
	const g = highContrast === !darkTheme ? [250, 249, 250] : [15, 14, 17];
	let v = calculateContrast(asArray, g);

	if (v > 4.5) return normalized;

	let y = new Array(...asArray) as number[];
	for (let k = 50; k >= 0 && v < 4.5; k--) {
		const S = idk(y);
		highContrast === !darkTheme ? (S[0] -= 0.1 * S[0]) : (S[0] += 0.1 * S[0]);
		y = idk4(idk3(S));
		v = calculateContrast(y, g);
	}
	const res = y.map((e) => e.toString(16)).join("");
	return res;
}
