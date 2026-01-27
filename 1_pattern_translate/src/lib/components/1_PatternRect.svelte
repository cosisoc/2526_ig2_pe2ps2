<!-- 
  - Komplett mit Komponenten und Code zeigen 
-->

<script>
	import Slider from '$lib/ui/Slider.svelte';
	
	const squareCount = 20;
	const squareSize = 1000 / squareCount;
	let squareOffset = $state(0);

	function calculatePosition(xi, yi) {
		const x = xi * squareSize;
		const y = yi * squareSize;

		return { x: x, y: y };
	}
</script>

<div class="svg-container">
	<svg viewBox="0 0 1000 1000" class="svg-canvas" shape-rendering="crispEdges">
		{#each Array(squareCount) as _, yi}
			{#each Array(squareCount) as _, xi}
				<rect
					transform="translate({calculatePosition(xi, yi).x + squareOffset} {calculatePosition(xi, yi).y})"
					width={squareSize}
					height={squareSize}
					fill={(xi + yi) % 2 == 0 ? 'hotpink' : 'khaki'}
				/>
			{/each}
		{/each}
	</svg>
</div>

<div class="sidebar-right">
	<Slider min={0} max={50} bind:value={squareOffset} label="Square Offset" />
</div>
