<script>
import Slider from '$lib/ui/Slider.svelte';
import Toggle from '$lib/ui/Toggle.svelte';
import EditableColorPalette from '$lib/ui/EditableColorPalette.svelte';
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

// Slider Werte (exported so parent can control from main sidebar)
export let rows = 15;
export let steps = 12;
export let gapSize = 0.0;
export let triangleOpacity = 100;
export let starSpacing = 1.0;
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
const defaultColors = ['#6B8A5F', '#2E5F3A', '#D8F0E2'];
export let colors = ['#6B8A5F', '#2E5F3A', '#D8F0E2'];

// Presets: arrays of three colors
const presets = [
	['#5C7A58', '#6B8A5F', '#D8F0E2'], // green tones with increased contrast
	['#F6D6AD', '#F28C66', '#C85A3A'],
	['#D6EAF8', '#8FBFE0', '#2A6F97'],
	['#FFE6F0', '#FF9EC3', '#FF5A9E']
];

let selectedPreset = 0; // keep green preset selected by default

// Lightness range and brightness adjustment
let minLight = 0; // percent
let maxLight = 100; // percent

function selectPreset(i) {
	selectedPreset = i;
	colors = [...presets[i]];
}

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

// Vordefinierte Farbmuster (welche Raute bekommt welche Farbe)
const colorPatterns = [
	[0, 1, 2, 0, 1, 2],  // Pattern 0: Standard alternierend
	[0, 0, 1, 1, 2, 2],  // Pattern 1: Paarweise
	[0, 2, 1, 0, 2, 1],  // Pattern 2: 0-2-1 Rotation
	[1, 0, 2, 1, 0, 2],  // Pattern 3: 1-0-2 Rotation
	[2, 1, 0, 2, 1, 0],  // Pattern 4: 2-1-0 Rotation
	[0, 1, 0, 2, 1, 2],  // Pattern 5: Gemischt 1
	[1, 2, 0, 1, 2, 0],  // Pattern 6: Gemischt 2
	[2, 0, 1, 2, 0, 1],  // Pattern 7: Gemischt 3
	[0, 2, 0, 1, 2, 1],  // Pattern 8: Gemischt 4
	[1, 0, 1, 2, 0, 2],  // Pattern 9: Gemischt 5
	[2, 1, 2, 0, 1, 0],  // Pattern 10: Gemischt 6
];

// Aktuelles Muster
export let patternIndex = 0;
$: colorMapping = colorPatterns[patternIndex];

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
	patternIndex = 0;
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
	0: displayColors[colorMapping[0]],
	1: displayColors[colorMapping[1]],
	2: displayColors[colorMapping[2]],
	3: displayColors[colorMapping[3]],
	4: displayColors[colorMapping[4]],
	5: displayColors[colorMapping[5]]
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

// Special variation (patternIndex === 1): create central orange/yellow cluster
function chooseOuterColor(star, i) {
	if (patternIndex !== 1) return displayColors[colorMapping[i]];
	// normalized module coordinates
	const nx = star.x / (baseDistance * actualDistance);
	const ny = star.y / (rowSpacing * actualDistance);
	const ax = Math.abs(nx);
	const ay = Math.abs(ny);
	// central region (approximately 1 module radius)
	if (ax <= 1 && ay <= 1) return '#F23A00'; // strong orange/red
	// adjacent region
	if (ax <= 2 && ay <= 1) return '#F58220'; // orange
	return displayColors[colorMapping[i]];
}

function chooseInnerColor(star, i) {
	if (patternIndex !== 1) return displayColors[colorMapping[i]];
	// inner (small wedge) should be bright yellow for special pattern
	const nx = star.x / (baseDistance * actualDistance);
	const ny = star.y / (rowSpacing * actualDistance);
	const ax = Math.abs(nx);
	const ay = Math.abs(ny);
	if (ax <= 2 && ay <= 1) return '#FFD400';
	return displayColors[colorMapping[i]];
}
</script>

<div class="svg-container">
	<!-- Mitte: SVG Pattern -->
	<div style="flex: 1; height: 100%; display: flex; align-items: center; justify-content: center;">
		<svg viewBox="-900 -1000 1800 2000" class="svg-canvas" shape-rendering="crispEdges" style="max-width: 100%; max-height: 100%; aspect-ratio: 0.9;">
			{#key [colors, colorMapping]}
			{#each moduleCenters as star}
				<g transform="translate({star.x} {star.y}) rotate({rotation}) scale({starScale})">
					{#each rhombi as rhombus, i}
						<polygon 
							points={pointsToStr([rhombus[0], rhombus[3], rhombus[2]])} 
							fill={patternIndex === 1 ? chooseOuterColor(star, i) : colorMap[i]} 
							stroke="#000" 
							stroke-width={strokeWidth} 
						/>
						<polygon 
							points={pointsToStr([rhombus[0], rhombus[1], rhombus[2]])} 
							fill={patternIndex === 1 ? chooseInnerColor(star, i) : colorMap[i]} 
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
			{/if}
			{/key}
		</svg>
		</div>

	</div>

	<div class="sidebar-right">
  <Slider min={0} max={100} bind:value={triangleOpacity} label="Deckkraft" />
		<Toggle bind:value={showGaps} label="Lücken anzeigen" />
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