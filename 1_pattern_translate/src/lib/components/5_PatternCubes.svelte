<script>
	// import { get } from "svelte/store";

	const squareSize = 100;
	const squareCount = 20;

	const x = squareSize / 2;
	const deg = 30;
	const rad = (Math.PI / 180) * deg;

	const y = Math.tan(rad) * x;
    const z = Math.sqrt(x * x + y * y);
    const distance= z+y;

	function calculatePosition(xi, yi) {
		const offsetX = yi % 2 === 1 ? squareSize / 2 : 0;
		const x = xi * squareSize - offsetX;
		const y = yi * distance;

		return { x: x, y: y };
	}


</script>

<div class="svg-container">
	<svg viewBox="0 0 1000 1000" class="svg-canvas" shape-rendering="crispEdges">
		{#each Array(squareCount) as _, yi}
			{#each Array(squareCount) as _, xi}

				<g transform="translate({calculatePosition(xi, yi).x}, {calculatePosition(xi, yi).y})">
             
					<polygon points="0 0, {x} {y}, {x * 2} 0, {x} {-y} " fill="teal" />

					<polygon
						transform="rotate(120, {x}, {y})"
						points="0 0, {x} {y}, {x * 2} 0, {x} {-y} "
						fill="midnightblue"
					/>

					<polygon
						transform="rotate(240, {x}, {y})"
						points="0 0, {x} {y}, {x * 2} 0, {x} {-y} "
						fill="beige"
					/>
				</g>
			{/each}
		{/each}
	</svg>
</div>