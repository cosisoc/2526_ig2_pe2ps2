<script>
import Slider from '$lib/ui/Slider.svelte';
import Toggle from '$lib/ui/Toggle.svelte';
import RangeSlider from '$lib/ui/RangeSlider.svelte';

// Größe einer Raute
const a = 120;
const sqrt3 = Math.sqrt(3);

// Eine Raute (4 Ecken)
const baseRhombus = [
	[0, 0],
	[a / 2, -a * sqrt3 / 2],
	[0, -a * sqrt3],
	[-a / 2, -a * sqrt3 / 2]
];

// Punkt drehen
function rotatePoint(x, y, degrees) {
	const rad = degrees * Math.PI / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	return [x * cos - y * sin, x * sin + y * cos];
}

// 6 Rauten für einen Stern (statisch, ohne Verzerrung)
let rhombi = [];
for (let i = 0; i < 6; i++) {
	let rotatedRhombus = [];
	for (let j = 0; j < baseRhombus.length; j++) {
		const point = baseRhombus[j];
		const rotated = rotatePoint(point[0], point[1], i * 60);
		rotatedRhombus.push(rotated);
	}
	rhombi.push(rotatedRhombus);
}

// Funktion zum Bauen von verzerrten Rauten
// Verzerrung wird VOR der Rotation angewendet!
function buildDistortedRhombi(distortionScale) {
	let distorted = [];
	for (let i = 0; i < 6; i++) {
		let rotatedRhombus = [];
		for (let j = 0; j < baseRhombus.length; j++) {
			const point = baseRhombus[j];
			// Berechne, wie weit der Punkt entlang der Raute von innen (0) nach außen (1) liegt
			// axis von point0 (y=0) nach point2 (y=-a*sqrt3) => t = -y / (a*sqrt3)
			let t = -point[1] / (a * sqrt3);
			if (t < 0) t = 0; if (t > 1) t = 1;
			// Wir möchten Verzerrung nur auf die innere Hälfte (t in [0,0.5]) anwenden.
			// Interpolationsfaktor: distortionScale at center (t=0) -> 1 at midpoint (t=0.5)
			// Apply distortion only to the outer half (t in (0.5,1]).
			// Inner half (t <= 0.5) remains unchanged to avoid creating gaps.
			let localFactor = 1;
			let distortedX;
			// make sure distortedY is declared before any assignment
			let distortedY = point[1];
			// Two modes:
			// - expansion (distortionScale >= 1): apply effect starting at effectStart (affects side + outer)
			// - shrinking (distortionScale < 1): apply effect only to outer half (t>=0.5)
			const effectStart = 0.25;
			let u = 0;
			if (distortionScale >= 1) {
				if (t >= effectStart) {
					u = Math.min(1, (t - effectStart) / (1 - effectStart)); // 0..1 across effect zone
					// For expansion: instead of widening X, compress the Y (raise the middle)
					// so the rhombi flatten and become hexagon-like.
					// Safety: cap compression to avoid inversion or excessive squashing.
					const yCompressFactor = 0.6; // 0..1, higher -> stronger compression
					const maxCompressAmount = 0.85; // do not compress more than this fraction
					const minYScale = 0.05; // never scale Y below this to avoid inversion
					let compressAmount = (distortionScale - 1) * u * yCompressFactor;
					if (!isFinite(compressAmount) || compressAmount < 0) compressAmount = 0;
					compressAmount = Math.min(maxCompressAmount, compressAmount);
					distortedX = point[0];
					distortedY = point[1] * Math.max(minYScale, 1 - compressAmount);
				} else {
					distortedX = point[0];
					distortedY = point[1];
				}
			} else {
				// shrinking: only outer half (t in [0.5,1]) is thinned
				const outerStart = 0.5;
				if (t >= outerStart) {
					u = Math.min(1, (t - outerStart) / (1 - outerStart));
					localFactor = 1 + (distortionScale - 1) * u;
					distortedX = point[0] * localFactor;
				} else {
					distortedX = point[0];
				}
			}
			// Dann rotieren
			let rotated = rotatePoint(distortedX, distortedY, i * 60);

			// Nach der Rotation: wenn der Punkt zur äußeren Zone gehört (u>0), schieben
			// wir ihn stufenweise auf den Hexagon-Radius hinaus, damit die Rauten
			// bei voller Verzerrung ein Sechseck bilden (keine Lücken mehr).
			// Only apply outward adjustment when we are expanding (distortionScale > 1)
			if (u > 0 && distortionScale > 1) {
				const hexRadius = a * sqrt3; // Zielradius für Sechseck-Kante
				const dist = Math.hypot(rotated[0], rotated[1]);
				if (dist > 1e-6) {
					const targetScale = hexRadius / dist;
					const outwardScale = 1 + u * (targetScale - 1);
					rotated = [rotated[0] * outwardScale, rotated[1] * outwardScale];
				}
			}
			rotatedRhombus.push(rotated);
		}
		distorted.push(rotatedRhombus);
	}
	return distorted;
}

