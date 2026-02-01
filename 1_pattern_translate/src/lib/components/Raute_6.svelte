<script>
import Slider from '$lib/ui/Slider.svelte';
import Toggle from '$lib/ui/Toggle.svelte';
import { onMount } from 'svelte';

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
export let strokeWidth = 0.2;
export let scale = 1.0;
export let rotation = 0;
export let showGaps = true;
export let monoColor = false;
export let radialDistortion = 0.0; // Verzerrung: 0=normal, >0=Sterne breiter, <0=Gaps breiter

// external color maps and selection (bound from parent)
export let triColors = {};
export let gapTriColors = {};
export let selected = null;
export let selectedColor = '#ff0000';

// per-local-triangle quick mapping to avoid updating every module instance
let localTriColors = {};
// local gap color defaults (per local gap position: rotation + triIndex)
let localGapColors = {};

// Farbmuster-Presets
export let colorPatternIndex = 0;
const colorPatterns = [
	{
		name: 'Pattern 1 - Imported',
		triColors: {},
		// localTriColors apply per-rhombus index (i) and triangle (t) across all modules
		localTriColors: {
			'0-0': '#ffdfd7', '0-1': '#ffdfd7',
			'1-0': '#ffdfd7', '1-1': '#ffdfd7',
			'2-0': '#ffdfd7', '2-1': '#ffdfd7',
			'3-0': '#ffdfd7', '3-1': '#ffdfd7',
			'4-0': '#c9593a', '4-1': '#c9593a',
			'5-0': '#c9593a', '5-1': '#ffdfd7'
		},
		// gaps: rotation-based mapping (rot - t)
		localGapColors: {
			'0-0': '#ffdfd7', '0-1': '#ffdfd7',
			'60-0': '#c9593a', '60-1': '#ffdfd7',
			'120-0': '#c9593a', '120-1': '#ffdfd7'
		}
	},
	{
		name: 'Pattern 2 - Pastel Terra',
		triColors: {},
		// localTriColors apply per-rhombus index (i) and triangle (t) across all modules
		localTriColors: {
			'0-0': '#ffded8', '0-1': '#ffe0d6',
			'1-0': '#ffdfd7', '1-1': '#ffdfd7',
			'2-0': '#ec977f', '2-1': '#ec977f',
			'3-0': '#ed9780', '3-1': '#ee9781',
			'4-0': '#c85a3a', '4-1': '#c9593a',
			'5-0': '#c9593a', '5-1': '#ffded8'
		},
		// gaps: rotation-based mapping (rot - t)
		localGapColors: {
			'0-0': '#ed9780', '0-1': '#eb977e',
			'60-0': '#c9593a', '60-1': '#c9593a',
			'120-0': '#c9593a', '120-1': '#ffded8'
		}
	},
	{
		name: 'Pattern 3 - Pastel Terra Variant',
		triColors: {},
		// localTriColors apply per-rhombus index (i) and triangle (t) across all modules
		localTriColors: {
			'0-0': '#ffded8', '0-1': '#ffded8',
			'1-0': '#fff2f0', '1-1': '#fff3f1',
			'2-0': '#ec977f', '2-1': '#eb977e',
			'3-0': '#ed9780', '3-1': '#ee9781',
			'4-0': '#8d402a', '4-1': '#723322',
			'5-0': '#632c1d', '5-1': '#ffded8'
		},
		// gaps: rotation-based mapping (rot - t)
		localGapColors: {
			'0-0': '#ed9780', '0-1': '#ec977f',
			'60-0': '#c9593a', '60-1': '#c9593a',
			'120-0': '#a84d34', '120-1': '#ffded8'
		}
	},
	{
		name: 'Pattern 3 - Imported from Raute4',
		triColors: {},
		// apply as local mappings so pattern affects all modules
		localTriColors: {
			'0-0': '#ffded8', '0-1': '#ffded8',
			'1-0': '#fff2f0', '1-1': '#fff3f1',
			'2-0': '#632c1d', '2-1': '#8d412a',
			'3-0': '#8d412a', '3-1': '#a94c34',
			'4-0': '#8d402a', '4-1': '#723322',
			'5-0': '#632c1d', '5-1': '#ffded8'
		},
		localGapColors: {
			'0-0': '#632c1d', '0-1': '#632c1d',
			'60-0': '#c9593a', '60-1': '#c9593a',
			'120-0': '#a84d34', '120-1': '#ffded8'
		}
	}
];

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
export let colors = ['#91A599', '#849179', '#B6CDC7'];

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

