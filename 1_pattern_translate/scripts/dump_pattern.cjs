#!/usr/bin/env node
// Dump the rhombi pattern as JSON (CommonJS version).
// Usage: node scripts/dump_pattern.cjs --rows=12 --cols=20 --size=170 --spacing=1.0 > pattern.json

const argv = process.argv.slice(2);
const opts = {};
argv.forEach(a => {
  const m = a.match(/^--([^=]+)=(.*)$/);
  if (m) opts[m[1]] = m[2];
});

const rows = parseInt(opts.rows || 12, 10);
const cols = parseInt(opts.cols || 20, 10);
const size = parseFloat(opts.size || 170);
const spacing = parseFloat(opts.spacing || 1.0);

const scaledSize = size * spacing;
const blockWidth = scaledSize * 2;
const blockHeight = scaledSize * 2;

function createSquare(cx, cy, size, type) {
  const top = [cx, cy - size / 2];
  const right = [cx + size / 2, cy];
  const bottom = [cx, cy + size / 2];
  const left = [cx - size / 2, cy];
  if (type === 'top' || type === 'bottom') {
    return [ [left, top, bottom], [right, top, bottom] ];
  } else {
    return [ [top, left, right], [bottom, left, right] ];
  }
}

function getOuterSquare(cx, cy, size) {
  return [ [cx, cy - size/2], [cx + size/2, cy], [cx, cy + size/2], [cx - size/2, cy] ];
}

// default colors (matches Raute_6.svelte defaults)
const color1 = '#3b82f6';
const color2 = '#ef4444';
const color3 = '#1f2937';

const blocks = [];
for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const blockCx = col * blockWidth;
    const blockCy = row * blockHeight;
    const topSquare = createSquare(blockCx + blockWidth / 2, blockCy + scaledSize / 2, scaledSize, 'top');
    const leftSquare = createSquare(blockCx + scaledSize / 2, blockCy + blockHeight / 2, scaledSize, 'left');
    const rightSquare = createSquare(blockCx + blockWidth - scaledSize / 2, blockCy + blockHeight / 2, scaledSize, 'right');
    const bottomSquare = createSquare(blockCx + blockWidth / 2, blockCy + blockHeight - scaledSize / 2, scaledSize, 'bottom');

    blocks.push({
      row,
      col,
      squares: [
        { type: 'top', triangles: topSquare, outer: getOuterSquare(blockCx + blockWidth / 2, blockCy + scaledSize / 2, scaledSize), colors: [color1, color2] },
        { type: 'left', triangles: leftSquare, outer: getOuterSquare(blockCx + scaledSize / 2, blockCy + blockHeight / 2, scaledSize), colors: [color1, color2] },
        { type: 'right', triangles: rightSquare, outer: getOuterSquare(blockCx + blockWidth - scaledSize / 2, blockCy + blockHeight / 2, scaledSize), colors: [color2, color1] },
        { type: 'bottom', triangles: bottomSquare, outer: getOuterSquare(blockCx + blockWidth / 2, blockCy + blockHeight - scaledSize / 2, scaledSize), colors: [color2, color1] }
      ]
    });
  }
}

console.log(JSON.stringify({ rows, cols, size, spacing, scaledSize, color1, color2, color3, blocks }, null, 2));
