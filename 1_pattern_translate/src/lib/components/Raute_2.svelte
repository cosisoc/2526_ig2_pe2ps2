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

// 6 Rauten für einen Stern
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

// Punkte zu SVG String
function pointsToStr(points) {
	let str = '';
	for (let i = 0; i < points.length; i++) {
		str += points[i][0] + ',' + points[i][1];
		if (i < points.length - 1) str += ' ';
	}
	return str;
}

// Berechne Höhe und Breite
let allYs = [];
let allXs = [];
for (let i = 0; i < rhombi.length; i++) {
	for (let j = 0; j < rhombi[i].length; j++) {
		allYs.push(rhombi[i][j][1]);
		allXs.push(rhombi[i][j][0]);
	}
}
const moduleHeight = Math.max(...allYs) - Math.min(...allYs);
const halfModuleWidth = (Math.max(...allXs) - Math.min(...allXs)) / 2;

const baseDistance = a * sqrt3 * 1.727;
const rowSpacing = moduleHeight * 0.75;

// Slider Werte (exported for parent control)
export let rows = 15;
export let steps = 12;
export let gapSize = 0.0;
export let triangleOpacity = 50;
export let starSpacing = 1.0;
export let starOffset = 0;
export let rotation = 0;
export let showGaps = true;
export let monoColor = false;
export let strokeWidth = 0.0;

// Wenn starSpacing < 1.0: Sterne werden kleiner, Abstand bleibt 1.0
// Wenn starSpacing >= 1.0: Sterne bleiben normal, Abstand wird größer
$: actualDistance = Math.max(starSpacing, 1.0);
$: starScale = Math.min(starSpacing, 1.0);
$: gapScale = actualDistance; // Lücken-Rauten skalieren mit actualDistance
$: d = baseDistance * actualDistance;
$: verticalSpacing = rowSpacing * actualDistance;

// Farben
const defaultColors = ['#91A599', '#849179', '#B6CDC7'];
export let colors = ['#91A599', '#849179', '#B6CDC7'];

// Lightness range
let minLight = 20;
let maxLight = 80;

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
// cap slider max so 100 maps to ~80% to avoid full-white
$: displayColors = colors.map(hex => {
	const rgb = hexToRgb(hex);
	const hsl = rgbToHsl(rgb);
	const capFactor = 0.8;
	const effectiveMax = Math.max(minLight, Math.min(100, maxLight * capFactor));
	const mappedL = minLight + (hsl.l / 100) * (effectiveMax - minLight);
	const newRgb = hslToRgb({ h: hsl.h, s: hsl.s, l: mappedL });
	return rgbToHex(newRgb);
});

// Vordefinierte Farbpaletten
const colorPalettes = [
	{ name: 'Grün Töne', colors: ['#91A599', '#849179', '#B6CDC7'] },
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

// Presets: arrays of three colors (same as Raute_1)
const presets = [
	['#A0B5A8', '#849179', '#B6CDC7'],
	['#F6D6AD', '#F28C66', '#C85A3A'],
	['#D6EAF8', '#8FBFE0', '#2A6F97'],
	['#FFE6F0', '#FF9EC3', '#FF5A9E'],
	['#FFF4D6', '#FFD27A', '#FF9B3B']
];

let selectedPreset = 0;

function selectPreset(i) {
	selectedPreset = i;
	colors = [...presets[i]];
}

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
	colors = ['#91A599', '#849179', '#B6CDC7'];
}

export function toggleGaps() {
	showGaps = !showGaps;
}

export function toggleMonoColor() {
	monoColor = !monoColor;
}

export function resetToDefaults() {
	gapSize = 0.0;
	triangleOpacity = 50;
	starSpacing = 0.8;
	rotation = 0;
	showGaps = true;
	monoColor = false;
	colors = ['#91A599', '#849179', '#B6CDC7'];
}