export function applyColorPattern(index) {
	if (index >= 0 && index < colorPatterns.length) {
		const pattern = colorPatterns[index];
		// If pattern requests import from Raute_4 and Raute_4 provided a snapshot, prefer that
		if (pattern._importFromRaute4 && typeof window !== 'undefined' && window.lastRaute4Colors) {
			const src = window.lastRaute4Colors;
			localTriColors = { ...(src.localTriColors || {}), ...(pattern.localTriColors || {}) };
			localGapColors = { ...(src.localGapColors || {}), ...(pattern.localGapColors || {}) };
			triColors = { ...(src.triColors || {}), ...(pattern.triColors || {}) };
			gapTriColors = { ...(src.gapTriColors || {}), ...(pattern.gapTriColors || {}) };
		} else {
			localTriColors = { ...(pattern.localTriColors || {}) };
			localGapColors = { ...(pattern.localGapColors || {}) };
			triColors = { ...(pattern.triColors || {}) };
			gapTriColors = { ...(pattern.gapTriColors || {}) };
		}
		// Remove any per-instance overrides that would trump localTriColors/localGapColors
		// triColors keys are like "r-c-i-t" -> last two parts are i and t
		// gapTriColors keys are like "gap-r-c-rot-t" -> parts[3]=rot, parts[4]=t
		try {
			const triLocalKeys = Object.keys(localTriColors || {});
			if (triLocalKeys.length > 0) {
				for (const k of Object.keys(triColors)) {
					const parts = k.split('-');
					if (parts.length >= 4) {
						const i = parts[parts.length - 2];
						const t = parts[parts.length - 1];
						if (localTriColors[`${i}-${t}`] !== undefined) {
							delete triColors[k];
						}
					}
				}
			}

			const gapLocalKeys = Object.keys(localGapColors || {});
			if (gapLocalKeys.length > 0) {
				for (const k of Object.keys(gapTriColors)) {
					const parts = k.split('-');
					if (parts.length >= 5 && parts[0] === 'gap') {
						const rot = parts[3];
						const t = parts[4];
						if (localGapColors[`${rot}-${t}`] !== undefined) {
							delete gapTriColors[k];
						}
					}
				}
			}
		} catch (e) {
			console.warn('applyColorPattern: cleaning instance keys failed', e);
		}
		// trigger reactivity for parent bindings / console watchers
		triColors = { ...triColors };
		gapTriColors = { ...gapTriColors };
	}
}

// Reactive: Wende das Farbmuster an, wenn der Index sich ändert
$: applyColorPattern(colorPatternIndex);

