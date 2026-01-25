<script>
  // Single 6-rhombus star in the center
  const L = 100.0;      // long diagonal (radial)
  const S = 50.0;      // short diagonal (tangential)
  let offset = $state(0);   // inner hexagon radius (controllable)
  let rotation = $state(30);  // rotation angle around the center point (in degrees)
  let cols = $state(5);
  let rows = $state(5);
  let tileSpacing = $state(300);
  let globalRotation = $state(0);
  
  const cx = 500;     // canvas center x
  const cy = 500;     // canvas center y

  // Base rhombus shape centered at origin, pointing right (θ=0°)
  const halfL = L / 2;
  const halfS = S / 2;
  const basePoints = `${halfL},0 0,${halfS} ${-halfL},0 0,${-halfS}`;

  // Generate 6 rhombi for the single star (relative positions, no absolute cx/cy)
  const allRhombi = $derived.by(() => {
    const result = [];
    const C = offset + L / 2;  // center distance from origin

    for (let k = 0; k < 6; k++) {
      const theta = k * 60 + rotation;
      const thetaRad = theta * Math.PI / 180;
      const x = C * Math.cos(thetaRad);
      const y = C * Math.sin(thetaRad);

      result.push({ x, y, rotation: theta });
    }

    return result;
  });
</script>

<div id="control">
  <div class="control-row">
    <span>Offset:</span>
    <input type="range" min="0" max="2" step="0.01" bind:value={offset} />
    <span>{offset.toFixed(2)}</span>
  </div>

  <div class="control-row">
    <span>Cols:</span>
    <input type="range" min="1" max="8" step="1" bind:value={cols} />
    <span>{cols}</span>
  </div>

  <div class="control-row">
    <span>Rows:</span>
    <input type="range" min="1" max="8" step="1" bind:value={rows} />
    <span>{rows}</span>
  </div>

  <div class="control-row">
    <span>Spacing:</span>
    <input type="range" min="100" max="600" step="10" bind:value={tileSpacing} />
    <span>{tileSpacing}px</span>
  </div>

  <div class="control-row">
    <span>Gesamtrotation:</span>
    
  </div>
  
  <div class="control-row">
    
  </div>
</div>

<div class="svg-container">
  <svg viewBox="0 0 1000 1000" class="svg-canvas" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">
    <!-- white background -->
    <rect x="0" y="0" width="1000" height="1000" fill="white" />

    <!-- rotate everything around canvas center by globalRotation -->
    <!-- vereinfachte Transform: einmal zur Mitte + Rotation -->
    <g transform={`translate(${cx} ${cy}) rotate(${globalRotation})`}>
      <!-- Draw tiled groups of the 6 rhombi -->
      {#each Array(rows) as _, ry}
        {#each Array(cols) as _, cxIdx}
          <!-- Verwende tileSpacing und hex-Vertikal-Faktor (sqrt(3)/2 ≈ 0.866) -->
          <g transform={`translate(${(cxIdx - (cols-1)/2 + (ry%2)*0.5) * tileSpacing} ${(ry - (rows-1)/2) * tileSpacing * 0.866})`}>
            {#each allRhombi as rhombus}
              <polygon 
                points={basePoints} 
                transform={`translate(${rhombus.x} ${rhombus.y}) rotate(${rhombus.rotation})`}
                fill="white" 
                stroke="#000" 
                stroke-width="1"
              />
            {/each}
          </g>
        {/each}
      {/each}
    </g>
  </svg>
</div>

<style>
  #control {
    display: flex;
    flex-direction: column;
    width: 320px;
    justify-content: flex-start;
    align-items: stretch;
    gap: 8px;
    padding: 12px;
  }
  
  .control-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  input {
    flex: 1;
  }

  .svg-container {
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
  }

  .svg-canvas {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    display: block;
  }
</style>
