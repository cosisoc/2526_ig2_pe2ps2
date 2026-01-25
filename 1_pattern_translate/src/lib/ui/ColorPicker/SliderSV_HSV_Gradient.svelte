<script>
  import { converter } from 'culori';
  import { onMount } from "svelte";
  import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    BufferGeometry,
    Float32BufferAttribute,
    Mesh,
    MeshBasicMaterial,
    DoubleSide,
    ColorManagement,
    LinearSRGBColorSpace,
  } from "three";

  let { hsvValues = $bindable(), width = 180, height = 180, scale = 1, min, max } = $props();
  let threeCanvas = $state(null);

  ColorManagement.enabled = false;

  const scene = new Scene();
  const camera = new PerspectiveCamera(90, 1, 0.1, 1000);
  camera.position.z = (max - min) / 2;

  let renderer;
  let mesh;
  const geometry = new BufferGeometry();

  const segments = 4;
  const size = max - min;
  const halfSize = size / 2;
  const segmentSize = size / segments;

  const indices = [];
  const vertices = [];
  const normals = [];

  const toRGB = converter("rgb");

  let colors = $derived.by(() => {
    const cols = [];
    for (let i = 0; i <= segments; i++) {
      const y = i * segmentSize - halfSize;

      for (let j = 0; j <= segments; j++) {
        const x = j * segmentSize - halfSize;

        let h = hsvValues[0];
        let s = ((max - min) / segments) * j + min;
        let v = ((max - min) / segments) * i + min;
        let rgb = toRGB({ mode: 'okhsv', h: h, s: s, v: 1-v });
        cols.push(rgb.r, rgb.g, rgb.b);
      }
    }
    return cols;
  });

  onMount(() => {
    renderer = new WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x666666, 1);
    renderer.outputColorSpace = LinearSRGBColorSpace;

    for (let i = 0; i <= segments; i++) {
      const y = i * segmentSize - halfSize;

      for (let j = 0; j <= segments; j++) {
        const x = j * segmentSize - halfSize;

        vertices.push(x, -y, 0);
        normals.push(0, 0, 1);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + (j + 1);
        const b = i * (segments + 1) + j;
        const c = (i + 1) * (segments + 1) + j;
        const d = (i + 1) * (segments + 1) + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geometry.setIndex(indices);
    geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

    const material = new MeshBasicMaterial({
      side: DoubleSide,
      vertexColors: true,
    });

    mesh = new Mesh(geometry, material);
    scene.add(mesh);

    threeCanvas.appendChild(renderer.domElement);
    render();
  });

  function render() {
    if (threeCanvas) {
      renderer.render(scene, camera);
    }
  }

  $effect(() => {
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    render();
  });

</script>

<div
  bind:this={threeCanvas}
  id="color-gradient"
  style="width:{width-2}px; height:{height-2}px;"
></div>

<style>
  #color-gradient {
    position: relative;
    background-color: #444;
    overflow: hidden;
    top:1px;
    left:1px;
    border-radius: 3px;
  }
</style>
