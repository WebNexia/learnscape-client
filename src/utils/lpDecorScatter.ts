export function mulberry32(seed: number) {
	return function next() {
		let t = (seed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function distSq(a: { x: number; y: number }, b: { x: number; y: number }) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}

function tooClose(p: { x: number; y: number }, existing: { x: number; y: number }[], minSq: number) {
	for (const e of existing) {
		if (distSq(p, e) < minSq) return true;
	}
	return false;
}

export type ScatterOptions = {
	/** Minimum Y in 0–1 (keep decor below title band). */
	topMin: number;
	/** Minimum Euclidean distance between icon centers in normalized 0–1 space. */
	minNormDist: number;
};

/**
 * Deterministic pseudo-random positions that stay at least `minNormDist` apart
 * (avoids overlapping decor icons at typical font sizes).
 */
export function scatterNonOverlapping(seed: number, count: number, options: ScatterOptions): { x: number; y: number }[] {
	const rand = mulberry32(seed);
	const minSq = options.minNormDist * options.minNormDist;
	const topMin = options.topMin;
	const xMin = 0.035;
	const xMax = 0.965;
	const yMax = 0.965;
	const out: { x: number; y: number }[] = [];

	const maxAttempts = Math.max(count * 500, 8000);
	for (let n = 0; n < maxAttempts && out.length < count; n++) {
		const x = xMin + rand() * (xMax - xMin);
		const y = topMin + rand() * (yMax - topMin);
		const p = { x, y };
		if (!tooClose(p, out, minSq)) out.push(p);
	}

	// Evenly spaced grid (shuffled) to fill any remaining slots without overlap
	const cols = 7;
	const rows = 6;
	const gridCenters: { x: number; y: number }[] = [];
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			const x = xMin + ((c + 0.5) / cols) * (xMax - xMin);
			const y = topMin + ((r + 0.5) / rows) * (yMax - topMin);
			gridCenters.push({ x, y });
		}
	}
	for (let i = gridCenters.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[gridCenters[i], gridCenters[j]] = [gridCenters[j], gridCenters[i]];
	}
	for (const p of gridCenters) {
		if (out.length >= count) break;
		if (!tooClose(p, out, minSq)) out.push(p);
	}

	return out.slice(0, count);
}
