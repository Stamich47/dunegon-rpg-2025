import * as ROT from "rot-js";

export function generateMap({
  WIDTH,
  HEIGHT,
  SECTION_W,
  SECTION_H,
  SECTIONS_X,
  SECTIONS_Y,
}) {
  // start with all floors
  const _tiles = new Array(HEIGHT)
    .fill(0)
    .map(() => new Array(WIDTH).fill("."));
  const map = new ROT.Map.Digger(WIDTH, HEIGHT);
  map.create((x, y, value) => {
    if (value !== 0) _tiles[y][x] = ".";
  });

  // section walls and randomized doorways
  const vBoundaries = [SECTION_W, SECTION_W * 2];
  vBoundaries.forEach((bx) => {
    for (let y = 0; y < HEIGHT; y++) _tiles[y][bx] = "#";
    for (let sy = 0; sy < SECTIONS_Y; sy++) {
      let oy;
      let tries = 0;
      do {
        oy = sy * SECTION_H + Math.floor(Math.random() * SECTION_H);
        tries++;
      } while ((oy === SECTION_H || oy === SECTION_H * 2) && tries < 20);
      if (oy >= 0 && oy < HEIGHT) _tiles[oy][bx] = "d";
    }
  });

  const hBoundaries = [SECTION_H, SECTION_H * 2];
  hBoundaries.forEach((by) => {
    for (let x = 0; x < WIDTH; x++) _tiles[by][x] = "#";
    for (let sx = 0; sx < SECTIONS_X; sx++) {
      let ox;
      let tries = 0;
      do {
        ox = sx * SECTION_W + Math.floor(Math.random() * SECTION_W);
        tries++;
      } while ((ox === SECTION_W || ox === SECTION_W * 2) && tries < 20);
      if (ox >= 0 && ox < WIDTH) _tiles[by][ox] = "d";
    }
  });

  // helper to build forbidden set from doorways (3x3)
  function buildForbidden(tiles) {
    const forbidden = new Set();
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (tiles[y][x] === "d") {
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const fx = x + dx;
              const fy = y + dy;
              if (fx >= 0 && fx < WIDTH && fy >= 0 && fy < HEIGHT)
                forbidden.add(`${fx},${fy}`);
            }
          }
        }
      }
    }
    return forbidden;
  }

  // place red obstacles
  function placeRedObstacles(tiles) {
    const forbidden = buildForbidden(tiles);
    for (let sx = 0; sx < SECTIONS_X; sx++) {
      for (let sy = 0; sy < SECTIONS_Y; sy++) {
        let placed = 0;
        const startX = sx * SECTION_W;
        const startY = sy * SECTION_H;
        let tries = 0;
        while (placed < 4 && tries < 500) {
          const rx = startX + Math.floor(Math.random() * SECTION_W);
          const ry = startY + Math.floor(Math.random() * SECTION_H);
          if (
            tiles[ry] &&
            tiles[ry][rx] === "." &&
            !forbidden.has(`${rx},${ry}`)
          ) {
            tiles[ry][rx] = "r";
            placed++;
          }
          tries++;
        }
      }
    }
  }

  // place chests
  function placeChests(tiles) {
    const forbidden = buildForbidden(tiles);
    for (let sx = 0; sx < SECTIONS_X; sx++) {
      for (let sy = 0; sy < SECTIONS_Y; sy++) {
        let placed = false;
        const startX = sx * SECTION_W;
        const startY = sy * SECTION_H;
        let tries = 0;
        while (!placed && tries < 500) {
          const gx = startX + Math.floor(Math.random() * SECTION_W);
          const gy = startY + Math.floor(Math.random() * SECTION_H);
          if (
            tiles[gy] &&
            tiles[gy][gx] === "." &&
            !forbidden.has(`${gx},${gy}`)
          ) {
            tiles[gy][gx] = "c";
            placed = true;
          }
          tries++;
        }
      }
    }
  }

  placeRedObstacles(_tiles);
  placeChests(_tiles);

  // spawn player near center
  const cx = Math.floor(WIDTH / 2);
  const cy = Math.floor(HEIGHT / 2);
  let spawn = null;
  for (let r = 0; r < Math.max(WIDTH, HEIGHT) && !spawn; r++) {
    for (let dy = -r; dy <= r && !spawn; dy++) {
      for (let dx = -r; dx <= r && !spawn; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
          if (_tiles[y][x] === "." || _tiles[y][x] === "d") {
            spawn = { x, y };
          }
        }
      }
    }
  }

  return { tiles: _tiles, spawn };
}

export default { generateMap };
