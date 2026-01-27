<script>
  import { parse, converter } from "culori";
  import SliderSV from "./SliderSV_HSV.svelte";
  import SliderH from "./SliderH_HSV.svelte";

  let {
    color = $bindable(),
    width = 200,
    height,
    showSV = true,
  } = $props();

  height = height || width;
  let containerHeight = showSV ? height + 20 : 40;

  const toHSV = converter("okhsv");
  const toRGB = converter("rgb");

  // internal hsv state (h: 0..360, s:0..1, v:0..1)
  let hsvValues = $state([0, 1, 1]);
  let alpha = $state(1);

  // guards to avoid cycles when writing back to `color`
  let isSettingColorFromInternal = $state(false);
  let lastNormalizedColor = $state(null);

  function clamp01(v) {
    if (v == null || Number.isNaN(v)) return 0;
    return Math.max(0, Math.min(1, v));
  }

  function toNormalizedHexWithAlpha(rgbObj) {
    // rgbObj: {r,g,b,a} r/g/b in 0..1
    const r = Math.round(clamp01(rgbObj.r) * 255);
    const g = Math.round(clamp01(rgbObj.g) * 255);
    const b = Math.round(clamp01(rgbObj.b) * 255);
    const a = rgbObj.alpha ?? rgbObj.a ?? 1;

    function two(n) {
      return n.toString(16).padStart(2, "0");
    }

    const hex = `#${two(r)}${two(g)}${two(b)}`;
    if (a == null || a >= 1) return hex.toLowerCase();
    const aa = Math.round(clamp01(a) * 255);
    return `${hex}${two(aa)}`.toLowerCase();
  }

  function normalizeColorString(str) {
    if (str == null) return null;
    try {
      return String(str).trim().toLowerCase();
    } catch (err) {
      return null;
    }
  }

  function parseToOkhsv(input) {
    try {
      const parsed = parse(input);
      if (!parsed) return null;
      const okhsv = toHSV(parsed);
      return okhsv;
    } catch (err) {
      return null;
    }
  }

  // when parent updates `color`, parse and update internal hsv (prop -> internal)
  $effect(() => {
    const normalized = normalizeColorString(color);
    if (normalized == null) return;

    if (isSettingColorFromInternal) {
      isSettingColorFromInternal = false;
      if (normalized === lastNormalizedColor) return;
    }

    if (normalized === lastNormalizedColor) return;

    const okhsv = parseToOkhsv(color);
    if (!okhsv) return;

    hsvValues[0] = okhsv.h ?? 0;
    hsvValues[1] = clamp01(okhsv.s ?? 0);
    hsvValues[2] = clamp01(okhsv.v ?? 0);
    alpha = okhsv.alpha ?? okhsv.a ?? 1;

    lastNormalizedColor = normalized;
  });

  // when internal HSV changes, update `color` (internal -> prop)
  $effect(() => {
    const h = hsvValues[0];
    const s = hsvValues[1];
    const v = hsvValues[2];
    const a = alpha;

    const okhsvObj = { mode: "okhsv", h: h, s: s, v: v };
    const rgb = toRGB(okhsvObj) || {};
    if (a != null) rgb.a = a;

    const out = toNormalizedHexWithAlpha({
      r: rgb.r ?? 0,
      g: rgb.g ?? 0,
      b: rgb.b ?? 0,
      a: rgb.a ?? a ?? 1,
      alpha: rgb.a ?? a ?? 1,
    });
    const normalized = normalizeColorString(out);
    if (normalized == null) return;
    if (normalized === lastNormalizedColor) return;

    isSettingColorFromInternal = true;
    color = out;
    lastNormalizedColor = normalized;
  });

  function mouseWheelHandler(event) {
    event.preventDefault();
    let delta = event.deltaY;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      delta = -event.deltaX;
    }
    hsvValues[0] = (hsvValues[0] + delta / 10 + 360) % 360;
  }
</script>

  <div
  onwheel={mouseWheelHandler}
  class="container"
  style="width: {width}px; height: {containerHeight}px;"
>
  {#if showSV}
    <SliderSV bind:hsvValues {width} height={height} />
  {/if}
  <SliderH bind:hsvValues {width} />
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    background-color: #3330;
    justify-content: space-between;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    line-height: 1;
    font-size: inherit;
  }
</style>