// Punkte zu SVG String
function pointsToStr(points) {
	let str = '';
	for (let i = 0; i < points.length; i++) {
		str += points[i][0] + ',' + points[i][1];
		if (i < points.length - 1) str += ' ';
	}
	return str;
}

// Slider Werte (exported for parent control)
export let rows = 15;
export let steps = 12;
export let gapSize = 0.0;
export let triangleOpacity = 100;
export let starSpacing = 1.0; // Default auf 1.0 für Raute 3
export let rotation = 0;
export let showGaps = true;
export let monoColor = false;
export let radialDistortion = 0.0; // Verzerrung: 0=normal, >0=Sterne breiter, <0=Gaps breiter
export let strokeWidth = 0.0;

// Verzerrung NUR in X-Richtung (Breite), Y bleibt konstant
// Bei radialDistortion > 0: Stern-Rauten werden breiter, Gap-Rauten schmaler
// Bei radialDistortion < 0: Stern-Rauten werden schmaler, Gap-Rauten breiter
$: starDistortionScale = 1.0 + radialDistortion * 0.3; // 30% Breiten-Änderung pro Einheit
$: gapDistortionScale = 1.0 - radialDistortion * 0.3; // Invers zu Sternen

// Verzerrte Stern-Rauten: Verzerrung wird VOR der Rotation angewendet
// So wird jede Raute in ihrem eigenen lokalen Koordinatensystem verzerrt
$: distortedStarRhombi = buildDistortedRhombi(starDistortionScale);

// Verzerrte Gap-Rauten (einfache X-Skalierung, keine Rotation nötig)
$: distortedGapRhombus = baseRhombus.map(point => [
	point[0] * gapDistortionScale,  // X wird verzerrt
	point[1]                        // Y bleibt original
]);

// Statische Metriken - bleiben konstant auch bei Verzerrung
// Die Positionen der Sterne ändern sich NICHT, nur die Rauten-Form
$: staticMetrics = (() => {
	let allYs = [], allXs = [];
	for (let i = 0; i < rhombi.length; i++) {
		for (let j = 0; j < rhombi[i].length; j++) {
			allYs.push(rhombi[i][j][1]);
			allXs.push(rhombi[i][j][0]);
		}
	}
	const moduleHeight = Math.max(...allYs) - Math.min(...allYs);
	const halfModuleWidth = (Math.max(...allXs) - Math.min(...allXs)) / 2;
	const baseDistance = a * sqrt3 * 1.727; // Konstant, keine Verzerrung
	const rowSpacing = moduleHeight * 0.75;
	return { moduleHeight, halfModuleWidth, baseDistance, rowSpacing };
})();

// Wenn starSpacing < 1.0: Sterne werden kleiner, Abstand bleibt 1.0
// Wenn starSpacing >= 1.0: Sterne bleiben normal, Abstand wird größer
$: actualDistance = Math.max(starSpacing, 1.0);
$: starScale = Math.min(starSpacing, 1.0);
$: gapScale = actualDistance;

// Farben
const defaultColors = ['#6B8A5F', '#2E5F3A', '#D8F0E2'];
export let colors = ['#6B8A5F', '#2E5F3A', '#D8F0E2'];


// Presets: arrays of three colors
const presets = [
	['#A0B5A8', '#2E5F3A', '#D8F0E2'],
	['#F6D6AD', '#F28C66', '#C85A3A'],
	['#D6EAF8', '#8FBFE0', '#2A6F97'],
	['#FFE6F0', '#FF9EC3', '#FF5A9E']
];

let selectedPreset = 1; // use the warm preset (#F6D6AD) by default

// Lightness range and brightness adjustment
let minLight = 0; // percent
let maxLight = 100; // percent

