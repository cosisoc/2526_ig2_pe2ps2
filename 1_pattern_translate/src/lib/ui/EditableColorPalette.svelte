<!-- 
  This component takes a list of colors and allows editing them
  with the color picker. the colors are displayed as a vertical palette with the color picker to the right.
-->
<script>
	import ColorPickerHSV from './ColorPicker/ColorPickerHSV.svelte';

	let { colors = $bindable(['#ff0000', '#00ff00', '#0000ff']), selectedColorIndex=$bindable(0), width, height, swatchSize = 40 } = $props();
	height = height || width;
</script>


<div class="editable-color-palette" style="width: {width}px;">
    <div class="color-palette">
        {#each colors as color, index}
            <button
                aria-label="Color Swatch"
                class="color-swatch {index === selectedColorIndex ? 'selected' : ''}"
                style="background-color: {color}; width: {swatchSize}px; height: {swatchSize}px;"
                onclick={() => (selectedColorIndex = index)}
            ></button>
        {/each}
    </div>
    <div class="color-picker-container">
        <ColorPickerHSV bind:color={colors[selectedColorIndex]} width={width} height={height}/>
    </div>
</div>

<style>
    .editable-color-palette {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .color-palette {
        display: flex;
        flex-direction: row;
        gap: 5px;
    }

    .color-swatch {
        border: 2px solid transparent;
        cursor: pointer;
        box-sizing: border-box;
        border: 1px solid #444;
        border-radius: 4px;
        margin: 0;
    }

    .color-swatch.selected {
        border-color: #fff;
    }

    .color-picker-container {
        flex-grow: 1;
    }
</style>
