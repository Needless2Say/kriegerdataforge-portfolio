/*
	The soft glow every fire on the site is built from.

	A radial gradient drawn once into a small canvas and then stamped with
	`drawImage`, usually under `lighter`. Building a gradient per particle per
	frame is what made the old anvil stutter. A stamped sprite gives the same
	bloom for a fraction of the cost.

	The page background keeps its own larger, softer variant in `EmberField`,
	because it is drawn much bigger and tuned to sit behind everything else.
*/

/** Hottest first, coolest last. The ladder every flame on the site uses. */
export const FLAME_RGB = ["255,246,214", "251,191,36", "249,115,22", "185,28,28"] as const;

/** Sparks off a hammer blow, near white through amber. */
export const SPARK_RGB = ["255,250,235", "255,236,179", "253,186,116", "251,191,36"] as const;

/**
 * A glow sprite in one colour.
 *
 * Args:
 *     rgb: The colour as "r,g,b".
 *
 * Returns:
 *     A 64px canvas holding a radial falloff from opaque to clear.
 */
export function makeBlob(rgb: string): HTMLCanvasElement {
	const size = 64;
	const c = document.createElement("canvas");
	c.width = size;
	c.height = size;
	const g = c.getContext("2d");
	if (!g) return c;

	const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
	grad.addColorStop(0, "rgba(" + rgb + ",1)");
	grad.addColorStop(0.35, "rgba(" + rgb + ",0.5)");
	grad.addColorStop(1, "rgba(" + rgb + ",0)");
	g.fillStyle = grad;
	g.fillRect(0, 0, size, size);
	return c;
}

/**
 * Size a canvas to its CSS box at the screen's pixel density.
 *
 * Args:
 *     canvas: The canvas to size.
 *     ctx: Its 2D context. The transform is reset to the new density.
 *     width: CSS width in pixels.
 *     height: CSS height in pixels.
 *
 * Returns:
 *     The density used, capped at 2 like every other canvas on the site.
 */
export function fitCanvas(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
): number {
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	canvas.width = Math.round(width * dpr);
	canvas.height = Math.round(height * dpr);
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	return dpr;
}

/**
 * Wipe a canvas whatever its current transform.
 *
 * Args:
 *     canvas: The canvas to clear.
 *     ctx: Its 2D context.
 *     dpr: The density it was sized at, restored afterwards.
 */
export function clearCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, dpr: number): void {
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * Whether the visitor has asked the system for less motion.
 *
 * Returns:
 *     True when `prefers-reduced-motion: reduce` matches. False on the server.
 */
export function prefersReducedMotion(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
