import React from "react";
import { View, Text } from "react-native";
import CommonStyles from "../styles/common";

export default function InventoryOverlay({ inventory }) {
  return (
    <View style={CommonStyles.legendContainer} pointerEvents="box-none">
      <View style={CommonStyles.legendInner}>
        <Text style={[CommonStyles.legendText, { fontWeight: "700" }]}>
          Inventory
        </Text>
        <View style={{ height: 8 }} />
        <View style={CommonStyles.legendRow}>
          <Text style={CommonStyles.legendText}>
            Gold: {inventory.gold || 0}
          </Text>
        </View>
      </View>
    </View>
  );
}
