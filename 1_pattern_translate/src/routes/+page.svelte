<script>
	import Header from '$lib/components/Header.svelte';
	import { slide } from 'svelte/transition';
	import Pattern0 from '$lib/components/0_Raute.svelte';	
	import Raute1 from '$lib/components/Raute_1.svelte';	
	import Raute2 from '$lib/components/Raute_2.svelte';	
	import Raute3 from '$lib/components/Raute_3.svelte';	
	import Raute4 from '$lib/components/Raute_4.svelte';	
	import Raute5 from '$lib/components/Raute_5.svelte';

	// Liste aller verfügbaren Pattern (mit Beschreibungen für Sidebar)
	const patterns = [
		{ id: '0', name: 'Anfang (raute)', component: Pattern0, description: 'Basic rhombus star pattern' },
		{ id: '1', name: 'Farbe (raute1)', component: Raute1, description: 'Variation 1 with color mapping' },
		{ id: '2', name: 'Abstand (raute2)', component: Raute2, description: 'Variation 2 with offsets' },
		{ id: '3', name: 'Raute 3', component: Raute3, description: 'Distorted / warped variation' },
		{ id: '4', name: 'Raute 4', component: Raute4, description: 'Full control variant (controls in left sidebar)' },
		{ id: '5', name: 'Raute 5', component: Raute5, description: 'Utility / position-based controls' }
	];

	// Aktuell ausgewähltes Pattern (index-basiert für Sidebar)
	let selectedIndex = 0;
	$: currentPattern = patterns[selectedIndex]?.component || Pattern0;
	
	// Pattern0 state
	let pattern0Component;
	let pattern0Rows = 15;
	let pattern0Steps = 12;
	let pattern0TriangleOpacity = 50;
	let pattern0StarSpacing = 1.0;
	let pattern0Rotation = 0;
	let pattern0MonoColor = true; // permanently mono
	let pattern0Colors = ['#91A599', '#849179', '#B6CDC7'];

	function callRandomizeColors0() { if (pattern0Component) pattern0Component.randomizeColors(); }
	function callResetColors0() { if (pattern0Component) pattern0Component.resetColors(); }
    
	
	// Raute 4 state
	let raute4Component;
    
	let raute4TriangleOpacity = 50;
	let raute4StarSpacing = 0.8;
	let raute4StrokeWidth = 0.2;
	let raute4ShowGaps = false;
	let raute4Scale = 1.0;
	let raute4TriColors = {};
	let raute4GapTriColors = {};
	let raute4Selected = null;
	let raute4SelectedColor = '#ff0000';
	
    
	
	function callApplySelectedColor() {
		if (!raute4Component) return;
		if (!raute4Selected) return;
		if (raute4Selected.isGap) {
			raute4Component.applySelectedColor();
		} else {
			raute4Component.setColorForLocalTriangle(raute4Selected.rhombusIndex, raute4Selected.triIndex, raute4SelectedColor);
		}
	}
	
	function applyAndDeselect() {
		callApplySelectedColor();
		raute4Selected = null;
	}

