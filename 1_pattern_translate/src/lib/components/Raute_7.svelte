<script>
import Slider from '$lib/ui/Slider.svelte';
import Toggle from '$lib/ui/Toggle.svelte';
import { onMount } from 'svelte';
import RangeSlider from '$lib/ui/RangeSlider.svelte';
// Größe eines Quadrats (rotiert um 45°)
const size = 170;

// Export props
export let rows = 17;
export let cols = 17;
export let triangleOpacity = 100;
export let spacing = 1.0;
export let strokeWidth = 0;
export let showStrokes = true;
export let rotation = 0;
export let scale = 1.0;
export let rowShift = 0;

const rowShiftStorageKey = 'raute7-rowShift';

// Farben für die Dreiecke
let color1 = '#3b82f6'; // Blau
let color2 = '#ef4444';
let color3 = '#1f2937'; // Dunkelgrau/Schwarz

// Lightness remapping (same approach as other Raute components)
let minLight = 0; // percent
let maxLight = 100; // percent
const lightStorageKey = 'raute7-lightRange';

let hueShift = 0; // 0-360 degrees
const hueStorageKey = 'raute7-hueShift';

$: try {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(lightStorageKey, JSON.stringify({ minLight, maxLight }));
        localStorage.setItem(hueStorageKey, JSON.stringify(hueShift));
		localStorage.setItem(rowShiftStorageKey, JSON.stringify(rowShift));
    }
} catch (e) {}

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

					// load persisted row shift
					try {
						const raw = localStorage.getItem(rowShiftStorageKey);
						if (raw) {
							const val = JSON.parse(raw);
							if (typeof val === 'number') rowShift = val;
						}
					} catch (e) {}
function mapLightness(hex) {
	if (!hex) return hex;
	const rgb = hexToRgb(hex);
	const hsl = rgbToHsl(rgb);
	// preserve black/near-black colors (lightness < 5%)
	if (hsl.l < 5) return hex;
	const capFactor = 0.8;
	const effectiveMax = Math.max(minLight, Math.min(100, maxLight * capFactor));
	const mappedL = minLight + (hsl.l / 100) * (effectiveMax - minLight);
	const newRgb = hslToRgb({ h: hsl.h, s: hsl.s, l: mappedL });
	return rgbToHex(newRgb);
}

function applyHueShift(hex) {
	if (!hex || hueShift === 0) return hex;
	const rgb = hexToRgb(hex);
	const hsl = rgbToHsl(rgb);
	// preserve black/near-black and very desaturated colors
	if (hsl.l < 5 || hsl.s < 5) return hex;
	const shiftedH = (hsl.h + hueShift) % 360;
	// reduce saturation for pastel effect (multiply by 0.6 for softer colors)
	const pastelS = hsl.s * 0.6;
	const newRgb = hslToRgb({ h: shiftedH, s: pastelS, l: hsl.l });
	return rgbToHex(newRgb);
}

// vordefinierte Farb-Muster (erstes Muster = gewünschte Farbcodes)
const colorPatterns = [
	{ name: 'Standard', c1: '#3b82f6', c2: '#ef4444', c3: '#1f2937' },
	{ name: 'Kalt', c1: '#06b6d4', c2: '#7c3aed', c3: '#0f172a' },
	{ name: 'Warm', c1: '#f97316', c2: '#f59e0b', c3: '#422006' },
	{ name: 'Monochrom', c1: '#9ca3af', c2: '#4b5563', c3: '#0b1220' }
];

let patternIndex = 0; // aktives Muster

// wenn das Muster gewechselt wird, Farben übernehmen und lokale Overrides zurücksetzen
$: if (colorPatterns && colorPatterns[patternIndex]) {
	const p = colorPatterns[patternIndex];
	color1 = p.c1;
	color2 = p.c2;
	color3 = p.c3;
	// remove per-triangle overrides so the new pattern is visible everywhere
	localTriColors = {};
}

// lokale Farbzuordnung (per Dreieck) — erlaubt Sidebar-Farbänderung
let localTriColors = {};
let selected = null;
let selectedColor = '#ff0000';
let applyToAll = true;

// Force reactivity when lightness range or hue changes
$: lightnessKey = `${minLight}-${maxLight}-${hueShift}`;

// Funktion zum Erstellen eines geteilten Quadrats
function createSquare(cx, cy, size, type) {
	const top = [cx, cy - size / 2];
	const right = [cx + size / 2, cy];
	const bottom = [cx, cy + size / 2];
	const left = [cx - size / 2, cy];
	const center = [cx, cy];
	let triangles = [];
	if (type === 'top' || type === 'bottom') {
		// vertical split: left half and right half
		triangles = [
			[left, top, bottom],   // left triangle
			[right, top, bottom]   // right triangle
		];
	} else {
		// horizontal split: top half and bottom half
		triangles = [
			[top, left, right],    // top triangle
			[bottom, left, right]  // bottom triangle
		];
	}
	return triangles;
}

