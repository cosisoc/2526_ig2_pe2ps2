<script>
	import { onMount, tick } from 'svelte';

	let { value = $bindable(false), label = $bindable('Slider') } = $props();

	let trackElement = $state(null);
	let thumbElement = $state(null);
	let resizeTrigger = $state(0);
	let trackWidth = $derived(trackElement ? trackElement.clientWidth + resizeTrigger * 0 : 0);
	let thumbWidth = $derived(thumbElement ? thumbElement.clientWidth + resizeTrigger * 0 : 0);
	let valueToPixelFactor = $derived(trackWidth - thumbWidth);

	let position = $derived(value ? trackWidth - thumbWidth - 4 : 0);

	// dragging state
	let dragging = $state(false);
	let pointerStartX = $state(0);
	let startValue = $state(0);

	// mounted flag: when false we disable CSS transition to avoid initial animation
	let mounted = $state(false);
	onMount(async () => {
		await tick();
		mounted = true;
	});

	function handlePointerDownThumb(event) {
		// unify pointer handling for thumb drag
		event.stopPropagation();
		event.preventDefault();
		pointerStartX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches[0] && event.touches[0].clientX) || 0;
		// keep a numeric startValue for arithmetic (0/1)
		startValue = value ? 1 : 0;
		dragging = true;
		let moved = false;

		// try to capture pointer to keep receiving events
		if (thumbElement && thumbElement.setPointerCapture && event.pointerId !== undefined) {
			try {
				thumbElement.setPointerCapture(event.pointerId);
			} catch (err) {
				/* ignore */
			}
		}

		function handlePointerMove(e) {
			if (!dragging) return;
			const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
			const deltaX = clientX - pointerStartX;
			if (Math.abs(deltaX) > 4) moved = true;
			const newValue = Math.round(startValue + deltaX / valueToPixelFactor);
			// set external value as boolean (true when >= 0.5)
			value = newValue >= 0.5;
		}

		function handlePointerUp(e) {
			dragging = false;
			if (!moved) {
				value = !value;
			}
			if (thumbElement && thumbElement.releasePointerCapture && e.pointerId !== undefined) {
				try {
					thumbElement.releasePointerCapture(e.pointerId);
				} catch (err) {
					/* ignore */
				}
			}
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
		}

		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	}

	// track click/press behavior
	function handlePointerDownTrack(event) {
		event.stopPropagation();
		event.preventDefault();
		const startX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches[0] && event.touches[0].clientX) || 0;
		let moved = false;

		function onMove(e) {
			const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
			if (Math.abs(clientX - startX) > 4) moved = true;
		}

		function onUp(e) {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);

			if (!moved) {
				value = !value;
			}

			const rect = trackElement.getBoundingClientRect();
			const clickX = (e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || 0) - rect.left || 0;
			const newPosition = Math.min(Math.max(clickX - thumbWidth / 2, 0), trackWidth - thumbWidth);
			const newValue = Math.round(newPosition / (trackWidth - thumbWidth));
			// assign boolean externally
			value = newValue >= 0.5;
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function handleKeyDown(event) {
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			value = !value;
		}
	}
</script>

<svelte:window
	on:resize={() => {
		resizeTrigger++;
	}}
/>

<div class="slider">
	<div class="label">{label}</div>
	<div
		bind:this={trackElement}
		class="track"
		onpointerdown={handlePointerDownTrack}
		onkeydown={handleKeyDown}
		role="switch"
		aria-checked={!!value}
		aria-label={label + ' toggle'}
		tabindex="0"
	>
		<div
			bind:this={thumbElement}
			class="thumb"
			class:mounted
			onpointerdown={handlePointerDownThumb}
			aria-hidden="true"
			style="left: {Math.min(Math.max(position, 0), Math.max(trackWidth - thumbWidth - 2, 0))}px;"
		></div>
	</div>
</div>

<style>
	.slider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		margin-bottom: 1rem;
	}
	.label {
		font-size: 0.75rem;
		color: #ccc;
		white-space: nowrap;
		margin-right: auto;
		user-select: none;
	}
	.track {
		position: relative;
		width: 40px;
		height: 20px;
		background: #444;
		border-radius: 4px;
		padding: 0;
		box-sizing: border-box;
		touch-action: none;
	}
	.track[aria-checked='true'] {
		background: #aaa;
	}
	.thumb {
		position: absolute;
		top: 0px;
		left: 0px;
		width: 18px;
		height: 18px;
		background: #666;
		border: 1px solid #5a5a5a;
		border-radius: 3px;
		/* no transition by default to avoid animating on mount */
		transition: none;
		user-select: none;
		box-sizing: border-box;
		margin: 1px;
		touch-action: none;
	}
	/* enable transition after mount */
	.thumb.mounted {
		transition: left 120ms ease;
	}
</style>
