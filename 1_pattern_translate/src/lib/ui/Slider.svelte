<!-- a custom slider component -->
<script>
	let { min = $bindable(0), max = $bindable(100), step = $bindable(1), value = $bindable(50), label = $bindable('Slider'), snapValues = [], snapWidth = 16 } = $props();

	let trackElement = $state(null);
	let thumbElement = $state(null);
	let resizeTrigger = $state(0);
	let trackWidth = $derived(trackElement ? trackElement.clientWidth + resizeTrigger * 0 : 0);
	let thumbWidth = $derived(thumbElement ? thumbElement.clientWidth + resizeTrigger * 0 : 0);
	let valueToPixelFactor = $derived((trackWidth - thumbWidth) / (max - min));

	let position = $derived(((value - min) / (max - min)) * (trackWidth - thumbWidth));
	snapValues.sort((a, b) => a - b);

	function snapValue(val) {
		if (snapValues.length === 0) return val;
		let closest = snapValues[0];
		let closestDiff = Math.abs(val - closest);
		for (let i = 1; i < snapValues.length; i++) {
			let diff = Math.abs(val - snapValues[i]);
			if (diff < closestDiff) {
				closest = snapValues[i];
				closestDiff = diff;
			}
		}
		// only snap if within the given snapWidth in pixels
		if (closestDiff * valueToPixelFactor < snapWidth/2) {
			return closest;
		}
		return val;
	}

	function handlePointerDownThumb(event) {
		// unified PointerEvents handler
		event.stopPropagation();
		event.preventDefault();
		const clickX = event.clientX;
		const clickValue = value;

		// start a pointer drag from this pointerdown
		startPointerDrag(event.pointerId, event.clientX, value);
	}

	function startPointerDrag(pointerId, startClientX, startValue) {
		// attach move/up handlers and capture pointer to thumbElement if possible
		if (thumbElement && thumbElement.setPointerCapture) {
			try {
				thumbElement.setPointerCapture(pointerId);
			} catch (e) {
				// ignore if cannot capture
			}
		}

		function handlePointerMove(e) {
			const clientX = e.clientX;
			const deltaX = clientX - startClientX;
			const newValue = Math.round((startValue - min + deltaX / valueToPixelFactor) / step) * step + min;
			value = Math.min(Math.max(snapValue(newValue), min), max);
		}

		function handlePointerUp(e) {
			if (thumbElement && thumbElement.releasePointerCapture) {
				try {
					thumbElement.releasePointerCapture(pointerId);
				} catch (err) {
					// ignore
				}
			}
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
		}

		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	}

	function handleTrackClick(event) {
		const rect = trackElement.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const newPosition = Math.min(Math.max(clickX - thumbWidth / 2, 0), trackWidth - thumbWidth);
		const newValue = Math.round(((newPosition / (trackWidth - thumbWidth)) * (max - min)) / step) * step + min;
		value = Math.min(Math.max(snapValue(newValue), min), max);

		handlePointerDownThumb(event);
	}

	function handleKeyDown(event) {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
			event.preventDefault();
			value = Math.max(value - step, min);
		} else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
			event.preventDefault();
			value = Math.min(value + step, max);
		}
	}

	// prettify value for display
	function prettifyValue(val) {
		let stepDecimalPlaces = (step.toString().split('.')[1] || '').length;
		return val.toFixed(stepDecimalPlaces);
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
		onpointerdown={handleTrackClick}
		role="presentation"
	>
		<div
			bind:this={thumbElement}
			class="thumb"
			onpointerdown={handlePointerDownThumb}
			onkeydown={handleKeyDown}
			role="slider"
			tabindex="0"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-label={label + ' slider thumb'}
			style="left: {position}px;"
		>
			{prettifyValue(value)}
		</div>
	</div>
</div>

<style>
	.slider {
		width: 100%;
		margin-bottom: 1rem;
	}
	.label {
		font-size: 0.75rem;
		margin-top: 0;
		margin-bottom: 0.3rem;
		color: #ccc;
	}
	.track {
		position: relative;
		height: 20px;
		background: #444;
		border-radius: 4px;
		touch-action: none;
	}
	.thumb {
		position: relative;
		top: 0px;
		left: 1px;
		width: 45px;
		height: 20px;
		background: #666;
		border: 1px solid #777;
		border-radius: 4px;
		text-align: center;
		line-height: 18px;
		color: #fff;
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
		user-select: none;
		touch-action: none;
	}
</style>
