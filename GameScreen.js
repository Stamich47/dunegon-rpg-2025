import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import * as RN from "react-native";
import * as ROT from "rot-js";
import createEngine from "./game/miniEngine";
import mapModule from "./game/map";
import Minimap from "./components/Minimap";
import CommonStyles, { colors } from "./styles/common";
import TileGrid from "./components/TileGrid";
import DPad from "./components/DPad";
import LegendOverlay from "./components/LegendOverlay";
import InventoryOverlay from "./components/InventoryOverlay";

export default function GameScreen({ onExit }) {
  const [tiles, setTiles] = useState([]);
  const [player, setPlayer] = useState(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [inventory, setInventory] = useState({ gold: 0 });
  const pulseAnim = useRef(new RN.Animated.Value(0)).current;
  const engineRef = useRef(null);
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
    const result = mapModule.generateMap({
      WIDTH,
      HEIGHT,
      SECTION_W,
      SECTION_H,
      SECTIONS_X,
      SECTIONS_Y,
    });
    setTiles(result.tiles);
    if (result.spawn) setPlayer(result.spawn);
  }, []);

  // --- mini engine wiring (non-destructive): create engine and mirror entities
  useEffect(() => {
    const engine = createEngine(120);

    // register a system to detect player/chest overlap and perform pickup
    engine.registerSystem((entitiesSnapshot) => {
      const playerEnt = entitiesSnapshot.find((e) => e.type === "player");
      if (!playerEnt) return;
      const chests = entitiesSnapshot.filter((e) => e.type === "chest");
      chests.forEach((g) => {
        if (g.x === playerEnt.x && g.y === playerEnt.y) {
          // pickup: increment inventory and remove chest entity
          setInventory((inv) => ({
            ...inv,
            gold: (inv.gold || 0) + (g.amount || 1),
          }));
          engine.removeEntity(g.id);
          // also clear tile in UI state
          setTiles((prev) => {
            const copy = prev.map((r) => r.slice());
            if (copy[g.y] && copy[g.y][g.x] === "c") copy[g.y][g.x] = ".";
            return copy;
          });
        }
      });
    });

    engine.start();

    // populate engine entities from current tiles + player
    // create chest entities from tiles
    const chestIds = [];
    tiles.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === "c") {
          const amount = Math.floor(Math.random() * 10) + 1;
          const cid = engine.addEntity({ type: "chest", x, y, amount });
          chestIds.push(cid);
        }
      });
    });

    // player entity
    let pid = null;
    if (player) {
      pid = engine.addEntity({ type: "player", x: player.x, y: player.y });
    }

    // expose engine to handlers
    engineRef.current = engine;

    // movement/intent system: consumes intents and moves player if valid
    engine.registerSystem((entitiesSnapshot) => {
      const intents = engine.consumeIntents();
      if (!intents || intents.length === 0) return;
      const playerEnt = entitiesSnapshot.find((e) => e.type === "player");
      if (!playerEnt) return;
      intents.forEach((it) => {
        if (it.type === "move") {
          const nx = playerEnt.x + it.dx;
          const ny = playerEnt.y + it.dy;
          if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) return;
          const cell = tiles[ny] && tiles[ny][nx];
          if (!cell) return;
          if (cell === "." || cell === "d" || cell === "c") {
            // move player entity
            engine.updateEntity(playerEnt.id, { x: nx, y: ny });
            setPlayer({ x: nx, y: ny });
            if (cell === "c") {
              // find chest entity at destination in the snapshot and remove it
              const chestEnt = entitiesSnapshot.find(
                (e) => e.type === "chest" && e.x === nx && e.y === ny
              );
              if (chestEnt) {
                // award gold immediately
                const amt = chestEnt.amount || 1;
                setInventory((inv) => ({
                  ...inv,
                  gold: (inv.gold || 0) + amt,
                }));
                engine.removeEntity(chestEnt.id);
              }
              // clear tile visually
              setTiles((prev) => {
                const copy = prev.map((r) => r.slice());
                if (copy[ny] && copy[ny][nx] === "c") copy[ny][nx] = ".";
                return copy;
              });
            }
          }
        }
      });
    });

    // watch player state and keep engine in sync (small sync loop)
    const unwatch = setInterval(() => {
      // pull latest player entity from engine and mirror to local state
      const p = engine.getEntities().find((e) => e.type === "player");
      if (p) setPlayer({ x: p.x, y: p.y });
    }, 120);

    // cleanup on unmount
    return () => {
      clearInterval(unwatch);
      engine.stop();
    };
  }, [player, tiles]);

  // smooth pulsing animation for gold tiles (placed after map init)
  useEffect(() => {
    const anim = RN.Animated.loop(
      RN.Animated.sequence([
        RN.Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
          easing: RN.Easing.inOut(RN.Easing.ease),
        }),
        RN.Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
          easing: RN.Easing.inOut(RN.Easing.ease),
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

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
    // emit movement intent to engine (engine will validate and update)
    if (engineRef.current)
      engineRef.current.emitIntent({ type: "move", dx, dy });
  }

  // randomize the 4 red collidable tiles per section
  function randomizeRedObstacles() {
    setTiles((prev) => {
      if (!prev || prev.length === 0) return prev;
      // deep copy and clear previous red obstacles
      const newTiles = prev.map((row) =>
        row.map((cell) => (cell === "r" ? "." : cell))
      );

      // Rebuild section boundary walls and randomize doorways along each wall
      const vBoundaries = [SECTION_W, SECTION_W * 2];
      vBoundaries.forEach((bx) => {
        for (let y = 0; y < HEIGHT; y++) newTiles[y][bx] = "#";
        for (let sy = 0; sy < SECTIONS_Y; sy++) {
          let oy;
          let tries = 0;
          do {
            oy = sy * SECTION_H + Math.floor(Math.random() * SECTION_H);
            tries++;
          } while ((oy === SECTION_H || oy === SECTION_H * 2) && tries < 20);
          if (oy >= 0 && oy < HEIGHT) newTiles[oy][bx] = "d";
        }
      });
      const hBoundaries = [SECTION_H, SECTION_H * 2];
      hBoundaries.forEach((by) => {
        for (let x = 0; x < WIDTH; x++) newTiles[by][x] = "#";
        for (let sx = 0; sx < SECTIONS_X; sx++) {
          let ox;
          let tries = 0;
          do {
            ox = sx * SECTION_W + Math.floor(Math.random() * SECTION_W);
            tries++;
          } while ((ox === SECTION_W || ox === SECTION_W * 2) && tries < 20);
          if (ox >= 0 && ox < WIDTH) newTiles[by][ox] = "d";
        }
      });

      // place one chest 'c' per section (avoid doorways 3x3)
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          if (newTiles[y][x] === "c") newTiles[y][x] = "."; // clear old chests
        }
      }
      for (let sx = 0; sx < SECTIONS_X; sx++) {
        for (let sy = 0; sy < SECTIONS_Y; sy++) {
          let placed = false;
          const startX = sx * SECTION_W;
          const startY = sy * SECTION_H;
          let tries = 0;
          while (!placed && tries < 500) {
            const gx = startX + Math.floor(Math.random() * SECTION_W);
            const gy = startY + Math.floor(Math.random() * SECTION_H);
            if (newTiles[gy] && newTiles[gy][gx] === ".") {
              // ensure not inside doorway 3x3
              let nearDoor = false;
              for (let dx = -1; dx <= 1 && !nearDoor; dx++) {
                for (let dy = -1; dy <= 1 && !nearDoor; dy++) {
                  const fx = gx + dx;
                  const fy = gy + dy;
                  if (
                    fx >= 0 &&
                    fx < WIDTH &&
                    fy >= 0 &&
                    fy < HEIGHT &&
                    newTiles[fy][fx] === "d"
                  )
                    nearDoor = true;
                }
              }
              if (!nearDoor) {
                newTiles[gy][gx] = "c";
                placed = true;
              }
            }
            tries++;
          }
        }
      }

      // build forbidden set by scanning newTiles for actual doorway 'd' tiles
      const forbidden = new Set();
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          if (newTiles[y][x] === "d") {
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

      // place red obstacles per section respecting forbidden set
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

  // ensure player still on a walkable tile after randomize
  useEffect(() => {
    if (!player || tiles.length === 0) return;
    const cell = tiles[player.y] && tiles[player.y][player.x];
    if (!cell || (cell !== "." && cell !== "d" && cell !== "c")) {
      // find nearest walkable tile by BFS
      const q = [{ x: player.x, y: player.y }];
      const seen = new Set([`${player.x},${player.y}`]);
      const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];
      let found = null;
      while (q.length > 0 && !found) {
        const cur = q.shift();
        for (const d of dirs) {
          const nx = cur.x + d.x;
          const ny = cur.y + d.y;
          if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) continue;
          const key = `${nx},${ny}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const cc = tiles[ny] && tiles[ny][nx];
          if (cc && (cc === "." || cc === "d" || cc === "c")) {
            found = { x: nx, y: ny };
            break;
          }
          q.push({ x: nx, y: ny });
        }
      }
      if (found) setPlayer(found);
    }
  }, [tiles]);

  return (
    <RN.SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.backButton, { marginRight: 8 }]}
          onPress={() => setLegendOpen((s) => !s)}
        >
          <Text style={styles.backText}>Legend</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { marginRight: 8 }]}
          onPress={() => setInvOpen((s) => !s)}
        >
          <Text style={styles.backText}>Inventory</Text>
        </TouchableOpacity>
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
                let startX = player.x - Math.floor(VIEW_W / 2);
                let startY = player.y - Math.floor(VIEW_H / 2);
                startX = Math.max(0, Math.min(startX, WIDTH - VIEW_W));
                startY = Math.max(0, Math.min(startY, HEIGHT - VIEW_H));
                return (
                  <TileGrid
                    tiles={tiles}
                    player={player}
                    VIEW_W={VIEW_W}
                    VIEW_H={VIEW_H}
                    startX={startX}
                    startY={startY}
                    size={effectiveTileSize}
                    pulseAnim={pulseAnim}
                  />
                );
              })()
            : null}
        </View>
      </View>
      {/* collapsible legend overlay */}
      {legendOpen ? <LegendOverlay /> : null}

      {/* inventory overlay */}
      {invOpen ? <InventoryOverlay inventory={inventory} /> : null}

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

      <DPad onMove={movePlayer} />
    </RN.SafeAreaView>
  );
}

const styles = CommonStyles;
