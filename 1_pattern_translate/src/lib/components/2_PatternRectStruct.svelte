<!-- 
  - HTML und Svelte Code zeigen + Funktionsaufrufe
  - Zeige wie das erste kleine Pattern beginnt (außerhalb der Schleife)

  - 2 Rechtecke in der Schleife und entsprechend der Indizes x, y, width und height anpassen
  - Funktionen müssen sie schreiben 
  - Kleiner Tipp mit data-x um zu sehen welche Indizes die Rects haben
-->

<script>
	const squareCount = 20;
	const squareSize = 1000 / squareCount;
	const unitCount = Math.floor(squareCount / 2);

	function unitBaseX(u) {
		return u * 2 * squareSize;
	}

	function rowOffset(yi) {
		return yi % 2 === 1 ? squareSize : 0;
	}
</script>

<div class="svg-container" style="overflow: hidden;">
	<svg viewBox="0 0 1000 1000" class="svg-canvas">
		<defs>
			<clipPath id="canvas-clip" clipPathUnits="userSpaceOnUse">
				<rect x="0" y="0" width="1000" height="1000" />
			</clipPath>
		</defs>
		<g clip-path="url(#canvas-clip)">
			{#each Array(squareCount) as _, yi}
				{#each Array(unitCount) as _, ui}
				<rect
					transform="translate({unitBaseX(ui) + rowOffset(yi)} {yi * squareSize})"
					width={squareSize}
					height={squareSize / 2}
					fill="hotpink"
					data-unit={ui}
					data-row={yi}
				/>

				<rect
					transform="translate({unitBaseX(ui) + rowOffset(yi)} {yi * squareSize + squareSize / 2})"
					width={squareSize}
					height={squareSize / 2}
					fill="khaki"
					data-unit={ui}
					data-row={yi}
				/>

				<rect
					transform="translate({unitBaseX(ui) + squareSize + rowOffset(yi)} {yi * squareSize})"
					width={squareSize / 2}
					height={squareSize}
					fill="hotpink"
					data-unit={ui}
					data-row={yi}
				/>

				<rect
					transform="translate({unitBaseX(ui) + squareSize + squareSize / 2 + rowOffset(yi)} {yi * squareSize})"
					width={squareSize / 2}
					height={squareSize}
					fill="khaki"
					data-unit={ui}
					data-row={yi}
				/>
				{/each}
			{/each}
		</g>
	</svg>
</div>
