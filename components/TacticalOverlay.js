import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function TacticalOverlay({
  playerHp,
  enemyHp,
  onAttack,
  onDodge,
  onClose,
}) {
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
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 12,
              backgroundColor: "#fbbf24",
              marginBottom: 8,
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
                width: `${(playerHp / 10) * 100}%`,
                height: "100%",
                backgroundColor: "#84cc16",
              }}
            />
          </View>
          <Text style={{ color: "#fff", marginTop: 6 }}>
            {playerHp} / 10 HP
          </Text>
        </View>

        <View
          style={{ width: 1, backgroundColor: "#222", marginHorizontal: 12 }}
        />

        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 12,
              backgroundColor: "#ef4444",
              marginBottom: 8,
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
                width: `${(enemyHp / 10) * 100}%`,
                height: "100%",
                backgroundColor: "#f87171",
              }}
            />
          </View>
          <Text style={{ color: "#fff", marginTop: 6 }}>{enemyHp} / 10 HP</Text>
        </View>
      </View>

      <View style={{ marginTop: 12, flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          onPress={onAttack}
          style={{
            padding: 12,
            backgroundColor: "#059669",
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Text style={{ color: "#fff" }}>Attack</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDodge}
          style={{ padding: 12, backgroundColor: "#b45309", borderRadius: 8 }}
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
