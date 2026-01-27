<script>
	import Slider from '$lib/ui/Slider.svelte';
	
	const squareCount = 20;
	const squareSize = 1000 / squareCount;

	let offset = $state(0);
</script>

<div class="svg-container">
	<svg viewBox="0 0 1000 1000" class="svg-canvas" shape-rendering="crispEdges">
		{#each Array(squareCount) as _, yi}
			{#each Array(squareCount) as _, xi}
				<polygon
					transform="translate({xi * (squareSize + offset)}, {yi * (squareSize + offset)})"
					points="0 0, 0 {squareSize}, {squareSize}, 0"
					fill="teal"
				/>

				<polygon
					transform="translate({xi * (squareSize + offset)}, {yi * (squareSize + offset)})"
					points="0 {squareSize}, {squareSize} 0, {squareSize} {squareSize}"
					fill="beige"
				/>
			{/each}
		{/each}
	</svg>
</div>

<div class="sidebar-right">
	<Slider min={0} max={100} bind:value={offset} label="Square Offset and Size" />
</div>