onMount(()=>{
	if (typeof window !== 'undefined') {
		window.applyRaute6Pattern0 = () => {
			colorPatternIndex = 0;
			applyColorPattern(0);
			console.log('Raute_6: applied color pattern 0');
		};
	}
});

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
				y: baseY * actualDistance,
				row,
				col
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
					rotation: rotations[i],
					row,
					col
				});
			}
		}
	}
	return gaps;
})();

	// helpers for keys and defaults
	function getTriKey(r, c, i, t) {
		return `${r}-${c}-${i}-${t}`;
	}

	function getGapKey(r, c, rot, t) {
		return `gap-${r}-${c}-${rot}-${t}`;
	}

	function ensureGapColor(r, c, rot, t) {
		const key = getGapKey(r, c, rot, t);
		if (!gapTriColors[key]) {
			const palette = { '0': '#e6e6e6', '60': '#d9d9d9', '120': '#cfcfcf' };
			gapTriColors[key] = palette[String(rot)] || '#e6e6e6';
		}
		return gapTriColors[key];
	}

	function defaultColorFor(rhombusIndex, triIndex) {
	const palette = ['#6B8A5F', '#2E5F3A', '#D8F0E2', '#F29E4C', '#C94C4C'];
		const idx = (rhombusIndex * 2 + triIndex) % palette.length;
		return palette[idx];
	}

	export function setColorForLocalTriangle(i, t, color) {
		const key = `${i}-${t}`;
		localTriColors[key] = color;
		localTriColors = { ...localTriColors };
	}

	export function setColorForLocalGap(rot, t, color) {
		const key = `${rot}-${t}`;
		localGapColors[key] = color;
		localGapColors = { ...localGapColors };
	}
	// Also propagate local gap change to per-instance gapTriColors so parent bindings/console see it
	export function setColorForLocalGapInstances(rot, t, color) {
		// set per-instance keys for every gap with matching rotation
		for (let g of gapCenters) {
			if (g.rotation === rot) {
				const instanceKey = getGapKey(g.row, g.col, rot, t);
				gapTriColors[instanceKey] = color;
			}
		}
		gapTriColors = { ...gapTriColors };
	}

	export function applySelectedColor() {
		if (!selected) return;
		if (selected.isGap) {
			// apply globally to all gaps at the same rotation+triangleIndex
			setColorForLocalGap(selected.rotation, selected.triIndex, selectedColor);
			// also write per-instance keys so parent-bindings and console helpers see them
			setColorForLocalGapInstances(selected.rotation, selected.triIndex, selectedColor);
		} else {
			setColorForLocalTriangle(selected.rhombusIndex, selected.triIndex, selectedColor);
		}
	}

	export function toggleGaps() {
		showGaps = !showGaps;
	}

	function selectTriangle(row, col, i, t) {
		const key = getTriKey(row, col, i, t);
		selected = { key, row, col, rhombusIndex: i, triIndex: t };
		selectedColor = triColors[key] || localTriColors[`${i}-${t}`] || defaultColorFor(i, t);
	}

	function selectGapTriangle(row, col, rot, t) {
		const key = getGapKey(row, col, rot, t);
		selected = { key, row, col, rotation: rot, triIndex: t, isGap: true };
		selectedColor = gapTriColors[key] || localGapColors[`${rot}-${t}`] || ensureGapColor(row, col, rot, t);
	}

// Welche Farbe für welche Raute
$: colorMap = monoColor ? {
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
};

$: gapColorMap = monoColor ? {
	0: colors[0],
	60: colors[0],
	120: colors[0]
} : {
	0: colors[0],
	60: colors[1],
	120: colors[2]
};

