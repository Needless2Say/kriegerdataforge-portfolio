/*
	Drawing one binary digit, used by the loader's sparks and by the page
	background so the two cannot drift apart.

	Two things are going on here.

	A bit digit is never a single colour. Blue and purple travel across the
	glyph, so the colour moves through the character itself rather than the
	character picking one and holding it.

	Every digit also breaks up from time to time. The glyph tears into bands that
	slide apart, its colour channels pull away from each other, and a band
	occasionally drops out entirely.
*/

const BIT_BLUE   = [59, 130, 246];
const BIT_PURPLE = [168, 85, 247];

/*
	How many blue to purple cycles span one glyph. Above one, so a digit carries
	a clear band of each with the boundary somewhere inside it.
*/
const WAVES_PER_GLYPH = 1.6;

/*
	Nine stops. The blend is sampled, not interpolated by the browser between two
	ends, so it needs enough stops to stay smooth across a cycle and a half.
*/
const STOPS = 8;

/** How far the sweep reaches from the glyph centre, as a share of the font size. */
const SWEEP = 0.32;

const BANDS = 5;

/**
 * A point on the blue to purple blend, as an "r,g,b" string.
 *
 * Args:
 *     t: Position along the blend. Unbounded, and wraps on its own.
 *
 * Returns:
 *     The colour at that point, ready to drop into an rgb() or rgba() string.
 *
 * A cosine rather than a sawtooth, so the blend arrives back where it started
 * with no seam. A sawtooth would snap purple to blue once per cycle, which
 * reads as a fault rather than as flow. Interpolating straight between the two
 * ends passes through indigo on the way, which is why there is no third colour.
 */
export function bitMix(t: number): string {
	const m = 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
	const r = Math.round(BIT_BLUE[0] + (BIT_PURPLE[0] - BIT_BLUE[0]) * m);
	const g = Math.round(BIT_BLUE[1] + (BIT_PURPLE[1] - BIT_BLUE[1]) * m);
	const b = Math.round(BIT_BLUE[2] + (BIT_PURPLE[2] - BIT_BLUE[2]) * m);
	return `${r},${g},${b}`;
}

/**
 * A gradient carrying the blend across one glyph.
 *
 * Args:
 *     ctx: The canvas context the gradient will be used on.
 *     x: Glyph centre, x.
 *     y: Glyph centre, y.
 *     size: Font size in pixels. The sweep is scaled from this.
 *     angle: Sweep direction in radians.
 *     phase: Travelling offset. Advance it per frame to make the blend move.
 *     alpha: Opacity applied to every stop.
 *
 * Returns:
 *     A linear gradient spanning the glyph.
 *
 * The sweep is sized to the ink rather than to a box around it. Reaching wider
 * puts only the middle of the blend on the character and the two colours stop
 * separating.
 */
export function bitGradient(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	angle: number,
	phase: number,
	alpha: number,
): CanvasGradient {
	const radius = size * SWEEP;
	const dx = Math.cos(angle) * radius;
	const dy = Math.sin(angle) * radius;
	const grad = ctx.createLinearGradient(x - dx, y - dy, x + dx, y + dy);

	for (let i = 0; i <= STOPS; i++) {
		const at = i / STOPS;
		grad.addColorStop(at, `rgba(${bitMix(at * WAVES_PER_GLYPH + phase)},${alpha})`);
	}

	return grad;
}

/**
 * A repeatable 0 to 1 from an integer.
 *
 * Args:
 *     n: Any number. Callers pass a per-glyph seed plus a band index.
 *
 * Returns:
 *     A value in [0, 1).
 *
 * Repeatable on purpose. A glitch has to hold the same tear pattern for a few
 * frames, otherwise every band reshuffles 60 times a second and the whole thing
 * turns to noise instead of reading as a broken character.
 */
function hash(n: number): number {
	const s = Math.sin(n * 12.9898) * 43758.5453;
	return s - Math.floor(s);
}

/*
	The glow behind a digit is a soft sprite stamped under `lighter`, not a
	canvas shadow.

	Measured in Edge with the GPU off, a shadowed draw costs in proportion to
	the whole canvas rather than to the glyph. 140 digits took 27ms a frame on
	a 400x300 canvas and 494ms on a 1280x900 one, against about 2ms for the
	same 140 with a stamped sprite. Several canvases on the site cover the full
	screen, so the shadow was quietly the most expensive thing on every page.
	Measured side by side, the sprite keeps the blend across the glyph exactly
	where the shadow had it.
*/
const GLOW_SIZE = 48;
const glowSprites = new Map<string, HTMLCanvasElement>();

/**
 * A soft round glow in one colour, drawn once and reused.
 *
 * Args:
 *     rgb: The colour as "r,g,b", already rounded by the caller.
 *
 * Returns:
 *     A small canvas holding a radial falloff from bright to clear.
 */
