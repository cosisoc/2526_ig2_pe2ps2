<script>
	import { formatHex } from 'culori';
	import DraggableSvgNode from './DraggableSvgNode.svelte';

	let { hsvValues = $bindable(), width = 200, height = 14, margin = 6, onchangeColor = null } = $props();

	let minH = 0;
	let maxH = 360;

	 let dragAreaElement = $state(null);
	 // thumbX must be writable so DraggableSvgNode can bind to it.
	 let thumbX = (hsvValues[0] / maxH) * (width - 2) + 1;

	 // keep thumbX in sync when hsvValues[0] changes externally
	 $effect(() => {
		 thumbX = (hsvValues[0] / maxH) * (width - 2) + 1;
	 });

	function updateValues() {
		const newH = ((thumbX - 1) * maxH) / (width - 2);
		const s = hsvValues[1] ?? 1;
		const v = hsvValues[2] ?? 1;
		hsvValues = [newH, s, v];
		try { console.log('SliderH updateValues -> hsvValues', hsvValues); } catch (err) {}
		if (onchangeColor) {
			try { onchangeColor(hsvValues); } catch (err) {}
		}
	}

	let color = $derived(
		formatHex({
			mode: 'okhsv',
			h: hsvValues[0],
			s: hsvValues[1],
			v: hsvValues[2]
		})
	);

	let overhang = 10;

	let step = 10;
	let gradientStops = $derived.by(() => {
		let res = [];
		for (let x = 0; x <= 1; x += 1 / step) {
			let col = formatHex({
				mode: 'okhsv',
				h: x * 360,
				s: hsvValues[1],
				v: hsvValues[2]
			});
			res.push({ color: col, offset: x });
		}
		return res;
	});
</script>

<div class="container" style="width: {width}px; height: {height}px">
	<svg id="gradient" viewBox="{0} {0} {width} {height}" {width} {height}>
		<rect x={0} y={0} {width} {height} rx="4" ry="4" fill="#444" />

		<g>
			<linearGradient id="luminanceGradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2="0">
				{#each gradientStops as stop}
					<stop offset={stop.offset} style={'stop-color:' + stop.color} />
				{/each}
			</linearGradient>

			<rect fill="url(#luminanceGradient)" x={1} y={1} width={width - 2} height={height - 2} rx="3" ry="3" />
		</g>
	</svg>

	<svg
		id="slider"
		viewBox="{-overhang} 0 {width + 2 * overhang} {height}"
		width={width + 2 * overhang}
		{height}
		style="left: {-overhang}px; top: 0px;"
	>
		<rect bind:this={dragAreaElement} fill="#f000" x={0} y={0} {width} {height} />
		<DraggableSvgNode {dragAreaElement} bind:x={thumbX} y={7} minX={1} maxX={width - 1} minY={7} maxY={7} {color} onchange={updateValues} />
	</svg>
</div>

<style>
	.container {
		position: relative;
	}

	svg#slider {
		position: absolute;
	}
</style>