function pointsToStr(points) {
	return points.map(p => `${p[0]},${p[1]}`).join(' ');
}

// Erstelle das Muster
$: scaledSize = size * spacing;
$: blockWidth = scaledSize * 2;  // Ein 2x2 Block ist 2 Quadrate breit
$: blockHeight = scaledSize * 2; // und 2 Quadrate hoch

$: pattern = (() => {
	let blocks = [];
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			// alternate rows shift: even rows left, odd rows right
			const rowOffset = (row % 2 === 0) ? -rowShift : rowShift;
			const blockCx = col * blockWidth + rowOffset;
			const blockCy = row * blockHeight;
			const topSquare = createSquare(
				blockCx + blockWidth / 2,
				blockCy + scaledSize / 2,
				scaledSize,
				'top'
			);
			const leftSquare = createSquare(
				blockCx + scaledSize / 2,
				blockCy + blockHeight / 2,
				scaledSize,
				'left'
			);
			const rightSquare = createSquare(
				blockCx + blockWidth - scaledSize / 2,
				blockCy + blockHeight / 2,
				scaledSize,
				'right'
			);
			const bottomSquare = createSquare(
				blockCx + blockWidth / 2,
				blockCy + blockHeight - scaledSize / 2,
				scaledSize,
				'bottom'
			);
			blocks.push({
				row,
				col,
				squares: [
					{ type: 'top', triangles: topSquare },
					{ type: 'left', triangles: leftSquare },
					{ type: 'right', triangles: rightSquare },
					{ type: 'bottom', triangles: bottomSquare }
				]
			});
		}
	}
	return blocks;
})();

// Farbe für ein Dreieck bestimmen
function getTriangleColor(squareType, triangleIndex) {
	if (squareType === 'top') {
		return triangleIndex === 0 ? color1 : color2;
	} else if (squareType === 'bottom') {
		return triangleIndex === 0 ? color2 : color1;
	} else if (squareType === 'left') {
		return triangleIndex === 0 ? color1 : color2;
	} else { // right
		return triangleIndex === 0 ? color2 : color1;
	}
}

// Eckpunkte für Außenseite (schwarze Quadrate)
function getOuterSquare(cx, cy, size) {
	return [
		[cx, cy - size / 2],
		[cx + size / 2, cy],
		[cx, cy + size / 2],
		[cx - size / 2, cy]
	];
}

$: viewWidth = cols * blockWidth + 200;
$: viewHeight = rows * blockHeight + 200;

$: patternWidth = cols * blockWidth;
$: patternHeight = rows * blockHeight;
$: patternOffsetX = -patternWidth / 2 + blockWidth / 2;
$: patternOffsetY = -patternHeight / 2 + blockHeight / 2;

function getTriKey(row, col, type, idx) {
	return `${row}-${col}-${type}-${idx}`;
}

function selectTriangle(row, col, type, idx) {
	selected = { row, col, type, idx };
}

function applySelectedColor() {
	if (!selected) return;
	if (applyToAll) {
		// determine which global color to set (color1 or color2) based on square type and triangle index
		const { type, idx } = selected;
		// For 'top' and 'left': idx 0 -> color1, idx 1 -> color2
		// For 'bottom' and 'right': idx 0 -> color2, idx 1 -> color1
		let target = null;
		if (type === 'top' || type === 'left') {
			target = idx === 0 ? 'color1' : 'color2';
		} else {
			target = idx === 0 ? 'color2' : 'color1';
		}
		if (target === 'color1') color1 = selectedColor;
		else color2 = selectedColor;
		// apply override to every matching triangle across all blocks so change is immediately visible
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const key = getTriKey(r, c, type, idx);
				localTriColors[key] = selectedColor;
			}
		}
		localTriColors = { ...localTriColors };
	} else {
		const key = getTriKey(selected.row, selected.col, selected.type, selected.idx);
		localTriColors[key] = selectedColor;
		localTriColors = { ...localTriColors };
	}
}

// build the user-supplied pattern mapping (repeats same per-block mapping across grid)
function buildUserPatternMap() {
	const map = {};
	const patternVals = {
		bottom: ['#632c1d', '#000000'],
		left: ['#ffded8', '#c9593a'],
		right: ['#c9593a', '#ffdfd7'],
		top: ['#000000', '#632c1d']
	};
 
 	for (let r = 0; r < rows; r++) {
 		for (let c = 0; c < cols; c++) {
 			for (const t of Object.keys(patternVals)) {
 				patternVals[t].forEach((colVal, idx) => {
 					map[`${r}-${c}-${t}-${idx}`] = colVal;
 				});
 			}
 		}
 	}
 	return map;
}