function glowSprite(rgb: string): HTMLCanvasElement {
	const cached = glowSprites.get(rgb);
	if (cached) return cached;

	// The set is small by construction, this only guards against a caller that is not.
	if (glowSprites.size > 64) glowSprites.clear();

	const sprite = document.createElement("canvas");
	sprite.width = GLOW_SIZE;
	sprite.height = GLOW_SIZE;
	const g = sprite.getContext("2d");
	if (g) {
		const half = GLOW_SIZE / 2;
		const grad = g.createRadialGradient(half, half, 0, half, half, half);
		grad.addColorStop(0, `rgba(${rgb},0.9)`);
		grad.addColorStop(0.4, `rgba(${rgb},0.38)`);
		grad.addColorStop(1, `rgba(${rgb},0)`);
		g.fillStyle = grad;
		g.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
	}
	glowSprites.set(rgb, sprite);
	return sprite;
}

/**
 * Round a colour so the glows come from a small fixed set of sprites.
 *
 * Args:
 *     rgb: The colour as "r,g,b".
 *
 * Returns:
 *     The same colour with each channel rounded to a step of 12.
 *
 * The blend moves continuously, so without this every frame would ask for a
 * colour never seen before. Along the blue to purple line, steps of 12 leave
 * about a dozen distinct glows, which no one can tell apart behind a glyph.
 */
function roundGlow(rgb: string): string {
	return rgb
		.split(",")
		.map((channel) => Math.min(255, Math.round(Number(channel) / 12) * 12))
		.join(",");
}

export interface GlyphPaint {
	/** Fill for the character. A gradient for bit digits, an "r,g,b" for fire. */
	fill: string | CanvasGradient;
	/** Halo colour behind it, as "r,g,b". */
	glow: string;
}

/**
 * Draw one digit, with its glow, and break it up if it is mid glitch.
 *
 * Args:
 *     ctx: Canvas context.
 *     char: The character to draw, "0" or "1".
 *     x: Glyph centre, x.
 *     y: Glyph centre, y.
 *     size: Font size in pixels.
 *     alpha: Overall opacity.
 *     paint: Fill and glow colours.
 *     glitch: 0 for a clean glyph, up to 1 for fully broken up.
 *     seed: Per glyph seed. Re-roll it to change the tear pattern.
 *
 * The glow is stamped first and additively, then the glyph is painted over it
 * normally. Painting both additively is what used to drive blue and purple to
 * within a few points of white, at which point every digit looked like the same
 * pale colour no matter what the gradient said.
 */
export function drawGlyph(
	ctx: CanvasRenderingContext2D,
	char: string,
	x: number,
	y: number,
	size: number,
	alpha: number,
	paint: GlyphPaint,
	glitch: number,
	seed: number,
): void {
	if (alpha <= 0.01) return;

	ctx.globalAlpha = 1;
	ctx.font = `bold ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	// Glow. A little taller than wide, like the digit it sits behind.
	const glowX = size * 0.65;
	const glowY = size * 0.85;
	ctx.globalCompositeOperation = "lighter";
	ctx.globalAlpha = alpha * 0.5;
	ctx.drawImage(glowSprite(roundGlow(paint.glow)), x - glowX, y - glowY, glowX * 2, glowY * 2);
	ctx.globalAlpha = 1;

	ctx.globalCompositeOperation = "source-over";

	if (glitch <= 0.01) {
		ctx.fillStyle = paint.fill;
		ctx.fillText(char, x, y);
		return;
	}

	// Colour channels pulled apart.
	const split = glitch * size * 0.22;
	ctx.fillStyle = `rgba(255,0,110,${alpha * 0.5})`;
	ctx.fillText(char, x - split, y);
	ctx.fillStyle = `rgba(0,225,255,${alpha * 0.5})`;
	ctx.fillText(char, x + split, y);

	/*
		The character in horizontal bands that slide apart. Each band is clipped
		and then drawn offset, while the gradient stays put in canvas space, so
		the colour tears along with the shape rather than travelling with it.
	*/
	const height = size * 1.25;
	const top = y - height / 2;
	const bandHeight = height / BANDS;

	for (let i = 0; i < BANDS; i++) {
		if (hash(seed + i) < 0.14 * glitch) continue;          // band drops out
		const offset = (hash(seed + i * 7 + 3) - 0.5) * size * 0.55 * glitch;

		ctx.save();
		ctx.beginPath();
		ctx.rect(x - size, top + bandHeight * i, size * 2, bandHeight + 0.6);
		ctx.clip();
		ctx.fillStyle = paint.fill;
		ctx.fillText(char, x + offset, y);
		ctx.restore();
	}
}