// Expose helper commands to browser console for Raute 4
import { onMount } from 'svelte';
onMount(() => {
	window.getRaute4Pattern = () => {
		console.log('raute4 triColors:', raute4TriColors);
		console.log('raute4 gapTriColors:', raute4GapTriColors);
		return { triColors: raute4TriColors, gapTriColors: raute4GapTriColors };
	};

	window.applyRaute4SelectedGlobally = () => {
		if (!raute4Selected) return console.warn('No triangle selected');
		if (!raute4Component) return console.warn('Raute4 component not mounted');
		// if a gap is selected we keep gap behavior
		if (raute4Selected.isGap) {
			raute4Component.applySelectedColor();
			return;
		}
		raute4Component.setColorForLocalTriangle(raute4Selected.rhombusIndex, raute4Selected.triIndex, raute4SelectedColor);
	};

	window.getRaute5Pattern = () => {
		console.log('raute5 triColors:', raute5TriColors);
		console.log('raute5 gapTriColors:', raute5GapTriColors);
		return { triColors: raute5TriColors, gapTriColors: raute5GapTriColors };
	};

	window.applyRaute5SelectedGlobally = () => {
		if (!raute5Selected) return console.warn('No triangle selected');
		if (!raute5Component) return console.warn('Raute5 component not mounted');
		if (raute5Selected.isGap) {
			raute5Component.applySelectedColor();
			return;
		}
		raute5Component.setColorForLocalTriangle(raute5Selected.rhombusIndex, raute5Selected.triIndex, raute5SelectedColor);
	};
});

	// Raute 1 state
	let raute1Component;
	let raute1TriangleOpacity = 50;
	let raute1Colors = ['#91A599', '#849179', '#B6CDC7'];
	let raute1ShowGaps = true;
	let raute1StarSpacing = 1.0;
	// separate compact spacing toggle (independent from showing gaps)
	let raute1CompactSpacing = false;

	function _randHex() {
		return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
	}

	function callRandomizeColors1() {
		// update parent-bound colors so child sees the change even if bind:this isn't set
		raute1Colors = [_randHex(), _randHex(), _randHex()];
		if (raute1Component && typeof raute1Component.randomizeColors === 'function') {
			try { raute1Component.randomizeColors(); } catch (e) { /* ignore */ }
		}
	}

	function callToggleGaps1() {
		if (raute1Component && typeof raute1Component.toggleGaps === 'function') raute1Component.toggleGaps();
		// do not flip raute1ShowGaps here; the input binding already updated it
	}

	function callToggleSpacing1() {
		// input binding updates raute1CompactSpacing; set star spacing accordingly
		raute1StarSpacing = raute1CompactSpacing ? 0.8 : 1.0;
	}

	// Raute 2 state
	let raute2Component;
	let raute2Rows = 15;
	let raute2Steps = 12;
	let raute2TriangleOpacity = 50;
	let raute2StarSpacing = 0.8;
	let raute2ShowGaps = true;
	let raute2MonoColor = false;
	let raute2Colors = ['#91A599', '#849179', '#B6CDC7'];

	function callRandomizeColors2() { if (raute2Component) raute2Component.randomizeColors(); }
	function callResetColors2() { if (raute2Component) raute2Component.resetColors(); }
	function callToggleGaps2() { if (raute2Component) raute2Component.toggleGaps(); raute2ShowGaps = !raute2ShowGaps; }
	function callToggleMono2() { if (raute2Component) raute2Component.toggleMonoColor(); raute2MonoColor = !raute2MonoColor; }

	// Raute 3 state
	let raute3Component;
	let raute3Rows = 15;
	let raute3Steps = 12;
	let raute3TriangleOpacity = 50;
	let raute3StarSpacing = 1.0;
	let raute3RadialDistortion = 0.0;
	let raute3MonoColor = false;
	let raute3ShowGaps = true;
	let raute3Colors = ['#91A599', '#849179', '#B6CDC7'];

	function callRandomizeColors3() { if (raute3Component) raute3Component.randomizeColors(); }
	function callResetColors3() { if (raute3Component) raute3Component.resetColors(); }
	function callToggleMono3() { if (raute3Component) raute3Component.toggleMonoColor(); raute3MonoColor = !raute3MonoColor; }

	// Raute 5 state
	let raute5Component;
    
	let raute5TriangleOpacity = 50;
	let raute5StarSpacing = 0.8;
	let raute5StrokeWidth = 0.2;
	let raute5ShowGaps = false;
	let raute5Scale = 1.0;
	let raute5TriColors = {};
	let raute5GapTriColors = {};
	let raute5Selected = null;
	let raute5SelectedColor = '#ff0000';
	
    
	
	function callApplySelectedColor5() {
		if (!raute5Component) return;
		if (!raute5Selected) return;
		if (raute5Selected.isGap) {
			raute5Component.applySelectedColor();
		} else {
			raute5Component.setColorForLocalTriangle(raute5Selected.rhombusIndex, raute5Selected.triIndex, raute5SelectedColor);
		}
	}
	
	function applyAndDeselect5() {
		callApplySelectedColor5();
		raute5Selected = null;
	}

</script>