// Build a repeated map from a sample mapping object that contains keys like "6-10-top-0"
function buildMapFromSample(sample) {
	const map = {};
	const keys = Object.keys(sample || {});
	if (keys.length === 0) return map;
	// find a sample block coordinate from the first full key
	const first = keys.find(k => /^\d+-\d+-/.test(k));
	if (!first) return map;
	const parts = first.split('-');
	if (parts.length < 4) return map;
	const sampleRow = parts[0];
	const sampleCol = parts[1];

	const types = ['top', 'left', 'right', 'bottom'];
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			for (const t of types) {
				for (let i = 0; i < 2; i++) {
					const sampleKey = `${sampleRow}-${sampleCol}-${t}-${i}`;
					const color = sample[sampleKey] ?? sample[`${t}-${i}`] ?? '#000000';
					map[`${r}-${c}-${t}-${i}`] = color;
				}
			}
		}
	}
	return map;
}

onMount(() => {
		if (typeof window !== 'undefined') {
			const storageKey = 'raute7-localTriColors';
			// try load persisted local map, otherwise apply default user pattern and persist it
			try {
				const stored = localStorage.getItem(storageKey);
				if (stored) {
					const parsed = JSON.parse(stored);
					// ensure we have entries for the current grid size by merging with a fresh default map
					const defaults = buildUserPatternMap();
					localTriColors = { ...defaults, ...parsed };
				} else {
					localTriColors = buildUserPatternMap();
					localStorage.setItem(storageKey, JSON.stringify(localTriColors));
				}

						// load persisted light range if present
						try {
							const lightRaw = localStorage.getItem(lightStorageKey);
							if (lightRaw) {
								const obj = JSON.parse(lightRaw);
								if (typeof obj.minLight === 'number') minLight = obj.minLight;
								if (typeof obj.maxLight === 'number') maxLight = obj.maxLight;
							}
						} catch (e) {}
					// load persisted hue shift
					try {
						const hueRaw = localStorage.getItem(hueStorageKey);
						if (hueRaw) {
							const val = JSON.parse(hueRaw);
							if (typeof val === 'number') hueShift = val;
						}
					} catch (e) {}			} catch (e) {
				console.warn('Raute7: failed to load/save persisted pattern', e);
			}

			window.dumpRaute7Triangles = () => {
				const map = {};
				for (const block of pattern) {
					for (const square of block.squares) {
						for (let idx = 0; idx < square.triangles.length; idx++) {
							const key = getTriKey(block.row, block.col, square.type, idx);
							const color = localTriColors[key] ?? mapLightness(getTriangleColor(square.type, idx));
							map[key] = color;
						}
					}
				}
				try {
					navigator.clipboard.writeText(JSON.stringify(map, null, 2));
					console.log('dumpRaute7Triangles: copied to clipboard');
				} catch (e) {
					console.log('dumpRaute7Triangles:', map);
				}
				window.lastRaute7Colors = { localTriColors: { ...localTriColors } };
				return map;
			};

			window.dumpRaute7Central = () => {
			const centerRow = Math.floor(rows / 2);
			const centerCol = Math.floor(cols / 2);
			const map = {};
			for (const block of pattern) {
				if (block.row === centerRow && block.col === centerCol) {
					for (const square of block.squares) {
						for (let idx = 0; idx < square.triangles.length; idx++) {
							const key = getTriKey(block.row, block.col, square.type, idx);
							const color = localTriColors[key] ?? mapLightness(getTriangleColor(square.type, idx));
							map[key] = color;
						}
					}
					break;
				}
			}
			try {
				navigator.clipboard.writeText(JSON.stringify(map, null, 2));
				console.log('dumpRaute7Central: copied to clipboard');
			} catch (e) {
				console.log('dumpRaute7Central:', map);
			}
			return map;
		};

			window.debugColorsRaute7 = () => {
			console.log('localTriColors', localTriColors);
			console.log('selected', selected);
			console.log('patternIndex', patternIndex);
			console.log('lastRaute7Colors (if any):', window.lastRaute7Colors);
		};

			// apply the user-supplied repeated block pattern across the whole grid
			window.applyRaute7UserPattern = () => {
				localTriColors = buildUserPatternMap();
				localTriColors = { ...localTriColors };
				try { localStorage.setItem(storageKey, JSON.stringify(localTriColors)); } catch (e) {}
				console.log('applyRaute7UserPattern: applied pattern to localTriColors and persisted');
				return localTriColors;
			};

			// apply a sample mapping object (keys like "6-10-top-0") across the whole grid
			window.applyRaute7FromSample = (sample) => {
				if (!sample || typeof sample !== 'object') {
					console.error('applyRaute7FromSample: pass an object mapping keys->color');
					return null;
				}
				localTriColors = buildMapFromSample(sample);
				localTriColors = { ...localTriColors };
				try { localStorage.setItem(storageKey, JSON.stringify(localTriColors)); } catch (e) {}
				console.log('applyRaute7FromSample: applied sample mapping across grid and persisted');
				return localTriColors;
			};

			// convenience: read JSON from clipboard and apply as sample
			window.applyRaute7FromClipboard = async () => {
				try {
					const text = await navigator.clipboard.readText();
					const obj = JSON.parse(text);
					return window.applyRaute7FromSample(obj);
				} catch (e) {
					console.error('applyRaute7FromClipboard: failed to read/parse clipboard', e);
					return null;
				}
			};

			// debug helpers: set/get/clear localTriColors (clearing also removes persisted value)
			window.setRaute7Key = (key, color) => {
				localTriColors[key] = color;
				localTriColors = { ...localTriColors };
				try { localStorage.setItem(storageKey, JSON.stringify(localTriColors)); } catch (e) {}
				console.log('setRaute7Key:', key, color);
				return localTriColors[key];
			};

			window.getRaute7Local = () => {
				return { ...localTriColors };
			};

			window.clearRaute7Local = () => {
				localTriColors = {};
				localTriColors = { ...localTriColors };
				try { localStorage.removeItem(storageKey); } catch (e) {}
				console.log('clearRaute7Local: cleared and removed persisted value');
			};
	}
});

