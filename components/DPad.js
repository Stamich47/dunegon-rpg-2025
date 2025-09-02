import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import CommonStyles from "../styles/common";

export default function DPad({ onMove }) {
  return (
    <View style={CommonStyles.dpadContainer} pointerEvents="box-none">
      <View style={CommonStyles.dpadRow}>
        <TouchableOpacity
          style={CommonStyles.dpadButton}
          onPress={() => onMove(0, -1)}
        >
          <Text style={CommonStyles.dpadText}>↑</Text>
        </TouchableOpacity>
      </View>
      <View style={CommonStyles.dpadRow}>
        <TouchableOpacity
          style={CommonStyles.dpadButton}
          onPress={() => onMove(-1, 0)}
        >
          <Text style={CommonStyles.dpadText}>←</Text>
        </TouchableOpacity>
        <View style={{ width: 18 }} />
        <TouchableOpacity
          style={CommonStyles.dpadButton}
          onPress={() => onMove(1, 0)}
        >
          <Text style={CommonStyles.dpadText}>→</Text>
        </TouchableOpacity>
      </View>
      <View style={CommonStyles.dpadRow}>
        <TouchableOpacity
          style={CommonStyles.dpadButton}
          onPress={() => onMove(0, 1)}
        >
          <Text style={CommonStyles.dpadText}>↓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
