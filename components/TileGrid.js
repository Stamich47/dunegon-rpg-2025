import React from "react";
import { View } from "react-native";
import Tile from "./Tile";

export default function TileGrid({
  tiles,
  player,
  VIEW_W,
  VIEW_H,
  startX,
  startY,
  size,
  pulseAnim,
}) {
  const rows = [];
  for (let vy = 0; vy < VIEW_H; vy++) {
    const ry = startY + vy;
    const cols = [];
    for (let vx = 0; vx < VIEW_W; vx++) {
      const rx = startX + vx;
      const cell = (tiles[ry] && tiles[ry][rx]) || "#";
      const isPlayer = player.x === rx && player.y === ry;
      cols.push(
        <Tile
          key={`${rx}-${ry}`}
          cell={cell}
          isPlayer={isPlayer}
          size={size}
          pulseAnim={pulseAnim}
        />
      );
    }
    rows.push(
      <View key={`row-${vy}`} style={{ flexDirection: "row", height: size }}>
        {cols}
      </View>
    );
  }
  return rows;
}
