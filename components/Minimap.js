import React from "react";
import { View, StyleSheet } from "react-native";

export default function Minimap({
  tiles = [],
  player,
  miniTile = 1,
  miniWidth = 0,
  miniHeight = 0,
  style,
}) {
  if (!tiles || tiles.length === 0) return null;

  return (
    <View style={style} pointerEvents="none">
      <View
        style={[styles.minimapInner, { width: miniWidth, height: miniHeight }]}
      >
        {tiles.map((row, y) => (
          <View
            key={`r-${y}`}
            style={{ flexDirection: "row", height: miniTile }}
          >
            {row.map((cell, x) => {
              const isPlayer = player && player.x === x && player.y === y;
              if (cell === "d") {
                // doorway: outer blue border, inner green fill (smaller)
                const borderSize = 1; // 1px border in minimap scale
                const inner = Math.max(1, miniTile - borderSize * 2);
                return (
                  <View
                    key={`c-${x}-${y}`}
                    style={{
                      width: miniTile,
                      height: miniTile,
                      backgroundColor: "#3b82f6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: inner,
                        height: inner,
                        backgroundColor: "#2b7a2b",
                      }}
                    />
                  </View>
                );
              }
              const bg = isPlayer
                ? "#ff5c5c"
                : cell === "."
                ? "#2b7a2b"
                : cell === "r"
                ? "#ff0000"
                : "#111111";
              return (
                <View
                  key={`c-${x}-${y}`}
                  style={{
                    width: miniTile,
                    height: miniTile,
                    backgroundColor: bg,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  minimapInner: {
    backgroundColor: "#000",
    borderRadius: 2,
    overflow: "hidden",
  },
});
