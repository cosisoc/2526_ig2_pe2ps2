<script>

// ============================================
// GRUNDEINSTELLUNGEN
// ============================================

const a = 120;  // Seitenlänge einer Raute

const sqrt3 = Math.sqrt(3);

// ============================================

// RAUTEN-GEOMETRIE

// ============================================

// Eine Raute mit 4 Ecken (obere Spitze bei 0,0)

const baseRhombus = [

[0, 0],                      // oben

[a / 2, -a * sqrt3 / 2],     // rechts

[0, -a * sqrt3],             // unten

[-a / 2, -a * sqrt3 / 2]     // links

];

// Hilfsfunktion: Punkt um Winkel drehen

function rotatePoint([x, y], degrees) {

const rad = degrees * Math.PI / 180;

const cos = Math.cos(rad);

const sin = Math.sin(rad);

return [

x * cos - y * sin,

x * sin + y * cos

];

}

// 6 Rauten für einen Stern (jeweils um 60° gedreht)

const rhombi = Array.from({ length: 6 }, (_, i) =>

baseRhombus.map(p => rotatePoint(p, i * 60))

);

// Hilfsfunktion: Array von Punkten -> SVG-String

function pointsToStr(points) {

return points.map(p => `${p[0]},${p[1]}`).join(' ');

}

// ============================================

// ABSTANDSBERECHNUNG

// ============================================

// Höhe und Breite eines Sterns berechnen

const allYs = rhombi.flatMap(r => r.map(p => p[1]));

const moduleHeight = Math.max(...allYs) - Math.min(...allYs);

const allXs = rhombi.flatMap(r => r.map(p => p[0]));

const halfModuleWidth = (Math.max(...allXs) - Math.min(...allXs)) / 2;

// Horizontaler Abstand zwischen Sternen

const d = a * sqrt3 * 1.727;

// Vertikaler Abstand zwischen Reihen

const rowSpacing = moduleHeight * 0.75;

// ============================================

// STEUERBARE WERTE (mit Slidern)

// ============================================

let rows = 8;      // Anzahl Reihen (vertikal)

let steps = 7;     // Anzahl Sterne links/rechts von Mitte (5 ergibt 11 Spalten)

// ============================================

// POSITIONEN BERECHNEN

// ============================================

function generateGridCenters(numRows, numSteps) {

const centers = [];

// Vertikale Zentrierung: Mitte der Reihen = Bildschirm-Mitte

const centerOffsetY = -((numRows - 1) / 2) * rowSpacing;

for (let row = 0; row < numRows; row++) {

// Y-Position dieser Reihe

const y = row * rowSpacing + centerOffsetY;

// Jede 2. Reihe horizontal versetzt (für Hex-Muster)

const xShift = (row % 2 === 1) ? halfModuleWidth : 0;

// Alle Sterne in dieser Reihe (von links nach rechts)

for (let col = -numSteps; col <= numSteps; col++) {

centers.push({

x: col * d + xShift,

y: y,

row: row,

col: col

});

}

}

return centers;

}

// Automatische Neuberechnung bei Slider-Änderung

$: moduleCenters = generateGridCenters(rows, steps);

// ============================================
// LÜCKEN-RAUTEN ZWISCHEN DEN STERNEN
// ============================================

function generateGapCenters(numRows, numSteps) {
	const gaps = [];
	const centerOffsetY = -((numRows - 1) / 2) * rowSpacing;
	
	const gapDistance = a * sqrt3;
	
	const gapConfigs = [
		{ angle: 30, rotation: 0 },    
		{ angle: 90, rotation: 60 },   
		{ angle: 150, rotation: 120 }, 
		{ angle: 210, rotation: 180 }, 
		{ angle: 270, rotation: 240 },
		{ angle: 330, rotation: 300 }
	];

	for (let row = 0; row < numRows; row++) {
		const y = row * rowSpacing + centerOffsetY;
		const xShift = (row % 2 === 1) ? halfModuleWidth : 0;

		for (let col = -numSteps; col <= numSteps; col++) {
			const centerX = col * d + xShift;
			const centerY = y;
			
			const selectedIndices = [0, 2, 4];
			
			for (const idx of selectedIndices) {
				const config = gapConfigs[idx];
				const rad = config.angle * Math.PI / 180;
				const gapX = centerX + gapDistance * Math.cos(rad);
				const gapY = centerY + gapDistance * Math.sin(rad);
				
				gaps.push({ 
					x: gapX, 
					y: gapY, 
					rotation: config.rotation,
					row: row,
					col: col,
					gapIndex: idx
				});
			}
		}
	}

	return gaps;
}

$: gapCenters = generateGapCenters(rows, steps);

// ============================================
// FARBFUNKTIONEN
// ============================================

// Stern-Rauten: Feste Farben nach Index
function getColor(index) {
	if(index == 0 || index == 3) return '#91A599';  // Grün
	else if(index == 1 || index == 4) return '#849179';  // Dunkelgrün
	else if(index == 2 || index == 5) return '#B6CDC7'  // Hellgrün
}

// Lücken-Rauten: Farbe abhängig von Rotation
function getGapColor(gap) {
	// Rotation 0° (bei angle 30°) -> immer Grün
	if (gap.rotation === 0) {
		return '#91A599'; // Grün
	}
	
	// Rotation 60° (bei angle 90°) -> immer Dunkelgrün
	if (gap.rotation === 60) {
		return '#849179'; // Dunkelgrün
	}
	
	// Rotation 120° (bei angle 150°) -> immer Hellgrün
	if (gap.rotation === 120) {
		return '#B6CDC7'; // Hellgrün
	}
	
	// Fallback für andere Rotationen 
	return '#849179';
}

</script>

<div class="svg-container">

<svg viewBox="-900 -1000 1800 2000" class="svg-canvas" shape-rendering="crispEdges">

{#each moduleCenters as c}
<g transform={`translate(${c.x} ${c.y})`}>
{#each rhombi as r, i}
	<!-- left triangle: top, left, bottom -->
	<polygon points={pointsToStr([r[0], r[3], r[2]])} fill={getColor(i)} stroke="#000" stroke-width="0" />
	<!-- right triangle: top, right, bottom -->
	<polygon points={pointsToStr([r[0], r[1], r[2]])} fill={getColor(i)} stroke="#000" stroke-width="0" />
	<!-- center dividing line from top to bottom -->
	<line x1={r[0][0]} y1={r[0][1]} x2={r[2][0]} y2={r[2][1]} stroke="#000" stroke-width="0" />
{/each}
</g>
{/each}

<!-- Rauten in den Lücken zwischen Sternen -->
{#each gapCenters as gap}
	<g transform={`translate(${gap.x} ${gap.y}) rotate(${gap.rotation})`}>
		<polygon points={pointsToStr([baseRhombus[0], baseRhombus[3], baseRhombus[2]])} fill={getGapColor(gap)} stroke="#000" stroke-width="0" />
		<polygon points={pointsToStr([baseRhombus[0], baseRhombus[1], baseRhombus[2]])} fill={getGapColor(gap)} stroke="#000" stroke-width="0" />
		<line x1={baseRhombus[0][0]} y1={baseRhombus[0][1]} x2={baseRhombus[2][0]} y2={baseRhombus[2][1]} stroke="#000" stroke-width="0" />
	</g>
{/each}

</svg>

</div>

<style>

.svg-container { width:100vw; height:100vh; display:flex; align-items:flex-start; justify-content:center; background:white; }

.svg-canvas { width:100%; height:100%; }

</style>