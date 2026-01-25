<script>
  let {
    dragAreaElement,
    color,
    x = $bindable(),
    y = $bindable(),
    minX = 0,
    maxX = 1,
    minY = 0,
    maxY = 1,
    onchange,
  } = $props();

  let dragging = $state(false);
  let clickMX, clickMY;
  let clickX, clickY;
  let activePointerId = null;
  let pointerCaptureElement = $state(null);
  let windowListenersAdded = false;

  function enter(e) {}

  function down(e) {
    dragging = true;
    activePointerId = e.pointerId ?? null;
    try {
      if (
        pointerCaptureElement &&
        activePointerId != null &&
        pointerCaptureElement.setPointerCapture
      )
        pointerCaptureElement.setPointerCapture(activePointerId);
    } catch (err) {
      // ignore if capture is not available
    }

    if (e.preventDefault) e.preventDefault();

    clickMX = e.clientX;
    clickMY = e.clientY;
    clickX = x;
    clickY = y;
  }

  function move(e) {
    if (activePointerId != null && e.pointerId !== activePointerId) return;
    if (e.preventDefault) e.preventDefault();
    let dx = e.clientX - clickMX;
    let dy = e.clientY - clickMY;
    x = clickX + dx;
    y = clickY + dy;
    if (minX != undefined && maxX != undefined)
      x = Math.min(Math.max(x, minX), maxX);
    if (minY != undefined && maxY != undefined)
      y = Math.min(Math.max(y, minY), maxY);

    if (onchange) onchange();
  }

  function up(e) {
    if (activePointerId != null && e && e.pointerId !== activePointerId) return;

    dragging = false;
    try {
      if (
        pointerCaptureElement &&
        activePointerId != null &&
        pointerCaptureElement.releasePointerCapture
      )
        pointerCaptureElement.releasePointerCapture(activePointerId);
    } catch (err) {
      // ignore
    }
    activePointerId = null;
    try {
      if (windowListenersAdded) {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        windowListenersAdded = false;
      }
    } catch (err) {}
  }

  function leave(e) {}

  $effect(() => {
    if (dragAreaElement) {
      try {
        dragAreaElement.style.touchAction = "none";
      } catch (err) {}

      dragAreaElement.onpointerdown = function (e) {
        if (e.preventDefault) e.preventDefault();
        x = e.clientX - dragAreaElement.getBoundingClientRect().left + minX;
        y = e.clientY - dragAreaElement.getBoundingClientRect().top + minY;
        if (minX != undefined && maxX != undefined)
          x = Math.min(Math.max(x, minX), maxX);
        if (minY != undefined && maxY != undefined)
          y = Math.min(Math.max(y, minY), maxY);

        if (onchange) onchange();

        down(e);
        let pointerCaptured = false;
        try {
          const el = e.currentTarget || e.target;
          if (el && e.pointerId != null && el.setPointerCapture) {
            el.setPointerCapture(e.pointerId);
            pointerCaptured = true;
            activePointerId = e.pointerId;
          }
        } catch (err) {
          pointerCaptured = false;
        }

        if (!pointerCaptured) {
          if (!windowListenersAdded) {
            window.addEventListener("pointermove", move, { passive: false });
            window.addEventListener("pointerup", up);
            window.addEventListener("pointercancel", up);
            windowListenersAdded = true;
          }
        }
      };
    }
  });
</script>

<svelte:window
  onpointermove={dragging ? move : null}
  onpointerup={dragging ? up : null}
  onpointercancel={dragging ? up : null}
/>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<g
  bind:this={pointerCaptureElement}
  onpointerdown={down}
  onpointerenter={enter}
  onpointerleave={leave}
  transform="translate({x} {y})"
  style="touch-action: none; -webkit-user-drag: none;"
>
  <filter id="shadow">
    <feDropShadow dx="1" dy="1" stdDeviation="1" flood-opacity="0.5" />
  </filter>
  <g filter="url(#shadow)">
    <circle cx="0" cy="0" r="8" fill="#f000" stroke="none" />
    <circle
      cx="0"
      cy="0"
      r="5"
      fill={color}
      stroke="#fff"
      stroke-width="2"
    />
  </g>
</g>
