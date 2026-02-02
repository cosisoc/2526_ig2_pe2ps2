<script>
import Slider from '$lib/ui/Slider.svelte';
import Toggle from '$lib/ui/Toggle.svelte';
import { onMount } from 'svelte';

// Export props so parent can control them
export let rows = 15;
export let steps = 12;
export let triangleOpacity = 50;
export let starSpacing = 0.8;
export let strokeWidth = 0.2;
export let showGaps = true;
// gaps are always shown
export let scale = 1.0;
export let radialDistortion = 0.0;
export let triColors = {};
export let gapTriColors = {};
export let selected = null;
export let selectedColor = '#ff0000';

// per-local-triangle quick mapping to avoid updating every module instance
let localTriColors = {};
// per-local-gap mapping so gap colors can be applied globally by (rotation, triIndex)
let localGapColors = {};

// Basis-Raute (kann durch Ziehen verändert werden)
let a = 120;
const sqrt3 = Math.sqrt(3);

// Startpunkte (relative zum Ursprung)
// base rhombus (4 corners)
let baseRhombus = [
  [0, 0],
  [a / 2, -a * sqrt3 / 2],
  [0, -a * sqrt3],
  [-a / 2, -a * sqrt3 / 2]
];

function rotatePoint(x, y, degrees) {
  const rad = degrees * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

function pointsToStr(points) {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

function buildRhombiFromBase(base) {
  let rh = [];
  for (let i = 0; i < 6; i++) {
    let rotated = [];
    for (let j = 0; j < base.length; j++) {
      const p = base[j];
      const r = rotatePoint(p[0], p[1], i * 60);
      rotated.push([r.x, r.y]);
    }
    rh.push(rotated);
  }
  return rh;
}

const rhombi = buildRhombiFromBase(baseRhombus);

// Distortion helpers (similar to Raute_3/5)
$: starDistortionScale = 1.0 + radialDistortion * 0.3;
$: gapDistortionScale = 1.0 - radialDistortion * 0.3;

function buildDistortedRhombi(distortionScale) {
  let distorted = [];
  for (let i = 0; i < 6; i++) {
    let rotatedRhombus = [];
    for (let j = 0; j < baseRhombus.length; j++) {
      const point = baseRhombus[j];
      const distortedX = point[0] * distortionScale;
      const distortedY = point[1];
      const rotated = rotatePoint(distortedX, distortedY, i * 60);
      rotatedRhombus.push([rotated.x, rotated.y]);
    }
    distorted.push(rotatedRhombus);
  }
  return distorted;
}

$: distortedStarRhombi = buildDistortedRhombi(starDistortionScale);
$: distortedGapRhombus = baseRhombus.map(p => [p[0] * gapDistortionScale, p[1]]);

$: triPointsStr0 = `${distortedGapRhombus[0][0]},${distortedGapRhombus[0][1]} ${distortedGapRhombus[3][0]},${distortedGapRhombus[3][1]} ${distortedGapRhombus[2][0]},${distortedGapRhombus[2][1]}`;
$: triPointsStr1 = `${distortedGapRhombus[0][0]},${distortedGapRhombus[0][1]} ${distortedGapRhombus[1][0]},${distortedGapRhombus[1][1]} ${distortedGapRhombus[2][0]},${distortedGapRhombus[2][1]}`;

// Pattern settings
let gapSize = 0.0;
let rotation = 0;
let starScale = 1.0;

function getGapKey(r, c, rot, t) {
  return `gap-${r}-${c}-${rot}-${t}`;
}

function ensureGapColor(r, c, rot, t) {
  const key = getGapKey(r, c, rot, t);
  // prefer a per-local mapping for this gap rotation/triangle (global change)
  const localKey = `${rot}-${t}`;
  if (localGapColors[localKey]) return localGapColors[localKey];
  // fallback palette per rotation (do NOT write back into gapTriColors here)
  const palette = { '0': '#e6e6e6', '60': '#d9d9d9', '120': '#cfcfcf' };
  return palette[String(rot)] || '#e6e6e6';
}

function defaultColorFor(rhombusIndex, triIndex) {
  const palette = ['#91A599', '#849179', '#B6CDC7', '#F29E4C', '#C94C4C'];
  const idx = (rhombusIndex * 2 + triIndex) % palette.length;
  return palette[idx];
}

function getTriKey(r, c, i, t) {
  return `${r}-${c}-${i}-${t}`;
}

function ensureTriColor(r, c, i, t) {
  const key = getTriKey(r, c, i, t);
  if (!triColors[key] && !localTriColors[`${i}-${t}`]) triColors[key] = defaultColorFor(i, t);
  return triColors[key] || localTriColors[`${i}-${t}`];
}

function selectTriangle(r, c, i, t) {
  const key = getTriKey(r, c, i, t);
  selected = { key, row: r, col: c, rhombusIndex: i, triIndex: t };
  selectedColor = triColors[key] || localTriColors[`${i}-${t}`] || defaultColorFor(i, t);
}

function selectGapTriangle(r, c, rot, t) {
  const key = getGapKey(r, c, rot, t);
  selected = { key, row: r, col: c, rotation: rot, triIndex: t, isGap: true };
  selectedColor = gapTriColors[key] || localGapColors[`${rot}-${t}`] || ensureGapColor(r, c, rot, t);
}

// shape editor removed

// Compute centers for grid
function computeModuleGeometry() {
  // Balance between showing enough content and performance
  const effectiveRows = Math.min(Math.ceil(rows * 1.5), 40); // max 40 rows (erhöht von 25)
  const effectiveSteps = Math.min(Math.ceil(steps * 1.5), 35); // max 35 steps (erhöht von 20)
  
  // compute moduleHeight and halfModuleWidth from current rhombi
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
  const baseRowSpacing = moduleHeight * 0.75;

  // module centers (rows x columns where cols = -steps..steps)
  let centers = [];
  const centerOffsetY = -((effectiveRows - 1) / 2) * baseRowSpacing;
  for (let row = 0; row < effectiveRows; row++) {
    const baseY = row * baseRowSpacing + centerOffsetY;
    const xShift = (row % 2 === 1) ? halfModuleWidth : 0;
    for (let col = -effectiveSteps; col <= effectiveSteps; col++) {
      centers.push({ row, col, x: col * baseDistance + xShift, y: baseY });
    }
  }
  return { centers, moduleHeight, halfModuleWidth, baseDistance, baseRowSpacing, effectiveRows, effectiveSteps };
}

// Reactive: only recompute when needed
$: moduleGeom = computeModuleGeometry();
$: actualSpacing = Math.max(starSpacing, 1.0);
$: moduleCenters = moduleGeom.centers.map(c => ({ ...c, x: c.x * actualSpacing, y: c.y * actualSpacing }));

// gap centers - compute only limited number
let gapCenters = [];

function computeLimitedGapCenters(centers) {
  const baseGapDistance = a * sqrt3;
  const angles = [30, 90, 150]; // degrees  
  const rotations = [0, 60, 120];
  const allGaps = [];

  // Erhöhtes Limit um alle Gaps zu zeigen
  const maxCenters = Math.min(centers.length, 800);
  
  for (let i = 0; i < maxCenters; i++) {
    const c = centers[i];
    for (let j = 0; j < 3; j++) {
      const rad = angles[j] * Math.PI / 180;
      const gapX = c.x + baseGapDistance * Math.cos(rad);
      const gapY = c.y + baseGapDistance * Math.sin(rad);
      allGaps.push({ row: c.row, col: c.col, x: gapX, y: gapY, rotation: rotations[j] });
    }
  }
  
  return allGaps;
}

// Compute gaps only when moduleCenters change
$: gapCenters = computeLimitedGapCenters(moduleCenters);

// Pre-calculate rhombus triangle points to avoid recalculation
const triPoints0 = [ {x: baseRhombus[0][0], y: baseRhombus[0][1]}, {x: baseRhombus[3][0], y: baseRhombus[3][1]}, {x: baseRhombus[2][0], y: baseRhombus[2][1]} ];
const triPoints1 = [ {x: baseRhombus[0][0], y: baseRhombus[0][1]}, {x: baseRhombus[1][0], y: baseRhombus[1][1]}, {x: baseRhombus[2][0], y: baseRhombus[2][1]} ];
let triPointsStr0 = pointsToStr(triPoints0);
let triPointsStr1 = pointsToStr(triPoints1);

// build rhombus at position (simplified)
function getRhombusPoints(cx, cy, rotDeg) {
  const pts = [];
  for (let p of baseRhombus) {
    const r = rotatePoint(p[0] * starScale, p[1] * starScale, rotDeg);
    pts.push({ x: r.x + cx, y: r.y + cy });
  }
  return pts;
}

onMount(() => {
  // Colors are generated on-demand via defaultColorFor fallback
  // Debug-Funktion global verfügbar machen (returns a snapshot)
  window.debugColors = () => {
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
    window.lastRaute4Colors = payload;
    return payload;
  };
});

// Export these functions so parent can call them
export function randomizeColors() {
  // iterate over module grid (rows x -steps..steps)
  for (let r = 0; r < rows; r++) {
    for (let c = -steps; c <= steps; c++) {
      for (let i = 0; i < 6; i++) {
        for (let t = 0; t < 2; t++) {
          triColors[getTriKey(r, c, i, t)] = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        }
      }
    }
  }
  triColors = {...triColors};
}

export function resetColors() {
  triColors = {};
}

export function applySelectedColor() {
  if (!selected) return;
  if (selected.isGap) {
    // Apply color globally for this gap rotation and triangle index
    setColorForLocalGap(selected.rotation, selected.triIndex, selectedColor);
    // remove any per-gap override for the currently selected gap so the global color shows
    if (gapTriColors[selected.key]) {
      delete gapTriColors[selected.key];
      gapTriColors = { ...gapTriColors };
    }
  } else {
    // Apply the color globally to the local triangle position (all modules)
    setColorForLocalTriangle(selected.rhombusIndex, selected.triIndex, selectedColor);
  }
}

// Apply a color to a specific local triangle position within the base rhombus
// i: rhombus index (0..5), t: triangle index within rhombus (0 or 1)
// This will set the color for every triangle with the same (i,t) across the grid
export function setColorForLocalTriangle(i, t, color) {
  // set per-local mapping and trigger reactive update — cheap and fast
  const key = `${i}-${t}`;
  localTriColors[key] = color;
  localTriColors = { ...localTriColors };
}

// Apply a color to a specific local gap position (rotation, triangle index)
// rot: rotation (0,60,120), t: triangle index (0 or 1)
// This will set the color for every gap with the same rotation and triangle index across the grid
export function setColorForLocalGap(rot, t, color) {
  const key = `${rot}-${t}`;
  localGapColors[key] = color;
  localGapColors = { ...localGapColors };
}

// Gap functions removed - gaps are always shown
</script>

<div class="svg-container-raute4">
  <svg viewBox="-1200 -800 2400 1600" class="svg-canvas" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <g transform="scale({scale})">
  {#each moduleCenters as center (center.row + '-' + center.col)}
    <g transform="translate({center.x} {center.y}) rotate({rotation}) scale({starScale})">
      {#each distortedStarRhombi as rh, i}
        <polygon
          points={`${rh[0][0]},${rh[0][1]} ${rh[3][0]},${rh[3][1]} ${rh[2][0]},${rh[2][1]}`}
          fill={triColors[getTriKey(center.row, center.col, i, 0)] || localTriColors[`${i}-0`] || defaultColorFor(i, 0)}
          stroke="#000" stroke-width={strokeWidth}
          on:click={() => selectTriangle(center.row, center.col, i, 0)}
        />
        <polygon
          points={`${rh[0][0]},${rh[0][1]} ${rh[1][0]},${rh[1][1]} ${rh[2][0]},${rh[2][1]}`}
          fill={triColors[getTriKey(center.row, center.col, i, 1)] || localTriColors[`${i}-1`] || defaultColorFor(i, 1)}
          fill-opacity={triangleOpacity / 100}
          stroke="#000" stroke-width={strokeWidth}
          on:click={() => selectTriangle(center.row, center.col, i, 1)}
        />
      {/each}
    </g>
  {/each}

  <!-- gap rhombi - always shown -->
  {#each gapCenters as gap}
      <g transform="translate({gap.x} {gap.y}) rotate({rotation + gap.rotation}) scale(1, {Math.max(starSpacing,1.0)})">
        <!-- gap rhombus split into two triangles so each half can be colored -->
        <!-- triangle A: points 0,3,2 -->
        <polygon
          points={triPointsStr0}
          fill={localGapColors[`${gap.rotation}-0`] || gapTriColors[getGapKey(gap.row, gap.col, gap.rotation, 0)] || ensureGapColor(gap.row, gap.col, gap.rotation, 0)}
          stroke="#000" stroke-width={strokeWidth}
          on:click={() => selectGapTriangle(gap.row, gap.col, gap.rotation, 0)}
        />
        <!-- triangle B: points 0,1,2 -->
        <polygon
          points={triPointsStr1}
          fill={localGapColors[`${gap.rotation}-1`] || gapTriColors[getGapKey(gap.row, gap.col, gap.rotation, 1)] || ensureGapColor(gap.row, gap.col, gap.rotation, 1)}
          fill-opacity={triangleOpacity / 100}
          stroke="#000" stroke-width={strokeWidth}
          on:click={() => selectGapTriangle(gap.row, gap.col, gap.rotation, 1)}
        />
      </g>
    {/each}
  </g>
  </svg>
</div>

<div class="sidebar-right">
  <Slider min={0} max={100} bind:value={triangleOpacity} label="Deckkraft" />
  <Slider min={0.2} max={3.5} step={0.01} bind:value={starSpacing} label="Abstand Sterne" />
  <Slider min={0} max={4} step={0.1} bind:value={strokeWidth} label="Linienstärke" />
  <Slider min={0.3} max={3} step={0.05} bind:value={scale} label="Zoom" />
  <Toggle bind:value={showGaps} label="Lücken anzeigen" />
  {#if selected}
    <hr />
    <div class="label">Ausgewähltes Dreieck:</div>
    <input type="color" bind:value={selectedColor} on:input={() => applySelectedColor()} style="width: 100%; height: 40px; margin-bottom: 10px;" />
  {:else}
    <hr />
    <div class="label" style="color: #999; text-align: center;">Klicke ein Dreieck im SVG</div>
  {/if}
</div>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 16px;
    min-width: 350px;
    overflow-y: auto;
    background: #1a1a1a;
    border-right: 1px solid #333;
  }

  label {
    display: flex;
    flex-direction: column;
    font-size: 0.75rem;
    color: #ccc;
    gap: 6px;
  }

  .checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  input[type="range"] {
    width: 100%;
    accent-color: #666;
  }

  input[type="checkbox"] {
    width: auto;
  }

  .svg-container-raute4 {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
  }

  .svg-canvas {
    width: 100%;
    height: 100%;
    background: white;
  }

  :global(.raute4-controls) {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #3a3a3a;
  }

  :global(.raute4-controls h3) {
    margin: 0;
    font-size: 1rem;
    font-weight: 500;
    color: #cccccc;
  }

  :global(.raute4-controls label) {
    display: flex;
    flex-direction: column;
    font-size: 0.75rem;
    color: #ccc;
    gap: 6px;
  }

  :global(.raute4-controls input[type="range"]) {
    width: 100%;
    accent-color: #666;
  }

  :global(.raute4-controls button) {
    padding: 10px 14px;
    background: #2d2d2d;
    color: #ccc;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  :global(.raute4-controls button:hover) {
    background: #3a3a3a;
    border-color: #4a4a4a;
  }

</style>