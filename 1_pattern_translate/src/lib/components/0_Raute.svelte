<script>
import Slider from '$lib/ui/Slider.svelte';
import Toggle from '$lib/ui/Toggle.svelte';
import SliderH from '$lib/ui/ColorPicker/SliderH_HSV.svelte';
import { parse, converter } from 'culori';

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

// Slider Werte (props in runes mode)
let { rows = 15, steps = 12, gapSize = 0.0, triangleOpacity = 50, starSpacing = 1.0, rotation = 0, showGaps = true, monoColor = true, colors = ['#91A599', '#849179', '#B6CDC7'] } = $props();

// Wenn starSpacing < 1.0: Sterne werden kleiner, Abstand bleibt 1.0
// Wenn starSpacing >= 1.0: Sterne bleiben normal, Abstand wird größer
let actualDistance = $derived(Math.max(starSpacing, 1.0));
let starScale = $derived(Math.min(starSpacing, 1.0));
let gapScale = $derived(actualDistance); // Lücken-Rauten skalieren mit actualDistance
let d = $derived(baseDistance * actualDistance);
let verticalSpacing = $derived(rowSpacing * actualDistance);

// Farben
const defaultColors = ['#91A599', '#849179', '#B6CDC7'];

// HSV state for first color (used by the hue slider)
const toHSV = converter('okhsv');
const toRGB = converter('rgb');

function clamp01(v) {
	if (v == null || Number.isNaN(v)) return 0;
	return Math.max(0, Math.min(1, v));
}

let hsvForFirst = [0, 1, 1];
let updatingFromHsv = false;

$effect(() => {
	if (updatingFromHsv) return;
	const parsed = parse(colors[0]);
	if (parsed) {
		const ok = toHSV(parsed) || {};
		const newH = ok.h ?? 0;
		const newS = clamp01(ok.s ?? 1);
		const newV = clamp01(ok.v ?? 1);
		if (newH !== hsvForFirst[0] || newS !== hsvForFirst[1] || newV !== hsvForFirst[2]) {
			hsvForFirst = [newH, newS, newV];
			try { console.log('0_Raute: synced hsvForFirst from colors[0]', hsvForFirst, colors[0]); } catch (err) {}
		}
	}
});

$effect(() => {
	// sync hsvForFirst -> colors[0]
	const ok = { mode: 'okhsv', h: hsvForFirst[0], s: hsvForFirst[1], v: hsvForFirst[2] };
	const rgb = toRGB(ok) || {};
	function toHexFromRgb(rgbObj) {
		const r = Math.round(clamp01(rgbObj.r) * 255);
		const g = Math.round(clamp01(rgbObj.g) * 255);
		const b = Math.round(clamp01(rgbObj.b) * 255);
		function two(n) { return n.toString(16).padStart(2, '0'); }
		return ('#' + two(r) + two(g) + two(b)).toLowerCase();
	}
	const hex = toHexFromRgb(rgb);
	if (hex && hex.toLowerCase() !== (colors[0] || '').toLowerCase()) {
		updatingFromHsv = true;
		colors = [hex, colors[1] ?? defaultColors[1], colors[2] ?? defaultColors[2]];
		try { console.log('0_Raute: updated colors ->', colors, 'from hsv', hsvForFirst); } catch (err) {}
		updatingFromHsv = false;
	}
});

function updateColorsFromHsv(hsvArr) {
	const ok = { mode: 'okhsv', h: hsvArr[0], s: hsvArr[1], v: hsvArr[2] };
	const rgb = toRGB(ok) || {};
	function toHexFromRgb(rgbObj) {
		const r = Math.round(clamp01(rgbObj.r) * 255);
		const g = Math.round(clamp01(rgbObj.g) * 255);
		const b = Math.round(clamp01(rgbObj.b) * 255);
		function two(n) { return n.toString(16).padStart(2, '0'); }
		return ('#' + two(r) + two(g) + two(b)).toLowerCase();
	}
	const hex = toHexFromRgb(rgb);
	if (hex) {
		updatingFromHsv = true;
		colors = [hex, colors[1] ?? defaultColors[1], colors[2] ?? defaultColors[2]];
		try { console.log('0_Raute:updateColorsFromHsv set colors', colors); } catch (err) {}
		updatingFromHsv = false;
	}
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
	starSpacing = 1.0;
	rotation = 0;
	showGaps = true;
	monoColor = true;
	colors = ['#91A599', '#849179', '#B6CDC7'];
}

// Sternpositionen berechnen
let moduleCenters = $derived.by(() => {
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
});

// Lücken-Rauten berechnen
let gapCenters = $derived.by(() => {
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
});

// Welche Farbe für welche Raute
let colorMap = $derived(() => monoColor ? {
	0: colors[0],
	1: colors[0],
	2: colors[0],
	3: colors[0],
	4: colors[0],
	5: colors[0]
} : {
	0: colors[0],
	1: colors[1],
	2: colors[2],
	3: colors[0],
	4: colors[1],
	5: colors[2]
});

let gapColorMap = $derived(() => monoColor ? {
	0: colors[0],
	60: colors[0],
	120: colors[0]
} : {
	0: colors[0],
	60: colors[1],
	120: colors[2]
});

$effect(() => {
	try { console.log('0_Raute: colors', colors); } catch (err) {}
});

$effect(() => {
	try { console.log('0_Raute: colorMap', colorMap); } catch (err) {}
});
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
							fill={colorMap()[i]} 
							stroke="#000" 
							stroke-width="0" 
						/>
						<polygon 
							points={pointsToStr([rhombus[0], rhombus[1], rhombus[2]])} 
							fill={colorMap()[i]} 
							fill-opacity={triangleOpacity / 100} 
							stroke="#000" 
							stroke-width="0" 
						/>
						<line 
							x1={rhombus[0][0]} 
							y1={rhombus[0][1]} 
							x2={rhombus[2][0]} 
							y2={rhombus[2][1]} 
							stroke="#000" 
							stroke-width="0" 
						/>
					{/each}
				</g>
			{/each}


			{/key}
		</svg>
	</div>
</div>

<div class="sidebar-right">
	<Slider min={0} max={100} bind:value={triangleOpacity} label="Deckkraft 2. Dreieck" />
	<Slider min={0} max={360} bind:value={rotation} label="Rotation" />
	<!-- Hue slider for first color -->
	<div style="width: 310px;">
		<label style="display:block; font-size:0.9rem; margin-bottom:6px;">Hue: Farbe 1</label>
		<SliderH bind:hsvValues={hsvForFirst} width={310} onchangeColor={updateColorsFromHsv} />
	</div>
	<hr />
	
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
</style>