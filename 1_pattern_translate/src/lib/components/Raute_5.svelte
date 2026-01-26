<script>
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
			// Erst verzerren (in lokaler X-Richtung der Raute)
			const distortedX = point[0] * distortionScale;
			const distortedY = point[1]; // Y bleibt gleich
			// Dann rotieren
			const rotated = rotatePoint(distortedX, distortedY, i * 60);
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
export let triangleOpacity = 50;
export let starSpacing = 1.0; // Default auf 1.0 für Raute 3
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
const defaultColors = ['#91A599', '#849179', '#B6CDC7'];
export let colors = ['#91A599', '#849179', '#B6CDC7'];

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
	colors = ['#91A599', '#849179', '#B6CDC7'];
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
		const palette = ['#91A599', '#849179', '#B6CDC7', '#F29E4C', '#C94C4C'];
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
							fill={triColors[getTriKey(star.row, star.col, i, 0)] || localTriColors[`${i}-0`] || defaultColorFor(i, 0)} 
							stroke="#000" 
							stroke-width="0" 
							on:click={() => selectTriangle(star.row, star.col, i, 0)}
						/>
						<polygon 
							points={pointsToStr([rhombus[0], rhombus[1], rhombus[2]])} 
							fill={triColors[getTriKey(star.row, star.col, i, 1)] || localTriColors[`${i}-1`] || defaultColorFor(i, 1)} 
							fill-opacity={triangleOpacity / 100} 
							stroke="#000" 
							stroke-width="0" 
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
						on:click={() => selectGapTriangle(gap.row, gap.col, gap.rotation, 0)}
						/>
						<polygon 
							points={pointsToStr([distortedGapRhombus[0], distortedGapRhombus[1], distortedGapRhombus[2]])} 
							fill={gapTriColors[getGapKey(gap.row, gap.col, gap.rotation, 1)] || localGapColors[`${gap.rotation}-1`] || ensureGapColor(gap.row, gap.col, gap.rotation, 1)} 
						fill-opacity={triangleOpacity / 100} 
						stroke="#000" 
						stroke-width="0" 
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
		</svg>
		</div>

	<!-- controls moved to parent sidebar -->
	</div>

	<style>
	.svg-container {
		width: 100%;
		height: 100%;
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