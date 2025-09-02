import React from "react";
import { View, Text } from "react-native";
import CommonStyles from "../styles/common";
import { items as itemTemplates } from "../data/items";

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
        <View style={{ height: 8 }} />
        {(inventory.items || []).length > 0 ? (
          (inventory.items || []).map((it) => {
            const tpl = itemTemplates.find((t) => t.id === it.templateId) || {};
            return (
              <View style={CommonStyles.legendRow} key={it.instanceId}>
                <Text style={CommonStyles.legendText}>
                  {tpl.icon || "?"} {tpl.name || it.templateId} x{it.qty}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={CommonStyles.legendRow}>
            <Text style={CommonStyles.legendText}>No items</Text>
          </View>
        )}
      </View>
    </View>
  );
}
