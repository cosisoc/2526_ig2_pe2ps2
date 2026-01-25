<!-- a custom slider component for specifying a range between two values -->
<script>
	let {
		min = $bindable(0),
		max = $bindable(100),
		step = $bindable(1),
		value1 = $bindable(0),
		value2 = $bindable(100),
		label = $bindable('Slider'),
		pushThreshold = $bindable(15)
	} = $props();

	let trackElement = $state(null);
	let thumbElement1 = $state(null);
	let thumbElement2 = $state(null);
	let rangeIndicatorElement = $state(null);
	let resizeTrigger = $state(0);
	let trackWidth = $derived(trackElement ? trackElement.clientWidth + resizeTrigger * 0 : 0);
	let thumbWidth = $derived(thumbElement1 ? thumbElement1.clientWidth + resizeTrigger * 0 : 0);
	let valueToPixelFactor = $derived((trackWidth - 2 * thumbWidth) / (max - min));

	let position1 = $derived(((value1 - min) / (max - min)) * (trackWidth - 2 * thumbWidth));
	let position2 = $derived(((value2 - min) / (max - min)) * (trackWidth - 2 * thumbWidth) + thumbWidth);

	function handlePointerDownThumb(event, thumbType) {
		let pushMode = false;

		if (!thumbType) {
			thumbType = event.target === thumbElement1 ? 'low' : 'high';
		}
		let thumbElement = thumbType === 'low' ? thumbElement1 : thumbElement2;

		event.stopPropagation();
		event.preventDefault();

		const startClientX = event.clientX;
		const startValue = thumbType === 'low' ? value1 : value2;

		if (thumbElement && thumbElement.setPointerCapture) {
			try {
				thumbElement.setPointerCapture(event.pointerId);
			} catch (err) {
				// ignore
			}
		}

		function handlePointerMove(e) {
			const clientX = e.clientX;
			const deltaX = clientX - startClientX;
			const newValue = Math.round((startValue + deltaX / valueToPixelFactor) / step) * step + min;
			let v = Math.min(Math.max(newValue, min), max);
			if (thumbType === 'low') {
				if ((value2 - v) * valueToPixelFactor < -pushThreshold || v >= max) {
					pushMode = true;
				} else if ((value2 - v) * valueToPixelFactor > 0) {
					pushMode = false;
				}
				if (pushMode) {
					value1 = v;
					value2 = v;
				} else {
					value1 = Math.min(v, value2);
				}
			} else {
				if ((v - value1) * valueToPixelFactor < -pushThreshold || v <= min) {
					pushMode = true;
				} else if ((v - value1) * valueToPixelFactor > 0) {
					pushMode = false;
				}
				if (pushMode) {
					value1 = v;
					value2 = v;
				} else {
					value2 = Math.max(v, value1);
				}
			}
		}

		function handlePointerUp(e) {
			if (thumbElement && thumbElement.releasePointerCapture) {
				try {
					thumbElement.releasePointerCapture(event.pointerId);
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

	function handlePointerDownRangeIndicator(event) {
		event.stopPropagation();
		event.preventDefault();
		const startClientX = event.clientX;
		const clickValue1 = value1;
		const clickValue2 = value2;
		const valueDifference = clickValue2 - clickValue1;

		if (rangeIndicatorElement && rangeIndicatorElement.setPointerCapture) {
			try {
				rangeIndicatorElement.setPointerCapture(event.pointerId);
			} catch (err) {
				// ignore
			}
		}

		function handlePointerMove(e) {
			const deltaX = e.clientX - startClientX;

			let newValue1 = Math.round((clickValue1 + deltaX / valueToPixelFactor) / step) * step + min;
			let newValue2 = newValue1 + valueDifference;
			newValue1 = Math.min(Math.max(newValue1, min), newValue2);
			newValue2 = Math.max(Math.min(newValue2, max), newValue1);

			if (newValue2 - newValue1 < valueDifference) {
				if (newValue1 <= min) {
					newValue1 = min;
					newValue2 = newValue1 + valueDifference;
				} else if (newValue2 >= max) {
					newValue2 = max;
					newValue1 = newValue2 - valueDifference;
				}
			}

			value1 = Math.min(Math.max(newValue1, min), value2);
			value2 = Math.max(Math.min(newValue2, max), value1);
		}

		function handlePointerUp(e) {
			if (rangeIndicatorElement && rangeIndicatorElement.releasePointerCapture) {
				try {
					rangeIndicatorElement.releasePointerCapture(event.pointerId);
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

	function handlePointerDownTrack(event) {
		const rect = trackElement.getBoundingClientRect();
		const clickX = event.clientX - rect.left;

		const distanceToThumb1 = Math.abs(clickX - position1 - thumbWidth / 2);
		const distanceToThumb2 = Math.abs(clickX - position2 - thumbWidth / 2);
		let thumbType = distanceToThumb1 < distanceToThumb2 ? 'low' : 'high';
		const positionOffset = thumbType === 'low' ? 0 : thumbWidth;

		const newPosition = Math.min(Math.max(clickX - thumbWidth / 2 - positionOffset, 0), trackWidth - 2 * thumbWidth + positionOffset);
		const newValue = Math.round(((newPosition / (trackWidth - 2 * thumbWidth)) * (max - min)) / step) * step + min;

		if (thumbType === 'low') {
			value1 = Math.min(Math.max(newValue, min), value2);
		} else {
			value2 = Math.min(Math.max(newValue, value1), max);
		}
		handlePointerDownThumb(event, thumbType);
	}

	function handleKeyDown(event, thumbType) {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
			event.preventDefault();
			if (thumbType === 'low') {
				value1 = Math.max(value1 - step, min);
			} else {
				value2 = Math.max(value2 - step, min);
			}
		} else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (thumbType === 'low') {
				value1 = Math.min(value1 + step, value2);
			} else {
				value2 = Math.min(value2 + step, max);
			}
		}
	}

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
	<div bind:this={trackElement} class="track" onpointerdown={handlePointerDownTrack} role="presentation">
		<div
			bind:this={rangeIndicatorElement}
			onpointerdown={handlePointerDownRangeIndicator}
			class="range-highlight"
			style="left:{position1 + thumbWidth - 1}px; width:{position2 - position1 - thumbWidth + 2}px;"
			aria-hidden="true"
			tabindex="-1"
		></div>
		<div
			bind:this={thumbElement1}
			class="thumb low"
			onpointerdown={(e) => handlePointerDownThumb(e, 'low')}
			onkeydown={(e) => handleKeyDown(e, 'low')}
			role="slider"
			tabindex="0"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value1}
			aria-label={label + ' slider thumb low'}
			style="left: {position1}px;"
		>
			{prettifyValue(value1)}
		</div>

		<div
			bind:this={thumbElement2}
			class="thumb high"
			onpointerdown={(e) => handlePointerDownThumb(e, 'high')}
			onkeydown={(e) => handleKeyDown(e, 'high')}
			role="slider"
			tabindex="0"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value2}
			aria-label={label + ' slider thumb high'}
			style="left: {position2}px;"
		>
			{prettifyValue(value2)}
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
		margin-bottom: 0.3rem;
		color: #ccc;
	}
	.track {
		position: relative;
		height: 20px;
		background: #444;
		border-radius: 4px;
	}
	.range-highlight {
		position: absolute;
		top: 0;
		height: 20px;
		background: #888;
		border-radius: 0px;
		touch-action: none;
	}
	.thumb {
		position: absolute;
		top: 0px;
		left: 1px;
		width: 45px;
		height: 20px;
		background: #666;
		border: 1px solid #888;
		border-radius: 4px;
		font-variant-numeric: tabular-nums;
		text-align: center;
		line-height: 18px;
		color: #fff;
		font-size: 0.75rem;
		user-select: none;
		touch-action: none;
	}

	.thumb.low {
		border-radius: 4px 0px 0px 4px;
	}
	.thumb.high {
		border-radius: 0px 4px 4px 0px;
	}
</style>