onMount(() => {
		window.debugColorsRaute5 = () => {
			const payload = {
				triColors: triColors,
				localTriColors: localTriColors,
				gapTriColors: gapTriColors,
				localGapColors: localGapColors
			};
			console.log('triColors:', payload.triColors);
			console.log('localTriColors:', payload.localTriColors);
			console.log('gapTriColors:', payload.gapTriColors);
			console.log('localGapColors:', payload.localGapColors);
			// make it easy to copy/export from the console
			window.lastRaute5Colors = payload;
			return payload;
		};
		// helper: enumerate triangles (sequential index + identifying keys) and copy mapping to clipboard
		window.dumpRaute5Triangles = () => {
			const svg = document.getElementById('raute6-svg');
			if (!svg) return console.warn('raute6-svg not found');
			const polys = Array.from(svg.querySelectorAll('polygon'));
			const out = polys.map((p, idx) => {
				const obj = { index: idx, fill: p.getAttribute('fill') };
				// star triangle keys
				if (p.hasAttribute('data-star-row')) {
					obj.type = 'star';
					obj.starRow = p.getAttribute('data-star-row');
					obj.starCol = p.getAttribute('data-star-col');
					obj.i = p.getAttribute('data-i');
					obj.t = p.getAttribute('data-t');
				} else if (p.hasAttribute('data-gap-row')) {
					obj.type = 'gap';
					obj.gapRow = p.getAttribute('data-gap-row');
					obj.gapCol = p.getAttribute('data-gap-col');
					obj.rotation = p.getAttribute('data-gap-rotation');
					obj.t = p.getAttribute('data-t');
				}
				return obj;
			});
				// try navigator.clipboard first, fallback to console copy helper
				const text = JSON.stringify(out, null, 2);
				if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
					navigator.clipboard.writeText(text).then(() => console.log('copied', out.length, 'triangles to clipboard'))
						.catch(() => { try { copy(text); console.log('copied (fallback)', out.length, 'triangles to clipboard'); } catch (e) { console.warn('could not copy to clipboard'); } });
				} else {
					try { copy(text); console.log('copied', out.length, 'triangles to clipboard'); } catch (e) { console.warn('could not copy to clipboard'); }
				}
				return out;
		};

			// helper: dump only the central module's 18 triangles (star + its 3 gaps => 12 + 6 = 18)
		window.dumpRaute6Central = () => {
			const svg = document.getElementById('raute6-svg');
			if (!svg) return console.warn('raute6-svg not found');
			// gather available star rows/cols
			const starPolys = Array.from(svg.querySelectorAll('polygon[data-star-row][data-star-col]'));
			if (starPolys.length === 0) return console.warn('no star polygons found');
			const rowsSet = new Set();
			const colsSet = new Set();
			starPolys.forEach(p => { rowsSet.add(Number(p.getAttribute('data-star-row'))); colsSet.add(Number(p.getAttribute('data-star-col'))); });
			const rowsArr = Array.from(rowsSet).sort((a,b)=>a-b);
			const colsArr = Array.from(colsSet).sort((a,b)=>a-b);
			const centerRow = rowsArr[Math.floor(rowsArr.length/2)];
			const centerCol = colsArr[Math.floor(colsArr.length/2)];

			// select star triangles for the central module
			let centralStars = Array.from(svg.querySelectorAll(`polygon[data-star-row="${centerRow}"][data-star-col="${centerCol}"]`))
				.map(p => ({
					fill: p.getAttribute('fill'),
					i: Number(p.getAttribute('data-i')),
					t: Number(p.getAttribute('data-t')),
					key: `star-${centerRow}-${centerCol}-${p.getAttribute('data-i')}-${p.getAttribute('data-t')}`
				}));
			centralStars.sort((a,b) => a.i - b.i || a.t - b.t);

			// select gap triangles belonging to central module
			let centralGaps = Array.from(svg.querySelectorAll(`polygon[data-gap-row="${centerRow}"][data-gap-col="${centerCol}"]`))
				.map(p => ({
					fill: p.getAttribute('fill'),
					rot: Number(p.getAttribute('data-gap-rotation')),
					t: Number(p.getAttribute('data-t')),
					key: `gap-${centerRow}-${centerCol}-${p.getAttribute('data-gap-rotation')}-${p.getAttribute('data-t')}`
				}));
			centralGaps.sort((a,b) => a.rot - b.rot || a.t - b.t);

			const combined = [];
			// first the 12 star triangles (i:0..5, t:0..1)
			for (let s of centralStars) combined.push(s);
			// then the 6 gap triangles (rot: 0,60,120 ; t:0..1)
			for (let g of centralGaps) combined.push(g);

			if (combined.length !== 18) console.warn('expected 18 triangles for central module, found', combined.length);

			const out = combined.map((item, idx) => ({ index: idx, key: item.key, fill: item.fill }));
			const text = JSON.stringify(out, null, 2);
			if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(text).then(() => console.log('copied', out.length, 'central triangles to clipboard'))
					.catch(() => { try { copy(text); console.log('copied (fallback)', out.length, 'central triangles to clipboard'); } catch (e) { console.warn('could not copy to clipboard'); } });
			} else {
				try { copy(text); console.log('copied', out.length, 'central triangles to clipboard'); } catch (e) { console.warn('could not copy to clipboard'); }
			}
			return out;
		};

		// Raute 6 debug exporter (mirror of Raute5 but separate namespace)
		window.debugColorsRaute6 = () => {
			const payload = {
				triColors: triColors,
				localTriColors: localTriColors,
				gapTriColors: gapTriColors,
				localGapColors: localGapColors
			};
			console.log('triColors (raute6):', payload.triColors);
			console.log('localTriColors (raute6):', payload.localTriColors);
			console.log('gapTriColors (raute6):', payload.gapTriColors);
			console.log('localGapColors (raute6):', payload.localGapColors);
			window.lastRaute6Colors = payload;
			return payload;
		};
});
</script>

