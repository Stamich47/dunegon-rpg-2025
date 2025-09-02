import React from "react";
import { View } from "react-native";
import * as RN from "react-native";
import { colors } from "../styles/common";

export default function Tile({ cell, isPlayer, size, pulseAnim }) {
  if (cell === "c") {
    const interp = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#e5b800", "#ff9f1c"],
    });
    return (
      <RN.Animated.View
        style={{
          width: size,
          height: size,
          backgroundColor: interp,
          borderWidth: 0.6,
          borderColor: colors.chestBorder,
        }}
      />
    );
  }
  const bg = isPlayer
    ? colors.player
    : cell === "."
    ? colors.floor
    : cell === "x"
    ? colors.collidable
    : cell === "e"
    ? colors.enemy
    : cell === "d"
    ? colors.floor
    : colors.wall;

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        borderWidth: cell === "d" ? 2 : 0.25,
        borderColor: cell === "d" ? colors.doorwayBorder : "rgba(0,0,0,0.2)",
      }}
    />
  );
}
