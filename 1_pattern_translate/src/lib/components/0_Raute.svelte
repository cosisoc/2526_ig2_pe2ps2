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

// Slider Werte
export let rows = 15;
export let steps = 12;
export let gapSize = 0.0;
export let triangleOpacity = 50;
export let starSpacing = 1.0;
export let rotation = 0;
export let showGaps = true;
export let monoColor = true;

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
			{#key colors}
			{#each moduleCenters as star}
				<g transform="translate({star.x} {star.y}) rotate({rotation}) scale({starScale})">
					{#each rhombi as rhombus, i}
						<polygon 
							points={pointsToStr([rhombus[0], rhombus[3], rhombus[2]])} 
							fill={colorMap[i]} 
							stroke="#000" 
							stroke-width="0" 
						/>
						<polygon 
							points={pointsToStr([rhombus[0], rhombus[1], rhombus[2]])} 
							fill={colorMap[i]} 
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
</style>