</script>

<div class="container">
	<div class="svg-container">
		<svg id="raute7-svg" viewBox="-1200 -800 2400 1600" class="svg-canvas" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
			<g transform="scale({scale})">
				<g transform="translate({patternOffsetX} {patternOffsetY}) rotate({rotation})">
					{#each pattern as block}
						{#each block.squares as square}
							{#each square.triangles as tri, idx}
								{@const key = getTriKey(block.row, block.col, square.type, idx)}
							<polygon
								data-star-row={block.row}
								data-star-col={block.col}
								data-i={idx}
								data-t={square.type}
								points={pointsToStr(tri)}
							fill={lightnessKey && applyHueShift(mapLightness(localTriColors[key] ?? getTriangleColor(square.type, idx)))}
									opacity={triangleOpacity / 100}
									stroke={showStrokes ? '#000' : 'none'}
									stroke-width={strokeWidth}
						
								/>
							{/each}

								<!-- outer stroke so the diamond shape remains visible -->
								<polygon
									points={pointsToStr(
										getOuterSquare(
											block.col * blockWidth + ((block.row % 2 === 0) ? -rowShift : rowShift) + (square.type === 'left' ? scaledSize / 2 : (square.type === 'right' ? blockWidth - scaledSize / 2 : blockWidth / 2)),
											block.row * blockHeight + (square.type === 'top' ? scaledSize / 2 : (square.type === 'bottom' ? blockHeight - scaledSize / 2 : blockHeight / 2)),
											scaledSize
										)
									)}
									fill="none"
									stroke={showStrokes ? '#000' : 'none'}
									stroke-width={strokeWidth}
								/>
						{/each}

					{/each}
				</g>
			</g>
		</svg>
	</div>

	<div class="sidebar-right">
		<RangeSlider min={0} max={100} step={1} bind:value1={minLight} bind:value2={maxLight} label="Lightness" />
		<Slider min={0} max={360} step={1} bind:value={hueShift} label="Hue Shift" />
		<Slider min={-2826} max={2826} step={1} bind:value={rowShift} label="Reihenversatz" />
		<Slider min={0.45} max={3} step={0.05} bind:value={scale} label="Zoom" />
		
		{#if selected}
			<hr />
			<div class="label">Ausgewähltes Dreieck:</div>
			<input type="color" bind:value={selectedColor} on:input={() => applySelectedColor()} style="width: 100%; height: 40px; margin-bottom: 10px;" />
		{/if}
	</div>
</div>

<style>
.container {
	display: flex;
	flex-direction: row;
	gap: 0;
	padding: 0;
	max-width: 100%;
	height: calc(100vh - 40px);
}

.svg-container {
	flex: 1;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0px;
}

.svg-canvas {
	width: 100%;
	height: 100%;
	background: #000;
	border-radius: 8px;
}

.sidebar-right {
	display: flex;
	flex-direction: column;
	padding: 20px;
	gap: 12px;
	min-width: 320px;
	overflow-y: auto;
	background: #1a1a1a;
	border-left: 1px solid #333;
}

.label {
	color: #ccc;
	font-size: 0.9rem;
}

.palette-row {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.palette-preview {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}
.palette-name {
	color: #ddd;
	font-size: 0.9rem;
}
.swatches {
	display: flex;
	gap: 6px;
}
.swatch {
	width: 28px;
	height: 20px;
	border-radius: 4px;
	border: 1px solid rgba(0,0,0,0.4);
}
</style>