<div class="app-container">
	<Header />
	<main class="app-main">
		<!-- Linkes Sidebar-Menü (Buttons mit Beschreibung) -->
		<div class="sidebar-left">
			{#each patterns as pattern, i}
				<button
					class="sidebar-left-item"
					class:selected={selectedIndex === i}
					on:click={() => (selectedIndex = i)}
				>
					{pattern.name}
					{#if selectedIndex === i}
						<div transition:slide class="sidebar-left-description">{pattern.description}</div>
					{/if}
				</button>
			{/each}
			
			<!-- Pattern 0 Controls -->
			{#if selectedIndex === 0}
				<div transition:slide class="raute4-controls">
					<h3>Raute Controls</h3>
					<label>
						Deckkraft 2. Dreieck: {pattern0TriangleOpacity}
						<input type="range" bind:value={pattern0TriangleOpacity} min="0" max="100" step="1" />
					</label>
                    
					<label>
						Rotation: {pattern0Rotation}°
						<input type="range" bind:value={pattern0Rotation} min="0" max="360" step="1" />
					</label>
					<div class="button-group">
						<button on:click={callRandomizeColors0}>Neue Farbe</button>
						<button on:click={callResetColors0}>Reset Colors</button>
					</div>
				</div>
			{/if}
			
			<!-- Raute 4 Controls (only visible when Raute 4 is selected) -->
			{#if selectedIndex === 4}
				<div transition:slide class="raute4-controls">
					<h3>Raute 4 Controls</h3>
					
					<label>
						Deckkraft 2. Dreieck: {raute4TriangleOpacity}
						<input type="range" bind:value={raute4TriangleOpacity} min="0" max="100" step="1" />
					</label>
					
					<label>
						Abstand Sterne: {raute4StarSpacing.toFixed(2)}
						<input type="range" bind:value={raute4StarSpacing} min="0.2" max="3.5" step="0.01" />
					</label>
					
					<label>
						Linienstärke: {raute4StrokeWidth}
						<input type="range" min="0" max="4" step="0.1" bind:value={raute4StrokeWidth} />
					</label>
					
				<label>
					Zoom: {raute4Scale.toFixed(2)}
					<input type="range" min="0.3" max="3.0" step="0.05" bind:value={raute4Scale} />
				</label>
								<label class="checkbox-label">
									<input type="checkbox" bind:checked={raute4ShowGaps} />
								Lücken anzeigen
							</label>
					

					{#if raute4Selected}
						<div class="color-picker-section">
							<strong>Ausgewähltes Dreieck:</strong>
							<div style="margin-top: 8px;">
								<input type="color" bind:value={raute4SelectedColor} on:change={callApplySelectedColor} />
							</div>
							<button on:click={applyAndDeselect}>
								Apply & Deselect
							</button>
						</div>
					{:else}
						<div class="info-text">
							Klicke ein Dreieck im SVG, um die Farbe zu ändern
						</div>
					{/if}
				</div>
			{/if}

			<!-- Raute 1 Controls -->
			{#if selectedIndex === 1}
				<div transition:slide class="raute4-controls">
					<h3>Raute 1 Controls</h3>
					<label>
						Deckkraft 2. Dreieck: {raute1TriangleOpacity}
						<input type="range" bind:value={raute1TriangleOpacity} min="0" max="100" step="1" />
					</label>
					<div class="button-group">
						<button on:click={callRandomizeColors1}>Randomize Colors</button>
					</div>
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={raute1ShowGaps} on:change={callToggleGaps1} /> Lücken anzeigen
					</label>
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={raute1CompactSpacing} on:change={callToggleSpacing1} /> Kompakter Abstand
					</label>
					<div style="margin-top:8px;">
						<label>Farbe 1: <input type="color" bind:value={raute1Colors[0]} /></label>
						<label>Farbe 2: <input type="color" bind:value={raute1Colors[1]} /></label>
						<label>Farbe 3: <input type="color" bind:value={raute1Colors[2]} /></label>
					</div>
				</div>
			{/if}

			<!-- Raute 2 Controls -->
			{#if selectedIndex === 2}
				<div transition:slide class="raute4-controls">
					<h3>Raute 2 Controls</h3>
					<label>
						Deckkraft 2. Dreieck: {raute2TriangleOpacity}
						<input type="range" bind:value={raute2TriangleOpacity} min="0" max="100" step="1" />
					</label>
					<label>
						Abstand Sterne: {raute2StarSpacing.toFixed(2)}
						<input type="range" bind:value={raute2StarSpacing} min="0.2" max="3.5" step="0.01" />
					</label>

					<label class="checkbox-label">
						<input type="checkbox" bind:checked={raute2ShowGaps} /> Lücken anzeigen
					</label>
				</div>
			{/if}

			<!-- Raute 3 Controls -->
			{#if selectedIndex === 3}
				<div transition:slide class="raute4-controls">
					<h3>Raute 3 Controls</h3>
					<label>
						Deckkraft 2. Dreieck: {raute3TriangleOpacity}
						<input type="range" bind:value={raute3TriangleOpacity} min="0" max="100" step="1" />
					</label>
					<label>
						Abstand Sterne: {raute3StarSpacing.toFixed(2)}
						<input type="range" bind:value={raute3StarSpacing} min="0.2" max="3.5" step="0.01" />
					</label>
					<label>
						Verzerrung: {raute3RadialDistortion.toFixed(2)}
						<input type="range" bind:value={raute3RadialDistortion} min="-2.0" max="2.0" step="0.01" />
					</label>
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={raute3MonoColor} /> Einfarbig
					</label>
					<label class="checkbox-label">
					<input type="checkbox" bind:checked={raute3ShowGaps} /> Lücken anzeigen
					</label>
					<div class="button-group">
						<button on:click={callRandomizeColors3}>Randomize Colors</button>
						<button on:click={callResetColors3}>Reset Colors</button>
					</div>
				</div>
			{/if}

			<!-- Raute 5 Controls -->
			{#if selectedIndex === 5}
				<div transition:slide class="raute4-controls">
					<h3>Raute 5 Controls</h3>
					
					<label>
						Deckkraft 2. Dreieck: {raute5TriangleOpacity}
						<input type="range" bind:value={raute5TriangleOpacity} min="0" max="100" step="1" />
					</label>
					
					<label>
						Abstand Sterne: {raute5StarSpacing.toFixed(2)}
						<input type="range" bind:value={raute5StarSpacing} min="0.2" max="3.5" step="0.01" />
					</label>
					
					<label>
						Linienstärke: {raute5StrokeWidth}
						<input type="range" min="0" max="4" step="0.1" bind:value={raute5StrokeWidth} />
					</label>
					
					<label>
						Zoom: {raute5Scale.toFixed(2)}
						<input type="range" min="0.3" max="3.0" step="0.05" bind:value={raute5Scale} />
					</label>
					
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={raute5ShowGaps} />
						Lücken anzeigen
					</label>
					
					

					{#if raute5Selected}
						<div class="color-picker-section">
							<strong>Ausgewähltes Dreieck:</strong>
							<div style="margin-top: 8px;">
								<input type="color" bind:value={raute5SelectedColor} on:change={callApplySelectedColor5} />
							</div>
							<button on:click={applyAndDeselect5}>
								Apply & Deselect
							</button>
						</div>
					{:else}
						<div class="info-text">
							Klicke ein Dreieck im SVG, um die Farbe zu ändern
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Mitte: Pattern Display -->
		<div class="svg-container">
			{#if selectedIndex === 4}
				<Raute4 
					bind:this={raute4Component}
					bind:triangleOpacity={raute4TriangleOpacity}
					bind:starSpacing={raute4StarSpacing}
					bind:strokeWidth={raute4StrokeWidth}
					bind:showGaps={raute4ShowGaps}
					bind:scale={raute4Scale}
					bind:triColors={raute4TriColors}
					bind:gapTriColors={raute4GapTriColors}
					bind:selected={raute4Selected}
					bind:selectedColor={raute4SelectedColor}
				/>
			{:else if selectedIndex === 1}
				<Raute1
					bind:this={raute1Component}
					bind:triangleOpacity={raute1TriangleOpacity}
					bind:starSpacing={raute1StarSpacing}
					bind:showGaps={raute1ShowGaps}
					bind:colors={raute1Colors}
				/>
			{:else if selectedIndex === 2}
				<Raute2
					bind:this={raute2Component}
					bind:rows={raute2Rows}
					bind:steps={raute2Steps}
					bind:triangleOpacity={raute2TriangleOpacity}
					bind:starSpacing={raute2StarSpacing}

					bind:showGaps={raute2ShowGaps}
					bind:monoColor={raute2MonoColor}
					bind:colors={raute2Colors}
				/>
			{:else if selectedIndex === 3}
				<Raute3
					bind:this={raute3Component}
					bind:rows={raute3Rows}
					bind:steps={raute3Steps}
					bind:triangleOpacity={raute3TriangleOpacity}
					bind:starSpacing={raute3StarSpacing}
					bind:radialDistortion={raute3RadialDistortion}
					bind:monoColor={raute3MonoColor}
				bind:showGaps={raute3ShowGaps}
					bind:colors={raute3Colors}
				/>
			{:else if selectedIndex === 5}
				<Raute5 
					bind:this={raute5Component}
					bind:triangleOpacity={raute5TriangleOpacity}
					bind:starSpacing={raute5StarSpacing}
					bind:strokeWidth={raute5StrokeWidth}
					bind:showGaps={raute5ShowGaps}
					bind:scale={raute5Scale}
					bind:triColors={raute5TriColors}
					bind:gapTriColors={raute5GapTriColors}
					bind:selected={raute5Selected}
					bind:selectedColor={raute5SelectedColor}
				/>
			{:else if selectedIndex === 0}
				<Pattern0
					bind:this={pattern0Component}
					bind:rows={pattern0Rows}
					bind:steps={pattern0Steps}
					bind:triangleOpacity={pattern0TriangleOpacity}
					bind:starSpacing={pattern0StarSpacing}
					bind:rotation={pattern0Rotation}
					bind:monoColor={pattern0MonoColor}
					bind:colors={pattern0Colors}
				/>
			{:else}
				<svelte:component this={currentPattern} />
			{/if}
		</div>
	</main>
</div>

<style>
	.sidebar-left {
		width: 260px;
		min-width: 260px;
		background: #1a1a1a;
		border-right: 1px solid #333;
		padding: 20px;
		overflow-y: auto;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.sidebar-left-item {
		width: 100%;
		padding: 12px 14px;
		text-align: left;
		background: #2d2d2d;
		border: 1px solid #3a3a3a;
		border-radius: 6px;
		cursor: pointer;
		font-family: 'Inter Variable', sans-serif;
		font-size: 0.95rem;
		font-weight: 300;
		color: #cccccc;
		transition: all 0.18s;
		position: relative;
	}

	.sidebar-left-item:hover {
		background: #323232;
		border-color: #454545;
	}

	.sidebar-left-item.selected {
		background: #4a4a4a;
		color: #fff;
		border-color: #5a5a5a;
		font-weight: 500;
	}

	.sidebar-left-description {
		margin-top: 8px;
		font-size: 0.82rem;
		color: #bbb;
		line-height: 1.2;
	}

	.svg-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 30px;
		background: #2d2d2dff;
		min-height: 0;
	}

	/* Make app fill viewport */
	.app-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-main {
		flex: 1;
		display: flex;
		min-height: 0;
	}
	
	.raute4-controls {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px solid #3a3a3a;
	}

	.raute4-controls h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 500;
		color: #cccccc;
	}

	.raute4-controls label {
		display: flex;
		flex-direction: column;
		font-size: 0.75rem;
		color: #ccc;
		gap: 6px;
	}

	.checkbox-label {
		flex-direction: row !important;
		align-items: center;
		gap: 8px;
	}

	.raute4-controls input[type="range"] {
		width: 100%;
		accent-color: #666;
	}

	.raute4-controls input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	.raute4-controls input[type="color"] {
		width: 100%;
		height: 40px;
		border: 1px solid #444;
		border-radius: 4px;
		background: #2d2d2d;
		cursor: pointer;
	}

	.raute4-controls button {
		padding: 10px 14px;
		background: #2d2d2d;
		color: #ccc;
		border: 1px solid #3a3a3a;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
		transition: all 0.2s;
	}

	.raute4-controls button:hover {
		background: #3a3a3a;
		border-color: #4a4a4a;
	}

	.button-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.color-picker-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 12px;
		background: #2d2d2d;
		border-radius: 4px;
		border: 1px solid #3a3a3a;
	}

	.color-picker-section strong {
		color: #ccc;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.info-text {
		padding: 12px;
		background: #2d2d2d;
		border-radius: 4px;
		border: 1px solid #3a3a3a;
		font-size: 0.8rem;
		color: #999;
		text-align: center;
	}
</style>
