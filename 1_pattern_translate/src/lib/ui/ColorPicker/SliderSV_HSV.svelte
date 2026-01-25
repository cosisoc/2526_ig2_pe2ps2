<script>
  import { formatHex } from "culori";

  import SliderSV_Gradient from "./SliderSV_HSV_Gradient.svelte";
  import DraggableSvgNode from "./DraggableSvgNode.svelte";

  let {
    hsvValues = $bindable(),
    width = 200,
    height = 180,
    scale = 1,
  } = $props();

  let min = 0;
  let max = 1;

  let dragAreaElement = $state(null);
  let thumbX = $derived(((hsvValues[1] * (width-2)) / max) + 1);
  let thumbY = $derived((((1 - hsvValues[2]) * (height-2)) / max) + 1);

  let overhang = 10;

  function updateValues() {
    hsvValues[1] = ((thumbX-1) * max) / (width-2);
    hsvValues[2] = max - ((thumbY-1) * max) / (height-2);
  }

  let color = $derived(
    formatHex({
      mode: "okhsv",
      h: hsvValues[0],
      s: hsvValues[1],
      v: hsvValues[2],
    })
  );
</script>

<div class="container" style="width: {width}px; height: {height}px">
  <SliderSV_Gradient {width} {height} {hsvValues} {scale} {min} {max} />

  <svg
    viewBox="{-overhang} {-overhang} {width + 2 * overhang} {height +
      2 * overhang}"
    width={width + 2 * overhang}
    height={height + 2 * overhang}
    style="left:{-overhang}px; top:{-overhang}px"
  >
    <rect
      bind:this={dragAreaElement}
      x={0}
      y={0}
      {width}
      {height}
      fill="#f000"
      stroke-width="2"
    />

    <DraggableSvgNode
      bind:dragAreaElement
      bind:x={thumbX}
      bind:y={thumbY}
      minX={1}
      maxX={width-1}
      minY={1}
      maxY={height-1}
      {color}
      onchange={updateValues}
    />
  </svg>
</div>

<style>
  .container {
    position: relative;
    background-color: #444;
    border-radius: 4px;
  }

  svg {
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
