import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import CommonStyles from "../styles/common";
import { items as itemTemplates } from "../data/items";

export default function InventoryOverlay({ inventory, onEquip }) {
  const weaponSlot = inventory._slots && inventory._slots.weapon;
  const armorSlot = inventory._slots && inventory._slots.armor;
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

        <View style={CommonStyles.legendRow}>
          <Text style={CommonStyles.legendText}>Weapon: </Text>
          <Text style={CommonStyles.legendText}>
            {weaponSlot
              ? (
                  itemTemplates.find((t) => t.id === weaponSlot.templateId) ||
                  {}
                ).icon
              : "-"}
          </Text>
        </View>
        <View style={CommonStyles.legendRow}>
          <Text style={CommonStyles.legendText}>Armor: </Text>
          <Text style={CommonStyles.legendText}>
            {armorSlot
              ? (itemTemplates.find((t) => t.id === armorSlot.templateId) || {})
                  .icon
              : "-"}
          </Text>
        </View>

        <View style={{ height: 8 }} />
        {(inventory.items || []).length > 0 ? (
          (inventory.items || []).map((it) => {
            const tpl = itemTemplates.find((t) => t.id === it.templateId) || {};
            const canEquip =
              tpl.equipSlot === "hand" || tpl.equipSlot === "body";
            return (
              <TouchableOpacity
                key={it.instanceId}
                style={CommonStyles.legendRow}
                onPress={() => canEquip && onEquip && onEquip(it)}
              >
                <Text style={CommonStyles.legendText}>
                  {tpl.icon || "?"} {tpl.name || it.templateId} x{it.qty}{" "}
                  {canEquip ? "(tap to equip)" : ""}
                </Text>
              </TouchableOpacity>
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