// Sternpositionen berechnen
$: moduleCenters = (() => {
	let stars = [];
	const baseRowSpacing = moduleHeight * 0.75;
	const baseDist = a * sqrt3 * 1.727;
	const centerOffsetY = -((rows - 1) / 2) * baseRowSpacing;
	
	for (let row = 0; row < rows; row++) {
		// Basis-Position bei actualDistance = 1.0
		const baseY = row * baseRowSpacing + centerOffsetY;
		const xShift = (row % 2 === 1) ? halfModuleWidth : 0;
		
		for (let col = -steps; col <= steps; col++) {
			const baseX = col * baseDist + xShift;
			
			// Skaliere Position vom Zentrum (0,0) aus
			stars.push({
				x: baseX * actualDistance,
				y: baseY * actualDistance
			});
		}
	}
	return stars;
})();

// Lücken-Rauten berechnen
$: gapCenters = (() => {
	let gaps = [];
	const baseRowSpacing = moduleHeight * 0.75;
	const baseDist = a * sqrt3 * 1.727;
	const centerOffsetY = -((rows - 1) / 2) * baseRowSpacing;
	const baseGapDistance = a * sqrt3 * (1.0 + gapSize);
	
	for (let row = 0; row < rows; row++) {
		const baseY = row * baseRowSpacing + centerOffsetY;
		const xShift = (row % 2 === 1) ? halfModuleWidth : 0;
		
		for (let col = -steps; col <= steps; col++) {
			const baseCenterX = col * baseDist + xShift;
			const baseCenterY = baseY;
			
			const angles = [30, 90, 150];
			const rotations = [0, 60, 120];
			
			for (let i = 0; i < 3; i++) {
				const rad = angles[i] * Math.PI / 180;
				const baseGapX = baseCenterX + baseGapDistance * Math.cos(rad);
				const baseGapY = baseCenterY + baseGapDistance * Math.sin(rad);
				
				// Skaliere Gap-Position vom Zentrum aus
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
			{#key colors}
			{#each moduleCenters as star}
				<g transform="translate({star.x} {star.y}) rotate({rotation}) scale({starScale})">
					{#each rhombi as rhombus, i}
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

			{#each gapCenters as gap}
				<g transform="translate({gap.x} {gap.y}) rotate({rotation + gap.rotation}) scale(1, {gapScale})">
					<polygon 
						points={pointsToStr([baseRhombus[0], baseRhombus[3], baseRhombus[2]])} 
						fill={gapColorMap[gap.rotation] || colors[1]} 
						stroke="#000" 
						stroke-width={strokeWidth} 
					/>
					<polygon 
						points={pointsToStr([baseRhombus[0], baseRhombus[1], baseRhombus[2]])} 
						fill={gapColorMap[gap.rotation] || colors[1]} 
						fill-opacity={triangleOpacity / 100} 
						stroke="#000" 
						stroke-width={strokeWidth} 
					/>
					<line 
						x1={baseRhombus[0][0]} 
						y1={baseRhombus[0][1]} 
						x2={baseRhombus[2][0]} 
						y2={baseRhombus[2][1]} 
						stroke="#000" 
						stroke-width={strokeWidth} 
					/>
				</g>
			{/each}
			{/key}
		</svg>
		</div>

	</div>

	<div class="sidebar-right">
		<Slider min={0} max={100} bind:value={triangleOpacity} label="Deckkraft 2. Dreieck" />
		<Slider min={0} max={4} step={0.1} bind:value={strokeWidth} label="Linienstärke" />
		<Slider min={0.06} max={5} step={0.01} bind:value={starSpacing} label="Abstand Sterne" />
		
		<Toggle bind:value={monoColor} label="Mono Color" />
		<hr />
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
		<label style="display:block; margin-bottom:6px; margin-top:8px; font-weight:600;">Lightness Range (%)</label>
		<RangeSlider min={0} max={100} step={1} bind:value1={minLight} bind:value2={maxLight} label="Range" />
		
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