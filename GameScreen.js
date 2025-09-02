import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import * as RN from "react-native";
import * as ROT from "rot-js";
import Minimap from "./components/Minimap";

export default function GameScreen({ onExit }) {
  const [tiles, setTiles] = useState([]);
  const [player, setPlayer] = useState(null);
  // sections: screen is one section; there are 3x3 sections
  const VIEW_W = 10; // tiles per screen horizontally
  const VIEW_H = 10; // tiles per screen vertically
  const SECTIONS_X = 3;
  const SECTIONS_Y = 3;
  const SECTION_W = VIEW_W;
  const SECTION_H = VIEW_H;
  const WIDTH = SECTION_W * SECTIONS_X; // total map width
  const HEIGHT = SECTION_H * SECTIONS_Y; // total map height

  useEffect(() => {
    // generate a simple dungeon using rot-js Digger
    const map = new ROT.Map.Digger(WIDTH, HEIGHT);
    // start with all floors (walkable) and then add section walls
    const _tiles = new Array(HEIGHT)
      .fill(0)
      .map(() => new Array(WIDTH).fill("."));
    // still use rot-js to carve some variety but ensure floors remain '.' unless we place walls
    map.create((x, y, value) => {
      if (value !== 0) {
        _tiles[y][x] = "."; // keep as floor
      }
    });

    // carve section-separating walls (thicker) with one opening per section edge
    // 1-tile thick section walls with single central opening
    const vBoundaries = [SECTION_W, SECTION_W * 2];
    vBoundaries.forEach((bx) => {
      for (let y = 0; y < HEIGHT; y++) {
        _tiles[y][bx] = "#";
      }
      // opening centered vertically per section (use 'd' for doorway)
      for (let sy = 0; sy < SECTIONS_Y; sy++) {
        const oy = sy * SECTION_H + Math.floor(SECTION_H / 2);
        if (oy >= 0 && oy < HEIGHT) _tiles[oy][bx] = "d";
      }
    });

    const hBoundaries = [SECTION_H, SECTION_H * 2];
    hBoundaries.forEach((by) => {
      for (let x = 0; x < WIDTH; x++) {
        _tiles[by][x] = "#";
      }
      // opening centered horizontally per section (use 'd' for doorway)
      for (let sx = 0; sx < SECTIONS_X; sx++) {
        const ox = sx * SECTION_W + Math.floor(SECTION_W / 2);
        if (ox >= 0 && ox < WIDTH) _tiles[by][ox] = "d";
      }
    });

    // commit tiles to state
    // place 4 red obstacles per section (symbol 'r') avoiding walls and openings
    function placeRedObstacles() {
      // build set of forbidden positions: any tile adjacent (4-dir) to any section opening
      const forbidden = new Set();
      // vertical boundaries openings
      const vBoundaries = [SECTION_W, SECTION_W * 2];
      vBoundaries.forEach((bx) => {
        for (let sy = 0; sy < SECTIONS_Y; sy++) {
          const oy = sy * SECTION_H + Math.floor(SECTION_H / 2);
          // add full 3x3 area around the doorway
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const x = bx + dx;
              const y = oy + dy;
              if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT)
                forbidden.add(`${x},${y}`);
            }
          }
        }
      });
      // horizontal boundaries openings
      const hBoundaries = [SECTION_H, SECTION_H * 2];
      hBoundaries.forEach((by) => {
        for (let sx = 0; sx < SECTIONS_X; sx++) {
          const ox = sx * SECTION_W + Math.floor(SECTION_W / 2);
          // add full 3x3 area around the doorway
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const x = ox + dx;
              const y = by + dy;
              if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT)
                forbidden.add(`${x},${y}`);
            }
          }
        }
      });

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
              _tiles[ry] &&
              _tiles[ry][rx] === "." &&
              !forbidden.has(`${rx},${ry}`)
            ) {
              _tiles[ry][rx] = "r"; // red obstacle
              placed++;
            }
            tries++;
          }
        }
      }
    }

    placeRedObstacles();
    setTiles(_tiles);

    // spawn player near the center: search outward from center
    const cx = Math.floor(WIDTH / 2);
    const cy = Math.floor(HEIGHT / 2);
    let spawned = false;
    for (let r = 0; r < Math.max(WIDTH, HEIGHT) && !spawned; r++) {
      for (let dy = -r; dy <= r && !spawned; dy++) {
        for (let dx = -r; dx <= r && !spawned; dx++) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
            if (_tiles[y][x] === "." || _tiles[y][x] === "d") {
              setPlayer({ x, y });
              spawned = true;
            }
          }
        }
      }
    }
  }, []);

  // compute tileSize so the section fills the full window height (prioritize height)
  const { width: windowW, height: windowH } = Dimensions.get("window");
  // compute tileSize so the section fits comfortably; cap to keep tiles small
  const maxTile = 28; // don't make tiles larger than this
  const tileSize = Math.floor(windowH / VIEW_H);
  const effectiveTileSize = Math.min(maxTile, Math.max(6, tileSize));

  // minimap sizing (tiny, fits in top-right)
  const MINI_MAX_SIZE = 120; // max width/height for minimap box
  const miniTileBase = Math.max(
    1,
    Math.floor(MINI_MAX_SIZE / Math.max(WIDTH, HEIGHT))
  );
  const miniTile = miniTileBase;
  const miniWidth = WIDTH * miniTile;
  const miniHeight = HEIGHT * miniTile;

  function movePlayer(dx, dy) {
    if (!player) return;
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (nx < 0 || nx >= WIDTH || ny < 0 || ny >= HEIGHT) return;
    // respect walls: only move onto '.' floor tiles
    if (tiles[ny] && (tiles[ny][nx] === "." || tiles[ny][nx] === "d")) {
      setPlayer({ x: nx, y: ny });
    }
  }

  // randomize the 4 red collidable tiles per section
  function randomizeRedObstacles() {
    setTiles((prev) => {
      if (!prev || prev.length === 0) return prev;
      // deep copy
      const newTiles = prev.map((row) =>
        row.map((cell) => (cell === "r" ? "." : cell))
      );

      // build forbidden set (same logic used during initial placement)
      const forbidden = new Set();
      const vBoundaries = [SECTION_W, SECTION_W * 2];
      vBoundaries.forEach((bx) => {
        for (let sy = 0; sy < SECTIONS_Y; sy++) {
          const oy = sy * SECTION_H + Math.floor(SECTION_H / 2);
          // add full 3x3 area around the doorway
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const x = bx + dx;
              const y = oy + dy;
              if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT)
                forbidden.add(`${x},${y}`);
            }
          }
        }
      });
      const hBoundaries = [SECTION_H, SECTION_H * 2];
      hBoundaries.forEach((by) => {
        for (let sx = 0; sx < SECTIONS_X; sx++) {
          const ox = sx * SECTION_W + Math.floor(SECTION_W / 2);
          // add full 3x3 area around the doorway
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const x = ox + dx;
              const y = by + dy;
              if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT)
                forbidden.add(`${x},${y}`);
            }
          }
        }
      });

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
              newTiles[ry] &&
              newTiles[ry][rx] === "." &&
              !forbidden.has(`${rx},${ry}`)
            ) {
              newTiles[ry][rx] = "r";
              placed++;
            }
            tries++;
          }
        }
      }

      return newTiles;
    });
  }

  return (
    <RN.SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.backButton, { marginRight: 8 }]}
          onPress={randomizeRedObstacles}
        >
          <Text style={styles.backText}>Randomize</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={onExit}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            width: SECTION_W * effectiveTileSize,
            height: SECTION_H * effectiveTileSize,
          }}
        >
          {player && tiles.length > 0
            ? (() => {
                // center the viewport on the player
                let startX = player.x - Math.floor(VIEW_W / 2);
                let startY = player.y - Math.floor(VIEW_H / 2);
                // clamp to map bounds
                startX = Math.max(0, Math.min(startX, WIDTH - VIEW_W));
                startY = Math.max(0, Math.min(startY, HEIGHT - VIEW_H));
                const rows = [];
                for (let vy = 0; vy < VIEW_H; vy++) {
                  const ry = startY + vy;
                  const cols = [];
                  for (let vx = 0; vx < VIEW_W; vx++) {
                    const rx = startX + vx;
                    const cell = (tiles[ry] && tiles[ry][rx]) || "#";
                    const isPlayer = player.x === rx && player.y === ry;
                    cols.push(
                      <View
                        key={`${rx}-${ry}`}
                        style={{
                          width: effectiveTileSize,
                          height: effectiveTileSize,
                          backgroundColor: isPlayer
                            ? "#ffd166"
                            : cell === "."
                            ? "#2b7a2b"
                            : cell === "r"
                            ? "#ff0000"
                            : cell === "d"
                            ? "#2b7a2b"
                            : "#111111",
                          borderWidth: cell === "d" ? 2 : 0.25,
                          borderColor:
                            cell === "d" ? "#3b82f6" : "rgba(0,0,0,0.2)",
                        }}
                      />
                    );
                  }
                  rows.push(
                    <View
                      key={vy}
                      style={{
                        flexDirection: "row",
                        height: effectiveTileSize,
                      }}
                    >
                      {cols}
                    </View>
                  );
                }
                return rows;
              })()
            : null}
        </View>
      </View>

      {/* minimap: UI overlay component in top-right */}
      {tiles.length > 0 && player ? (
        <Minimap
          tiles={tiles}
          player={player}
          miniTile={miniTile}
          miniWidth={miniWidth}
          miniHeight={miniHeight}
          style={styles.minimapAbsolute}
        />
      ) : null}

      {/* simple on-screen D-pad */}
      <View style={styles.dpadContainer} pointerEvents="box-none">
        <View style={styles.dpadRow}>
          <TouchableOpacity
            style={styles.dpadButton}
            onPress={() => movePlayer(0, -1)}
          >
            <Text style={styles.dpadText}>↑</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dpadRow}>
          <TouchableOpacity
            style={styles.dpadButton}
            onPress={() => movePlayer(-1, 0)}
          >
            <Text style={styles.dpadText}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 18 }} />
          <TouchableOpacity
            style={styles.dpadButton}
            onPress={() => movePlayer(1, 0)}
          >
            <Text style={styles.dpadText}>→</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dpadRow}>
          <TouchableOpacity
            style={styles.dpadButton}
            onPress={() => movePlayer(0, 1)}
          >
            <Text style={styles.dpadText}>↓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RN.SafeAreaView>
  );
}

const styles = RN.StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    // backgroundColor: "rgba(255,255,255,0.02)",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  backButton: {
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  backText: { color: "#fff" },
  dpadContainer: {
    position: "absolute",
    right: 18,
    bottom: 18,
    alignItems: "center",
  },
  dpadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dpadButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 10,
    borderRadius: 8,
    margin: 6,
  },
  dpadText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  minimapContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 6,
    overflow: "hidden",
  },
  minimapInner: {
    backgroundColor: "#000",
    borderRadius: 2,
    overflow: "hidden",
  },
  minimapAbsolute: {
    position: "absolute",
    top: 120,
    right: 8,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 6,
    zIndex: 50,
  },
});
