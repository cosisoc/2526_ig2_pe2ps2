<script>
import { onMount } from 'svelte';

// Export props so parent can control them
export let rows = 15;
export let steps = 12;
export let triangleOpacity = 50;
export let starSpacing = 0.8;
export let strokeWidth = 0.2;
export let showGaps = true;
export let scale = 1.0;
export let triColors = {};
export let gapTriColors = {};
export let selected = null;
export let selectedColor = '#ff0000';

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

// no shape editor: use baseRhombus directly

function rotatePoint(x, y, degrees) {
  const rad = degrees * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

function pointsToStr(points) {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

// build rhombi (6 rotated rhombi for a star)
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

let rhombi = buildRhombiFromBase(baseRhombus);

// Pattern settings
// Pattern params (align with Raute_1)
let gapSize = 0.0;
let rotation = 0;
let starScale = 1.0;

// selected and triColors are already exported props

function getGapKey(r, c, rot, t) {
  return `gap-${r}-${c}-${rot}-${t}`;
}

function ensureGapColor(r, c, rot, t) {
  const key = getGapKey(r, c, rot, t);
  if (!gapTriColors[key]) {
    // default palette for gaps (light tones)
    const palette = { '0': '#e6e6e6', '60': '#d9d9d9', '120': '#cfcfcf' };
    gapTriColors[key] = palette[String(rot)] || '#e6e6e6';
  }
  return gapTriColors[key];
}


function defaultColorFor(row, col, tri) {
  // simple default alternating colors
  const palette = ['#91A599', '#849179', '#B6CDC7', '#F29E4C', '#C94C4C'];
  const idx = (row + col + tri) % palette.length;
  return palette[idx];
}

function getTriKey(r, c, i, t) {
  return `${r}-${c}-${i}-${t}`;
}

function ensureTriColor(r, c, i, t) {
  const key = getTriKey(r, c, i, t);
  if (!triColors[key]) triColors[key] = defaultColorFor(r, c, i);
  return triColors[key];
}

function selectTriangle(r, c, i, t) {
  const key = getTriKey(r, c, i, t);
  selected = { key, row: r, col: c, rhombusIndex: i, triIndex: t };
  selectedColor = triColors[key] || defaultColorFor(r, c, t);
}

function selectGapTriangle(r, c, rot, t) {
  const key = getGapKey(r, c, rot, t);
  selected = { key, row: r, col: c, rotation: rot, triIndex: t, isGap: true };
  selectedColor = gapTriColors[key] || ensureGapColor(r, c, rot, t);
}

// shape editor removed

// Compute centers for grid
// compute module geometry similarly to Raute_1
function computeModuleGeometry() {
  // When zooming out (scale < 1), we need more rows/steps to fill the viewport
  // Use a multiplier to ensure full coverage while keeping performance reasonable
  const zoomFactor = Math.min(scale, 1.0);
  const effectiveRows = Math.ceil(rows / zoomFactor * 2.5);
  const effectiveSteps = Math.ceil(steps / zoomFactor * 2.5);
  
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

let moduleGeom = computeModuleGeometry();

// reactive: recompute module geometry when dependent values change
$: rhombi = buildRhombiFromBase(baseRhombus);
$: moduleGeom = computeModuleGeometry();
$: moduleCenters = moduleGeom.centers.map(c => ({ ...c, x: c.x * Math.max(starSpacing, 1.0), y: c.y * Math.max(starSpacing, 1.0) }));

// baseRhombus is static unless modified by code

// gap centers
$: gapCenters = (() => {
  let gaps = [];
  const baseGapDistance = a * sqrt3 * (1.0 + gapSize);
  const effectiveRows = moduleGeom.effectiveRows;
  const effectiveSteps = moduleGeom.effectiveSteps;
  for (let row = 0; row < effectiveRows; row++) {
    const baseY = row * moduleGeom.baseRowSpacing + (-((effectiveRows - 1) / 2) * moduleGeom.baseRowSpacing);
    const xShift = (row % 2 === 1) ? moduleGeom.halfModuleWidth : 0;
    for (let col = -effectiveSteps; col <= effectiveSteps; col++) {
      const baseCenterX = col * moduleGeom.baseDistance + xShift;
      const baseCenterY = baseY;
      const angles = [30, 90, 150];
      const rotations = [0, 60, 120];
      for (let i = 0; i < 3; i++) {
        const rad = angles[i] * Math.PI / 180;
        const baseGapX = baseCenterX + baseGapDistance * Math.cos(rad);
        const baseGapY = baseCenterY + baseGapDistance * Math.sin(rad);
        gaps.push({ row, col, x: baseGapX * Math.max(starSpacing, 1.0), y: baseGapY * Math.max(starSpacing, 1.0), rotation: rotations[i] });
      }
    }
  }
  return gaps;
})();

// Precompute rhombus points for each module center (6 rhombi per center)
$: centersWithRh = moduleCenters.map(c => {
  const rhList = [];
  for (let i = 0; i < 6; i++) {
    rhList.push(buildRhombusAt(c.x, c.y, rotation + i * 60, starScale));
  }
  return { ...c, rhombi: rhList };
});

// build rhombus points (transformed) for a given center
function buildRhombusAt(cx, cy, rot=0, scaleFactor=1) {
  const pts = baseRhombus.map(p => {
    const r = rotatePoint(p[0] * scaleFactor, p[1] * scaleFactor, rot);
    return { x: r.x + cx, y: r.y + cy };
  });
  return pts;
}

onMount(() => {
  // Colors are generated on-demand via defaultColorFor fallback
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
    gapTriColors[selected.key] = selectedColor;
    gapTriColors = {...gapTriColors};
  } else {
    triColors[selected.key] = selectedColor;
    triColors = {...triColors};
  }
}
</script>

<div class="svg-container-raute4">
  <svg viewBox="-1200 -800 2400 1600" class="svg-canvas" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <g transform="scale({scale})">
  {#each centersWithRh as center}
    {#key `${center.row}-${center.col}`}
      {#each center.rhombi as rh, i}
        <!-- two triangles per rhombus -->
        <g>
          <polygon
            points={pointsToStr([rh[0], rh[3], rh[2]])}
            fill={triColors[getTriKey(center.row, center.col, i, 0)] || defaultColorFor(center.row, center.col, i)}
            stroke="#000" stroke-width={strokeWidth}
            on:click={() => selectTriangle(center.row, center.col, i, 0)}
          />
          <polygon
            points={pointsToStr([rh[0], rh[1], rh[2]])}
            fill={triColors[getTriKey(center.row, center.col, i, 1)] || defaultColorFor(center.row, center.col, i)}
            fill-opacity={triangleOpacity / 100}
            stroke="#000" stroke-width={strokeWidth}
            on:click={() => selectTriangle(center.row, center.col, i, 1)}
          />
        </g>
      {/each}
    {/key}
  {/each}

  {#if showGaps}
    {#each gapCenters as gap}
      <g transform="translate({gap.x} {gap.y}) rotate({rotation + gap.rotation}) scale(1, {Math.max(starSpacing,1.0)})">
        <!-- gap rhombus split into two triangles so each half can be colored -->
        <!-- triangle A: points 0,3,2 -->
        <polygon
          points={pointsToStr([ {x: baseRhombus[0][0], y: baseRhombus[0][1]}, {x: baseRhombus[3][0], y: baseRhombus[3][1]}, {x: baseRhombus[2][0], y: baseRhombus[2][1]} ])}
          fill={gapTriColors[getGapKey(gap.row, gap.col, gap.rotation, 0)] || ensureGapColor(gap.row, gap.col, gap.rotation, 0)}
          stroke="#000" stroke-width={strokeWidth}
          on:click={() => selectGapTriangle(gap.row, gap.col, gap.rotation, 0)}
        />
        <!-- triangle B: points 0,1,2 -->
        <polygon
          points={pointsToStr([ {x: baseRhombus[0][0], y: baseRhombus[0][1]}, {x: baseRhombus[1][0], y: baseRhombus[1][1]}, {x: baseRhombus[2][0], y: baseRhombus[2][1]} ])}
          fill={gapTriColors[getGapKey(gap.row, gap.col, gap.rotation, 1)] || ensureGapColor(gap.row, gap.col, gap.rotation, 1)}
          fill-opacity={triangleOpacity / 100}
          stroke="#000" stroke-width={strokeWidth}
          on:click={() => selectGapTriangle(gap.row, gap.col, gap.rotation, 1)}
        />
      </g>
    {/each}
  {/if}
  </g>
  </svg>
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
  }vg-container-raute4 {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .svg-container-raute4 {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
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