<div class="svg-container">
	<!-- Mitte: SVG Pattern -->
	<div style="flex: 1; height: 100%; display: flex; align-items: center; justify-content: center;">
		<svg id="raute6-svg" viewBox="-900 -1000 1800 2000" class="svg-canvas" shape-rendering="crispEdges" style="max-width: 100%; max-height: 100%; aspect-ratio: 0.9;">
		<g transform="scale({scale})">
			{#key [colors, radialDistortion]}
			{#each moduleCenters as star}
				<g transform="translate({star.x} {star.y}) rotate({rotation}) scale({starScale})">
					{#each distortedStarRhombi as rhombus, i}
						<polygon 
							points={pointsToStr([rhombus[0], rhombus[3], rhombus[2]])} 
							fill={triColors[getTriKey(star.row, star.col, i, 0)] || localTriColors[`${i}-0`] || defaultColorFor(i, 0)} 
							stroke="#000" 
							stroke-width="0" 
							data-star-row={star.row}
							data-star-col={star.col}
							data-i={i}
							data-t={0}
							on:click={() => selectTriangle(star.row, star.col, i, 0)}
						/>
						<polygon 
							points={pointsToStr([rhombus[0], rhombus[1], rhombus[2]])} 
							fill={triColors[getTriKey(star.row, star.col, i, 1)] || localTriColors[`${i}-1`] || defaultColorFor(i, 1)} 
							fill-opacity={triangleOpacity / 100} 
							stroke="#000" 
							stroke-width="0" 
							data-star-row={star.row}
							data-star-col={star.col}
							data-i={i}
							data-t={1}
							on:click={() => selectTriangle(star.row, star.col, i, 1)}
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

			{#if showGaps}
			{#each gapCenters as gap}
				<g transform="translate({gap.x} {gap.y}) rotate({rotation + gap.rotation})">
					<polygon 
							points={pointsToStr([distortedGapRhombus[0], distortedGapRhombus[3], distortedGapRhombus[2]])} 
							fill={gapTriColors[getGapKey(gap.row, gap.col, gap.rotation, 0)] || localGapColors[`${gap.rotation}-0`] || ensureGapColor(gap.row, gap.col, gap.rotation, 0)} 
						stroke="#000" 
						stroke-width="0" 
						data-gap-row={gap.row}
						data-gap-col={gap.col}
						data-gap-rotation={gap.rotation}
						data-t={0}
						on:click={() => selectGapTriangle(gap.row, gap.col, gap.rotation, 0)}
						/>
						<polygon 
							points={pointsToStr([distortedGapRhombus[0], distortedGapRhombus[1], distortedGapRhombus[2]])} 
							fill={gapTriColors[getGapKey(gap.row, gap.col, gap.rotation, 1)] || localGapColors[`${gap.rotation}-1`] || ensureGapColor(gap.row, gap.col, gap.rotation, 1)} 
						fill-opacity={triangleOpacity / 100} 
						stroke="#000" 
						stroke-width="0" 
						data-gap-row={gap.row}
						data-gap-col={gap.col}
						data-gap-rotation={gap.rotation}
						data-t={1}
						on:click={() => selectGapTriangle(gap.row, gap.col, gap.rotation, 1)}
						/>
					<line 
						x1={distortedGapRhombus[0][0]} 
						y1={distortedGapRhombus[0][1]} 
						x2={distortedGapRhombus[2][0]} 
						y2={distortedGapRhombus[2][1]} 
						stroke="#000" 
						stroke-width="0" 
					/>
				</g>
			{/each}
			{/if}
				{/key}
			</g>
			</svg>
		</div>

	</div>

	<div class="sidebar-right">
		<Slider min={0} max={colorPatterns.length - 1} step={1} bind:value={colorPatternIndex} label="Farbmuster" />
		
			<Slider min={-6.7} max={0} step={0.01} bind:value={radialDistortion} label="Radial Distortion" />
		
		<Slider min={0.45} max={3} step={0.05} bind:value={scale} label="Zoom" />
		
		{#if selected}
			<hr />
			<div class="label">Ausgewähltes Dreieck:</div>
			<input type="color" bind:value={selectedColor} on:change={() => applySelectedColor()} style="width: 100%; height: 40px; margin-bottom: 10px;" />
		{:else}
			<hr />
			<div class="label" style="color: #999; text-align: center;">Klicke ein Dreieck im SVG</div>
		{/if}
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
</style>