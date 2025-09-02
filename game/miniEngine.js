// Tiny in-repo game engine shim: entity store + simple tick loop
// Purpose: give a small "engine-like" API (addEntity, removeEntity, updateEntity, systems)
// without adding external dependencies. Safe to use as a scaffold for migrating to
// react-native-game-engine later.

export default function createEngine(tickMs = 200) {
  let nextId = 1;
  const entities = new Map();
  const systems = [];
  const intents = [];
  let running = false;
  let iv = null;

  function addEntity(obj = {}) {
    const id = String(nextId++);
    entities.set(id, { id, ...obj });
    return id;
  }

  function removeEntity(id) {
    return entities.delete(id);
  }

  function updateEntity(id, patch = {}) {
    const e = entities.get(id);
    if (!e) return null;
    entities.set(id, { ...e, ...patch });
    return entities.get(id);
  }

  function getEntities() {
    return Array.from(entities.values());
  }

  function getEntitiesByType(type) {
    return getEntities().filter((e) => e.type === type);
  }

  function registerSystem(fn) {
    systems.push(fn);
  }

  function emitIntent(intent) {
    intents.push(intent);
  }

  function consumeIntents() {
    const copy = intents.slice();
    intents.length = 0;
    return copy;
  }

  function start() {
    if (running) return;
    running = true;
    let last = Date.now();
    iv = setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      const snapshot = getEntities();
      systems.forEach((s) => {
        try {
          s(snapshot, dt);
        } catch (err) {
          // swallow errors from systems to keep loop alive
          // console.warn('engine system error', err);
        }
      });
    }, tickMs);
  }

  function stop() {
    if (iv) clearInterval(iv);
    running = false;
    iv = null;
  }

  return {
    addEntity,
    removeEntity,
    updateEntity,
    getEntities,
    getEntitiesByType,
    registerSystem,
    emitIntent,
    consumeIntents,
    start,
    stop,
  };
}
