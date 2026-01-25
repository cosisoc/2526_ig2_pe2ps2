<script>
    const squareCount = 20;
    const squareSize = 1000 / squareCount;

    // Verschiedene Parameter für das Muster
    let offset = $state(0);      // Abstand zwischen Rauten
    let scale = $state(1);        // Größe der Rauten
    let rotation = $state(0);     // Rotation der Rauten

    const rows = Array.from({ length: squareCount });
</script>

<div id="control">
    <div class="control-row">
        <label>Abstand: {offset}</label>
        <input type="range" min="0" max="50" bind:value={offset} />
    </div>
    
    <div class="control-row">
        <label>Größe: {scale.toFixed(2)}</label>
        <input type="range" min="0.2" max="2" step="0.01" bind:value={scale} />
    </div>
    
    <div class="control-row">
        
    </div>
</div>

<div class="svg-container">
    <svg viewBox="0 0 1000 1000" class="svg-canvas" shape-rendering="crispEdges">
        {#each rows as _, yi}
            {#each rows as _, xi}
                <g transform={`translate(${xi * (squareSize + offset)} ${yi * (squareSize + offset)})`}>
                    <!-- Raute zentriert skalieren und rotieren -->
                    <g transform={`translate(${squareSize/2} ${squareSize/2}) rotate(${rotation}) scale(${scale}) translate(${-squareSize/2} ${-squareSize/2})`}>
                        <!-- Raute als Polygon (Diamant-Form) -->
                        <polygon
                            points={`${squareSize/2} 0, ${squareSize} ${squareSize/2}, ${squareSize/2} ${squareSize}, 0 ${squareSize/2}`}
                            fill={(xi + yi) % 2 === 0 ? '#CFB8B5' : '#909177'}
                            stroke="#000"
                            stroke-width="0.5"
                        />
                    </g>
                </g>
            {/each}
        {/each}
    </svg>
</div>

<style>
    #control {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 20px;
        background: #1a1a1a;
        border-radius: 8px;
        margin: 20px;
    }
    
    .control-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    label {
        min-width: 120px;
        font-size: 0.9rem;
    }
    
    input {
        flex: 1;
        min-width: 150px;
    }
</style>