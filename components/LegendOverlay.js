import React from "react";
import { View, Text } from "react-native";
import CommonStyles from "../styles/common";

export default function LegendOverlay() {
  return (
    <View style={CommonStyles.legendContainer} pointerEvents="box-none">
      <View style={CommonStyles.legendInner}>
        <View style={CommonStyles.legendRow}>
          <View style={[CommonStyles.swatch, { backgroundColor: "#2b7a2b" }]} />
          <Text style={CommonStyles.legendText}>Floor</Text>
        </View>
        <View style={CommonStyles.legendRow}>
          <View style={[CommonStyles.swatch, { backgroundColor: "#111111" }]} />
          <Text style={CommonStyles.legendText}>Wall</Text>
        </View>
        <View style={CommonStyles.legendRow}>
          <View style={[CommonStyles.swatch, { backgroundColor: "#ff0000" }]} />
          <Text style={CommonStyles.legendText}>Collidable</Text>
        </View>
        <View style={CommonStyles.legendRow}>
          <View
            style={[
              CommonStyles.swatch,
              {
                backgroundColor: "#2b7a2b",
                borderWidth: 2,
                borderColor: "#3b82f6",
              },
            ]}
          />
          <Text style={CommonStyles.legendText}>Doorway</Text>
        </View>
        <View style={CommonStyles.legendRow}>
          <View style={[CommonStyles.swatch, { backgroundColor: "#ffd166" }]} />
          <Text style={CommonStyles.legendText}>Player</Text>
        </View>
        <View style={CommonStyles.legendRow}>
          <View style={[CommonStyles.swatch, { backgroundColor: "#ffd700" }]} />
          <Text style={CommonStyles.legendText}>Gold</Text>
        </View>
      </View>
    </View>
  );
}
