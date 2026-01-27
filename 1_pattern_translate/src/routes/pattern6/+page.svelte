<script>
import Raute5 from '$lib/components/Raute_5.svelte';
import Slider from '$lib/ui/Slider.svelte';

let translateX = 0;
let translateY = 0;
let colorPatternIndex = 5; // default to Pattern 6 (0-based)

// small helper to format px values for display
function fmt(v) { return v + 'px'; }
</script>

<div style="display:flex; height:100vh; gap:12px; padding:12px; box-sizing:border-box;">
  <div style="width:320px; background:#fff; border-right:1px solid #ddd; padding:12px; box-sizing:border-box;">
    <h3 style="margin:0 0 12px 0;">Pattern 6 - Verschieben</h3>
    <Slider min={-800} max={800} step={1} bind:value={translateX} label="Horizontal verschieben" />
    <div style="font-size:13px; color:#333; margin-top:6px;">{fmt(translateX)}</div>
    <div style="height:12px"></div>
    <Slider min={-800} max={800} step={1} bind:value={translateY} label="Vertikal verschieben" />
    <div style="font-size:13px; color:#333; margin-top:6px;">{fmt(translateY)}</div>
    <div style="height:18px"></div>
    <Slider min={0} max={6} step={1} bind:value={colorPatternIndex} label="Muster (Index)" />
    <div style="font-size:13px; color:#666; margin-top:6px;">Aktuelles Muster: {colorPatternIndex + 1}</div>
    <div style="height:8px"></div>
    <button on:click={() => { translateX = 0; translateY = 0; }} style="margin-top:12px; padding:8px 12px;">Reset Verschiebung</button>
  </div>

  <div style="flex:1; display:flex; align-items:center; justify-content:center; background:#f5f5f5;">
    <div style="width:100%; height:100%; overflow:hidden; display:flex; align-items:center; justify-content:center;">
      <div style="transform: translate({translateX}px, {translateY}px); transition: transform 0.05s; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
        <Raute5 {colorPatternIndex} />
      </div>
    </div>
  </div>
</div>

<style>
/* minimal page styles to keep UI clean */
h3 { font-family: Arial, sans-serif; font-size:16px; }
button { background:#6B8A5F; color:white; border:none; border-radius:4px; cursor:pointer }
</style>