function selectPreset(i) {
	selectedPreset = i;
	colors = [...presets[i]];
}

// initialize colors from the selected preset on load
colors = [...presets[selectedPreset]];

// color helpers (hex <-> rgb <-> hsl)
function hexToRgb(hex) {
	hex = hex.replace('#', '');
	if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
	const num = parseInt(hex, 16);
	return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex({ r, g, b }) {
	const two = (n) => n.toString(16).padStart(2, '0');
	return '#' + two(Math.round(r)).toLowerCase() + two(Math.round(g)).toLowerCase() + two(Math.round(b)).toLowerCase();
}

function rgbToHsl({ r, g, b }) {
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h, s, l = (max + min) / 2;
	if (max === min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}
	return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }) {
	h /= 360; s /= 100; l /= 100;
	let r, g, b;
	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		};
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}
	return { r: r * 255, g: g * 255, b: b * 255 };
}

// compute displayed colors by remapping each color's lightness into [minLight, effectiveMax]
// scale maxLight so slider value 100 maps to ~80% (avoid full white)
$: displayColors = colors.map(hex => {
	const rgb = hexToRgb(hex);
	const hsl = rgbToHsl(rgb);
	const capFactor = 0.8; // slider 100 -> 80
	const effectiveMax = Math.max(minLight, Math.min(100, maxLight * capFactor));
	const mappedL = minLight + (hsl.l / 100) * (effectiveMax - minLight);
	const newRgb = hslToRgb({ h: hsl.h, s: hsl.s, l: mappedL });
	return rgbToHex(newRgb);
});

// Vordefinierte Farbpaletten
const colorPalettes = [
	{ name: 'Grün Töne', colors: ['#6B8A5F', '#2E5F3A', '#D8F0E2'] },
	{ name: 'Sunset', colors: ['#FF6B6B', '#FFD93D', '#6BCF7F'] },
	{ name: 'Ocean', colors: ['#1E3A8A', '#3B82F6', '#93C5FD'] },
	{ name: 'Purple Dream', colors: ['#7C3AED', '#C084FC', '#E9D5FF'] },
	{ name: 'Pastel', colors: ['#FFC0CB', '#FFE4B5', '#E0BBE4'] },
	{ name: 'Forest', colors: ['#2D5016', '#6B8E23', '#9ACD32'] },
	{ name: 'Autumn', colors: ['#8B4513', '#D2691E', '#CD853F'] },
	{ name: 'Neon', colors: ['#FF00FF', '#00FFFF', '#FFFF00'] },
	{ name: 'Monochrome', colors: ['#333333', '#666666', '#999999'] },
	{ name: 'Fire', colors: ['#DC143C', '#FF4500', '#FFA500'] },
	{ name: 'Ice', colors: ['#00CED1', '#87CEEB', '#B0E0E6'] },
	{ name: 'Earth', colors: ['#8B4513', '#A0522D', '#D2B48C'] },
];

export function applyPalette(palette) {
	colors = [...palette.colors];
}

function randomColor() {
	const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
	return '#' + hex;
}

export function randomizeColors() {
	colors = [randomColor(), randomColor(), randomColor()];
}

export function resetColors() {
	colors = ['#6B8A5F', '#2E5F3A', '#D8F0E2'];
}

export function toggleMonoColor() {
	monoColor = !monoColor;
}

export function resetToDefaults() {
	gapSize = 0.0;
	triangleOpacity = 50;
	starSpacing = 1.0;
	rotation = 0;
	showGaps = true;
	monoColor = false;
	radialDistortion = 0.0;
	colors = ['#6B8A5F', '#2E5F3A', '#D8F0E2'];
}

// Sternpositionen berechnen - nutze STATISCHE Metriken (keine Verzerrung der Positionen)
$: moduleCenters = (() => {
	let stars = [];
	const baseRowSpacing = staticMetrics.rowSpacing;
	const baseDist = staticMetrics.baseDistance;
	const centerOffsetY = -((rows - 1) / 2) * baseRowSpacing;

	for (let row = 0; row < rows; row++) {
		const baseY = row * baseRowSpacing + centerOffsetY;
		const xShift = (row % 2 === 1) ? staticMetrics.halfModuleWidth : 0;

		for (let col = -steps; col <= steps; col++) {
			const baseX = col * baseDist + xShift;
			stars.push({
				x: baseX * actualDistance,
				y: baseY * actualDistance
			});
		}
	}
	return stars;
})();

