import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";

export default function EntitySprites({
  engineRef,
  startX,
  startY,
  size,
  VIEW_W,
  VIEW_H,
}) {
  const animsRef = useRef(new Map());
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!engineRef || !engineRef.current) return;
    let alive = true;

    function ensureEntity(e) {
      if (!animsRef.current.has(e.id)) {
        const initX = (e.x - startX) * size;
        const initY = (e.y - startY) * size;
        const v = new Animated.ValueXY({ x: initX, y: initY });
        animsRef.current.set(e.id, { v, type: e.type });
      }
    }

    // initialize
    const ents0 = engineRef.current
      .getEntities()
      .filter((e) => e.type === "player" || e.type === "enemy");
    ents0.forEach(ensureEntity);

    const iv = setInterval(() => {
      if (!alive) return;
      if (!engineRef.current) return;
      const ents = engineRef.current
        .getEntities()
        .filter((e) => e.type === "player" || e.type === "enemy");
      const seen = new Set();
      ents.forEach((e) => {
        seen.add(e.id);
        ensureEntity(e);
        const rec = animsRef.current.get(e.id);
        if (!rec) return;
        const target = { x: (e.x - startX) * size, y: (e.y - startY) * size };
        Animated.timing(rec.v, {
          toValue: target,
          duration: 160,
          useNativeDriver: false,
        }).start();
      });
      // remove stale entities
      Array.from(animsRef.current.keys()).forEach((id) => {
        if (!seen.has(id)) animsRef.current.delete(id);
      });
      setTick((t) => t + 1);
    }, 80);

    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [engineRef, startX, startY, size]);

  const entries = Array.from(animsRef.current.entries());
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: VIEW_W * size,
        height: VIEW_H * size,
        pointerEvents: "none",
      }}
    >
      {entries.map(([id, rec]) => {
        const color = rec.type === "player" ? "#3b82f6" : "#ef4444"; // blue for player, red for enemy
        const spriteStyle = {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: Math.max(2, Math.floor(size / 6)),
          backgroundColor: color,
          opacity: 0.95,
        };
        return (
          <Animated.View key={id} style={[rec.v.getLayout(), spriteStyle]} />
        );
      })}
    </View>
  );
}
