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
import { uid } from "./utils/id";
import { items as itemTemplates } from "./data/items";
import mapModule from "./game/map";
import Minimap from "./components/Minimap";
import CommonStyles, { colors } from "./styles/common";
import TileGrid from "./components/TileGrid";
import DPad from "./components/DPad";
import LegendOverlay from "./components/LegendOverlay";
import InventoryOverlay from "./components/InventoryOverlay";
import TacticalOverlay from "./components/TacticalOverlay";

export default function GameScreen({ onExit }) {
  const [tiles, setTiles] = useState([]);
  const [player, setPlayer] = useState(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [inventory, setInventory] = useState({ gold: 0, items: [] });
  const [combat, setCombat] = useState(null); // { enemyId, enemyHp, playerHp, turn: 'player'|'enemy' }
  const pulseAnim = useRef(new RN.Animated.Value(0)).current;
  const engineRef = useRef(null);
  const unwatchRef = useRef(null);
  const tilesRef = useRef(tiles);
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

  // keep tilesRef in sync so engine systems read the latest tiles state
  useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);

  // --- mini engine wiring (non-destructive): create engine and mirror entities
  useEffect(() => {
    // only create engine once when tiles are ready
    if (engineRef.current) return;
    if (!tiles || tiles.length === 0) return; // wait for map to load
    const ENGINE_TICK_MS = 120;
    const ticksPerSecond = Math.max(1, Math.round(1000 / ENGINE_TICK_MS));
    const engine = createEngine(ENGINE_TICK_MS);

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
          // chest always contains some gold plus 0-2 random items
          const chestUid = uid(10);
          const goldAmount = Math.floor(Math.random() * 10) + 1;
          const itemsInside = [];
          const itemCount = Math.floor(Math.random() * 3); // 0,1,2
          const pool = itemTemplates.filter((t) => t.id !== "gold");
          for (let k = 0; k < itemCount; k++) {
            const tpl = pool[Math.floor(Math.random() * pool.length)];
            itemsInside.push({
              instanceId: uid(10),
              templateId: tpl.id,
              qty: 1,
            });
          }
          const cid = engine.addEntity({
            type: "chest",
            x,
            y,
            uid: chestUid,
            content: { kind: "bundle", gold: goldAmount, items: itemsInside },
          });
          chestIds.push(cid);
        }
      });
    });

    // create enemy entities from tiles ('e')
    const enemyIds = [];
    tiles.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === "e") {
          const eid = engine.addEntity({
            type: "enemy",
            x,
            y,
            state: "wander",
            speed: ticksPerSecond, // move ~once per second
            nextMoveAt: ticksPerSecond, // schedule first move after initial delay
            detectRange: 6, // retained but unused while chase disabled
          });
          enemyIds.push(eid);
          console.log(`[Engine] spawned enemy ${eid} at ${x},${y}`);
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
          const currentTiles = tilesRef.current || tiles;
          const cell = currentTiles[ny] && currentTiles[ny][nx];
          if (!cell) return;
          // if an enemy entity occupies the target, start combat (covers tiles/entities desync)
          const enemyHere = entitiesSnapshot.find(
            (e) => e.type === "enemy" && e.x === nx && e.y === ny
          );
          if (enemyHere) {
            setCombat({
              enemyId: enemyHere.id,
              enemyHp: 10,
              playerHp: 10,
              turn: "player",
              enemyPos: { x: nx, y: ny },
            });
            return;
          }
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
                const content = chestEnt.content;
                if (!content) {
                  setInventory((inv) => ({
                    ...inv,
                    gold: (inv.gold || 0) + 1,
                  }));
                } else if (content.kind === "gold") {
                  setInventory((inv) => ({
                    ...inv,
                    gold: (inv.gold || 0) + (content.amount || 1),
                  }));
                } else if (content.kind === "item") {
                  const instance = content.item;
                  setInventory((inv) => {
                    const items = inv.items ? [...inv.items] : [];
                    const tpl =
                      itemTemplates.find((t) => t.id === instance.templateId) ||
                      {};
                    if (tpl.stackable) {
                      const idx = items.findIndex(
                        (i) => i.templateId === instance.templateId
                      );
                      if (idx >= 0) {
                        items[idx] = {
                          ...items[idx],
                          qty: (items[idx].qty || 0) + (instance.qty || 1),
                        };
                      } else {
                        items.push({ ...instance });
                      }
                    } else {
                      items.push({ ...instance });
                    }
                    return { ...inv, items };
                  });
                } else if (content.kind === "bundle") {
                  const g = content.gold || 0;
                  const its = content.items || [];
                  setInventory((inv) => {
                    const items = inv.items ? [...inv.items] : [];
                    its.forEach((instance) => {
                      const tpl =
                        itemTemplates.find(
                          (t) => t.id === instance.templateId
                        ) || {};
                      if (tpl.stackable) {
                        const idx = items.findIndex(
                          (i) => i.templateId === instance.templateId
                        );
                        if (idx >= 0) {
                          items[idx] = {
                            ...items[idx],
                            qty: (items[idx].qty || 0) + (instance.qty || 1),
                          };
                        } else {
                          items.push({ ...instance });
                        }
                      } else {
                        items.push({ ...instance });
                      }
                    });
                    return { ...inv, gold: (inv.gold || 0) + g, items };
                  });
                }
                engine.removeEntity(chestEnt.id);
              }
              // clear tile visually
              setTiles((prev) => {
                const copy = prev.map((r) => r.slice());
                if (copy[ny] && copy[ny][nx] === "c") copy[ny][nx] = ".";
                return copy;
              });
            }
          } else {
            // if it's an enemy tile, start combat instead of moving
            if (cell === "e") {
              // find the enemy entity at that location
              const enemyEnt = entitiesSnapshot.find(
                (e) => e.type === "enemy" && e.x === nx && e.y === ny
              );
              if (enemyEnt) {
                setCombat({
                  enemyId: enemyEnt.id,
                  enemyHp: 10,
                  playerHp: 10,
                  turn: "player",
                  enemyPos: { x: nx, y: ny },
                });
              }
            }
            return;
          }
        }
      });
    });

    // enemy AI system: wander (throttled)
    const enemyPaths = new Map(); // enemyId -> { path: [[x,y],...], tick }
    let engineTick = 0;
    engine.registerSystem((entitiesSnapshot) => {
      engineTick++;
      const playerEnt = entitiesSnapshot.find((e) => e.type === "player");
      const enemies = entitiesSnapshot.filter((e) => e.type === "enemy");
      if (!enemies || enemies.length === 0) return;

      enemies.forEach((en) => {
        if (!en) return;
        const speed = en.speed || 4;
        const nextAt = en.nextMoveAt || 0;
        if (engineTick < nextAt) return; // not time yet

        // helper to check occupancy and walkable
        function isWalkable(nx, ny) {
          if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) return false;
          const currentTiles = tilesRef.current || tiles;
          const cell = currentTiles[ny] && currentTiles[ny][nx];
          if (!cell) return false;
          // disallow moving into walls, collidables, enemies, chests, etc.
          if (cell === "#" || cell === "x" || cell === "e") return false;
          if (!(cell === "." || cell === "d")) return false;
          const occupied = entitiesSnapshot.find(
            (o) => o.x === nx && o.y === ny && o.id !== en.id
          );
          if (occupied) return false;
          return true;
        }

        // wander helper: try random adjacent direction
        function tryWander() {
          const dirs = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ];
          // shuffle
          for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
          }
          for (const d of dirs) {
            const nx = en.x + d[0];
            const ny = en.y + d[1];
            if (isWalkable(nx, ny)) {
              // move enemy entity and update tiles; schedule next move
              engine.updateEntity(en.id, {
                x: nx,
                y: ny,
                nextMoveAt: engineTick + speed,
              });
              setTiles((prev) => {
                const copy = prev.map((r) => r.slice());
                if (copy[en.y] && copy[en.y][en.x] === "e")
                  copy[en.y][en.x] = ".";
                if (copy[ny] && copy[ny][nx] === ".") copy[ny][nx] = "e";
                return copy;
              });
              return true;
            }
          }
          return false;
        }

        // always wander for now (chase disabled)
        tryWander();
      });
    });

    // watch player state and keep engine in sync (small sync loop)
    unwatchRef.current = setInterval(() => {
      // pull latest player entity from engine and mirror to local state
      const p = engine.getEntities().find((e) => e.type === "player");
      if (p) setPlayer({ x: p.x, y: p.y });
    }, 120);
  }, [tiles]);

  // ensure engine and sync interval are cleaned up only on unmount
  useEffect(() => {
    return () => {
      if (unwatchRef.current) {
        clearInterval(unwatchRef.current);
        unwatchRef.current = null;
      }
      if (engineRef.current) {
        try {
          engineRef.current.stop();
        } catch (e) {}
        engineRef.current = null;
      }
    };
  }, []);

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

  // camera start (top-left) for the visible VIEW window; used by EntitySprites
  let camStartX = 0;
  let camStartY = 0;

  function movePlayer(dx, dy) {
    // emit movement intent to engine (engine will validate and update)
    if (combat) return; // block movement during combat
    if (engineRef.current)
      engineRef.current.emitIntent({ type: "move", dx, dy });
  }

  // tactical combat handlers
  function endCombat(removeEnemy, enemyPosParam) {
    const pos = enemyPosParam || (combat && combat.enemyPos);
    if (engineRef.current) {
      // If requested, remove the specific enemy id and any enemy entities at pos
      if (removeEnemy && pos) {
        try {
          if (combat && combat.enemyId)
            engineRef.current.removeEntity(combat.enemyId);
        } catch (e) {}
        try {
          const ents = engineRef.current
            .getEntities()
            .filter(
              (e) => e.type === "enemy" && e.x === pos.x && e.y === pos.y
            );
          ents.forEach((en) => {
            try {
              engineRef.current.removeEntity(en.id);
            } catch (err) {}
          });
        } catch (e) {}
      }

      // Defensive sync: clear any 'e' tiles without backing enemy entity
      try {
        const remainingEnemies = new Set(
          engineRef.current
            .getEntities()
            .filter((e) => e.type === "enemy")
            .map((en) => `${en.x},${en.y}`)
        );
        setTiles((prev) => {
          const copy = prev.map((r) => r.slice());
          for (let y = 0; y < copy.length; y++) {
            for (let x = 0; x < copy[y].length; x++) {
              if (copy[y][x] === "e") {
                const key = `${x},${y}`;
                if (!remainingEnemies.has(key)) copy[y][x] = ".";
              }
            }
          }
          return copy;
        });
      } catch (e) {
        // ignore sync errors
      }
    }
    setCombat(null);
  }

  function handleAttack() {
    if (!combat) return;
    const pos = combat && combat.enemyPos;
    // player attacks: 0-4 damage random
    const dmg = Math.floor(Math.random() * 5);
    // apply enemy damage using functional update to avoid stale reads
    setCombat((prev) => {
      if (!prev) return prev;
      const newEnemyHp = Math.max(0, (prev.enemyHp || 0) - dmg);
      const updated = { ...prev, enemyHp: newEnemyHp, turn: "enemy" };
      if (newEnemyHp <= 0) {
        // schedule cleanup with captured pos
        setTimeout(() => endCombat(true, pos), 300);
      } else {
        // schedule enemy attack after brief delay
        setTimeout(() => {
          setCombat((prev2) => {
            if (!prev2) return prev2;
            const curPlayerHp =
              typeof prev2.playerHp === "number" ? prev2.playerHp : 10;
            const newPlayerHp = Math.max(0, curPlayerHp - 1);
            const updated2 = {
              ...prev2,
              playerHp: newPlayerHp,
              turn: "player",
            };
            if (newPlayerHp <= 0) {
              setTimeout(() => endCombat(false, pos), 300);
            }
            return updated2;
          });
        }, 450);
      }
      return updated;
    });
  }

  function handleDodge() {
    if (!combat) return;
    const pos = combat && combat.enemyPos;
    // enemy attacks next: 50% chance to avoid damage
    const avoided = Math.random() < 0.5;
    if (avoided) {
      // no damage
      setCombat((c) => (c ? { ...c, turn: "player" } : c));
    } else {
      setCombat((prev) => {
        if (!prev) return prev;
        const curPlayerHp =
          typeof prev.playerHp === "number" ? prev.playerHp : 10;
        const newPlayerHp = Math.max(0, curPlayerHp - 1);
        const updated = { ...prev, playerHp: newPlayerHp, turn: "player" };
        if (newPlayerHp <= 0) setTimeout(() => endCombat(false, pos), 300);
        return updated;
      });
    }
  }

  function handleFlee() {
    // simple flee: end combat without removing enemy
    endCombat(false, combat && combat.enemyPos);
  }

  // randomize the 4 red collidable tiles per section
  function randomizeRedObstacles() {
    setTiles((prev) => {
      if (!prev || prev.length === 0) return prev;
      // deep copy and clear previous gray collidables 'x' and enemies 'e'
      const newTiles = prev.map((row) =>
        row.map((cell) => (cell === "x" || cell === "e" ? "." : cell))
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

      // place gray collidable obstacles per section respecting forbidden set
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
              newTiles[ry][rx] = "x";
              placed++;
            }
            tries++;
          }
        }
      }

      // place one stationary enemy 'e' per section (avoid doorways)
      for (let sx = 0; sx < SECTIONS_X; sx++) {
        for (let sy = 0; sy < SECTIONS_Y; sy++) {
          const startX = sx * SECTION_W;
          const startY = sy * SECTION_H;
          let tries = 0;
          let placed = false;
          while (!placed && tries < 500) {
            const ex = startX + Math.floor(Math.random() * SECTION_W);
            const ey = startY + Math.floor(Math.random() * SECTION_H);
            if (newTiles[ey] && newTiles[ey][ex] === ".") {
              // ensure not inside doorway 3x3
              let nearDoor = false;
              for (let dx = -1; dx <= 1 && !nearDoor; dx++) {
                for (let dy = -1; dy <= 1 && !nearDoor; dy++) {
                  const fx = ex + dx;
                  const fy = ey + dy;
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
                newTiles[ey][ex] = "e";
                placed = true;
              }
            }
            tries++;
          }
        }
      }

      // sync engine entities (remove old chests/enemies and recreate from tiles)
      try {
        const engine = engineRef.current;
        if (engine) {
          // remove old chests and enemies
          const oldChests = engine.getEntitiesByType
            ? engine.getEntitiesByType("chest")
            : engine.getEntities().filter((e) => e.type === "chest");
          oldChests.forEach((c) => engine.removeEntity(c.id));
          const oldEnemies = engine.getEntitiesByType
            ? engine.getEntitiesByType("enemy")
            : engine.getEntities().filter((e) => e.type === "enemy");
          oldEnemies.forEach((en) => engine.removeEntity(en.id));

          // recreate from newTiles
          for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
              const cell = newTiles[y][x];
              if (cell === "c") {
                const chestUid = uid(10);
                const goldAmount = Math.floor(Math.random() * 10) + 1;
                const itemsInside = [];
                const itemCount = Math.floor(Math.random() * 3);
                const pool = itemTemplates.filter((t) => t.id !== "gold");
                for (let k = 0; k < itemCount; k++) {
                  const tpl = pool[Math.floor(Math.random() * pool.length)];
                  itemsInside.push({
                    instanceId: uid(10),
                    templateId: tpl.id,
                    qty: 1,
                  });
                }
                engine.addEntity({
                  type: "chest",
                  x,
                  y,
                  uid: chestUid,
                  content: {
                    kind: "bundle",
                    gold: goldAmount,
                    items: itemsInside,
                  },
                });
              } else if (cell === "e") {
                engine.addEntity({
                  type: "enemy",
                  x,
                  y,
                  state: "wander",
                  speed: 8,
                  nextMoveAt: 8,
                  detectRange: 6,
                });
              }
            }
          }
        }
      } catch (err) {
        // swallow sync errors
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
                  <>
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
                  </>
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
      {combat ? (
        <TacticalOverlay
          playerHp={combat.playerHp}
          enemyHp={combat.enemyHp}
          onAttack={handleAttack}
          onDodge={handleDodge}
          onClose={handleFlee}
        />
      ) : null}
    </RN.SafeAreaView>
  );
}

const styles = CommonStyles;