// Lücken-Rauten berechnen - nutze STATISCHE Metriken (keine Verzerrung der Positionen)
$: gapCenters = (() => {
	let gaps = [];
	const baseRowSpacing = staticMetrics.rowSpacing;
	const baseDist = staticMetrics.baseDistance;
	const centerOffsetY = -((rows - 1) / 2) * baseRowSpacing;
	// Gap-Abstand bleibt konstant (original Größe)
	const baseGapDistance = a * sqrt3;

	for (let row = 0; row < rows; row++) {
		const baseY = row * baseRowSpacing + centerOffsetY;
		const xShift = (row % 2 === 1) ? staticMetrics.halfModuleWidth : 0;

		for (let col = -steps; col <= steps; col++) {
			const baseCenterX = col * baseDist + xShift;
			const baseCenterY = baseY;

			const angles = [30, 90, 150];
			const rotations = [0, 60, 120];

			for (let i = 0; i < 3; i++) {
				const rad = angles[i] * Math.PI / 180;
				const baseGapX = baseCenterX + baseGapDistance * Math.cos(rad);
				const baseGapY = baseCenterY + baseGapDistance * Math.sin(rad);

				gaps.push({
					x: baseGapX * actualDistance,
					y: baseGapY * actualDistance,
					rotation: rotations[i]
				});
			}
		}
	}
	return gaps;
})();

// Welche Farbe für welche Raute
$: colorMap = monoColor ? {
	0: displayColors[0],
	1: displayColors[0],
	2: displayColors[0],
	3: displayColors[0],
	4: displayColors[0],
	5: displayColors[0]
} : {
	0: displayColors[0],
	1: displayColors[1],
	2: displayColors[2],
	3: displayColors[0],
	4: displayColors[1],
	5: displayColors[2]
};

$: gapColorMap = monoColor ? {
	0: displayColors[0],
	60: displayColors[0],
	120: displayColors[0]
} : {
	0: displayColors[0],
	60: displayColors[1],
	120: displayColors[2]
};
</script>

