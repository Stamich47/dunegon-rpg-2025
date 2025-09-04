import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";

export default function TacticalOverlay({
  playerHp,
  playerMaxHp = 10,
  enemyHp,
  enemyMaxHp = 10,
  onAttack,
  onDodge,
  onClose,
  message,
  playerHitSignal = 0,
  enemyHitSignal = 0,
  turn = "player",
}) {
  const playerGlow = useRef(new Animated.Value(0)).current;
  const enemyGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // run quick red glow when player is hit
    if (playerHitSignal > 0) {
      Animated.sequence([
        Animated.timing(playerGlow, {
          toValue: 1,
          duration: 120,
          useNativeDriver: false,
        }),
        Animated.timing(playerGlow, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [playerHitSignal]);

  useEffect(() => {
    if (enemyHitSignal > 0) {
      Animated.sequence([
        Animated.timing(enemyGlow, {
          toValue: 1,
          duration: 120,
          useNativeDriver: false,
        }),
        Animated.timing(enemyGlow, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [enemyHitSignal]);
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: "90%",
          height: 260,
          backgroundColor: "#111",
          borderRadius: 10,
          padding: 12,
          flexDirection: "row",
        }}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Animated.View
            style={{
              width: 96,
              height: 96,
              borderRadius: 12,
              backgroundColor: "#fbbf24",
              marginBottom: 8,
              borderWidth: playerGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 6],
              }),
              borderColor: playerGlow.interpolate({
                inputRange: [0, 1],
                outputRange: ["transparent", "#ef4444"],
              }),
            }}
          />
          <Text style={{ color: "#fff", marginBottom: 6 }}>You</Text>
          <View
            style={{
              width: "80%",
              height: 12,
              backgroundColor: "#333",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${
                  (Math.max(0, playerHp) / Math.max(1, playerMaxHp)) * 100
                }%`,
                height: "100%",
                backgroundColor: "#84cc16",
              }}
            />
          </View>
          <Text style={{ color: "#fff", marginTop: 6 }}>
            {playerHp} / {playerMaxHp} HP
          </Text>
        </View>

        <View
          style={{ width: 1, backgroundColor: "#222", marginHorizontal: 12 }}
        />

        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Animated.View
            style={{
              width: 96,
              height: 96,
              borderRadius: 12,
              backgroundColor: "#ef4444",
              marginBottom: 8,
              borderWidth: enemyGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 6],
              }),
              borderColor: enemyGlow.interpolate({
                inputRange: [0, 1],
                outputRange: ["transparent", "#f87171"],
              }),
            }}
          />
          <Text style={{ color: "#fff", marginBottom: 6 }}>Enemy</Text>
          <View
            style={{
              width: "80%",
              height: 12,
              backgroundColor: "#333",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${
                  (Math.max(0, enemyHp) / Math.max(1, enemyMaxHp)) * 100
                }%`,
                height: "100%",
                backgroundColor: "#f87171",
              }}
            />
          </View>
          <Text style={{ color: "#fff", marginTop: 6 }}>
            {enemyHp} / {enemyMaxHp} HP
          </Text>
        </View>
      </View>

      {/* message area (render under the modal box, above action buttons) */}
      {message ? (
        <View style={{ width: "90%", marginTop: 12, alignItems: "center" }}>
          <Text style={{ color: "#fff" }}>{message}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: 12, flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          onPress={turn === "player" ? onAttack : undefined}
          style={{
            padding: 12,
            backgroundColor: turn === "player" ? "#059669" : "#065f46",
            borderRadius: 8,
            marginRight: 8,
            opacity: turn === "player" ? 1 : 0.6,
          }}
        >
          <Text style={{ color: "#fff" }}>Attack</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={turn === "player" ? onDodge : undefined}
          style={{
            padding: 12,
            backgroundColor: turn === "player" ? "#b45309" : "#92400e",
            borderRadius: 8,
            opacity: turn === "player" ? 1 : 0.6,
          }}
        >
          <Text style={{ color: "#fff" }}>Dodge</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          style={{
            padding: 12,
            backgroundColor: "#374151",
            borderRadius: 8,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: "#fff" }}>Flee</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