<div class="svg-container">
	<!-- Mitte: SVG Pattern -->
	<div style="flex: 1; height: 100%; display: flex; align-items: center; justify-content: center;">
		<svg viewBox="-900 -1000 1800 2000" class="svg-canvas" shape-rendering="crispEdges" style="max-width: 100%; max-height: 100%; aspect-ratio: 0.9;">
			{#key [colors, radialDistortion]}
			{#each moduleCenters as star}
				<g transform="translate({star.x} {star.y}) rotate({rotation})">
					{#each distortedStarRhombi as rhombus, i}
						<polygon 
							points={pointsToStr([rhombus[0], rhombus[3], rhombus[2]])} 
							fill={colorMap[i]} 
							stroke="#000" 
							stroke-width={strokeWidth} 
						/>
						<polygon 
							points={pointsToStr([rhombus[0], rhombus[1], rhombus[2]])} 
							fill={colorMap[i]} 
							fill-opacity={triangleOpacity / 100} 
							stroke="#000" 
							stroke-width={strokeWidth} 
						/>
						<line 
							x1={rhombus[0][0]} 
							y1={rhombus[0][1]} 
							x2={rhombus[2][0]} 
							y2={rhombus[2][1]} 
							stroke="#000" 
							stroke-width={strokeWidth} 
						/>
					{/each}
				</g>
			{/each}

			{#if showGaps}
			{#each gapCenters as gap}
				<g transform="translate({gap.x} {gap.y}) rotate({rotation + gap.rotation})">
					<polygon 
						points={pointsToStr([distortedGapRhombus[0], distortedGapRhombus[3], distortedGapRhombus[2]])} 
						fill={gapColorMap[gap.rotation] || colors[1]} 
						stroke="#000" 
						stroke-width={strokeWidth} 
					/>
					<polygon 
						points={pointsToStr([distortedGapRhombus[0], distortedGapRhombus[1], distortedGapRhombus[2]])} 
						fill={gapColorMap[gap.rotation] || colors[1]} 
						fill-opacity={triangleOpacity / 100} 
						stroke="#000" 
						stroke-width={strokeWidth} 
					/>
					<line 
						x1={distortedGapRhombus[0][0]} 
						y1={distortedGapRhombus[0][1]} 
						x2={distortedGapRhombus[2][0]} 
						y2={distortedGapRhombus[2][1]} 
						stroke="#000" 
						stroke-width={strokeWidth} 
					/>
				</g>
			{/each}
			{/if}
			{/key}
		</svg>
		</div>

</div>

<div class="sidebar-right">
	<Slider min={-6.7} max={0} step={0.01} bind:value={radialDistortion} label="Verzerrung" />
	<hr />
	<div style="width:310px;">
		<label style="display:block; margin-bottom:6px; font-weight:600;">Presets</label>
		<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
			{#each presets as p, i}
				<button on:click={() => selectPreset(i)} class="preset-button" class:selected={selectedPreset === i}>
					<div style="display:flex; gap:4px;">
						{#each p as c}
							<div style="width:26px; height:20px; background:{c}; border-radius:2px;"></div>
						{/each}
					</div>
				</button>
			{/each}
		</div>

		<label style="display:block; margin-bottom:6px; font-weight:600;">Lightness Range (%)</label>
		<RangeSlider min={0} max={100} step={1} bind:value1={minLight} bind:value2={maxLight} label="Range" />
	</div>
	
</div>

<style>
.svg-container {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f5f5f5;
	gap: 0;
	padding: 0;
	box-sizing: border-box;
}

.svg-canvas {
	width: 100%;
	height: 100%;
	background: white;
	border: 1px solid #ddd;
}

	.controls {
		width: 300px;
		min-width: 300px;
		height: 100%;
		background: white;
		padding: 20px;
		border-left: 1px solid #ddd;
		overflow-y: auto;
		box-sizing: border-box;
	}

	.controls label {
		display: block;
		font-family: Arial, sans-serif;
		font-size: 14px;
		margin-bottom: 8px;
	}

	.controls input[type="range"] {
		width: 200px;
		display: block;
		margin-top: 5px;
	}

	.button-group {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 10px;
	}

	.controls button {
		padding: 8px 15px;
		background: #91A599;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-family: Arial, sans-serif;
		font-size: 13px;
		transition: background 0.2s;
	}

	.controls button:hover {
		background: #7a8e85;
	}

	.controls button:active {
		background: #6a7e75;
	}

	/* Farbauswahl Sektion */
	.color-section {
		margin-top: 20px;
		padding-top: 20px;
		border-top: 2px solid #e0e0e0;
	}

	.color-section h4 {
		margin: 0 0 15px 0;
		font-family: Arial, sans-serif;
		font-size: 16px;
		color: #333;
		font-weight: 600;
	}

	.color-pickers {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
	}

	.color-picker-item {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.color-picker-item label {
		font-family: Arial, sans-serif;
		font-size: 13px;
		color: #555;
		font-weight: 500;
	}

	.color-input-wrapper {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.color-input-wrapper input[type="color"] {
		width: 60px;
		height: 40px;
		border: 2px solid #ddd;
		border-radius: 6px;
		cursor: pointer;
		padding: 3px;
	}

	.color-input-wrapper input[type="color"]:hover {
		border-color: #91A599;
	}

	.color-code {
		font-family: monospace;
		font-size: 12px;
		color: #666;
		text-transform: uppercase;
	}

	.palettes-section {
		margin-top: 15px;
	}

	.palettes-section > label {
		display: block;
		margin-bottom: 10px;
		font-family: Arial, sans-serif;
		font-size: 13px;
		color: #555;
		font-weight: 500;
	}

	.palette-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		max-height: 300px;
		overflow-y: auto;
	}

	.palette-button {
		padding: 8px;
		background: white;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		gap: 5px;
		align-items: center;
	}

	.palette-button:hover {
		border-color: #91A599;
		background: #f9f9f9;
		transform: translateY(-2px);
	}

	.palette-preview {
		display: flex;
		width: 100%;
		height: 30px;
		border-radius: 4px;
		overflow: hidden;
	}

	.palette-color {
		flex: 1;
	}

	.palette-name {
		font-family: Arial, sans-serif;
		font-size: 11px;
		color: #666;
		text-align: center;
	}

	.preset-button {
		border: 2px solid transparent;
		padding: 6px;
		background: transparent;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.preset-button:hover {
		border-color: #91A599;
		background: rgba(145, 165, 153, 0.1);
	}

	.preset-button.selected {
		border-color: #91A599;
		background: rgba(145, 165, 153, 0.15);
		box-shadow: 0 0 0 1px #91A599;
	}
</style>