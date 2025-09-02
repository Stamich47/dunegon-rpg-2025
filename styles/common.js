import { StyleSheet } from "react-native";

export const colors = {
  background: "#111",
  headerBg: "#333",
  player: "#ffd166",
  chest: "#ffd700",
  chestBorder: "#b86b00",
  floor: "#2b7a2b",
  wall: "#111111",
  collidable: "#9ca3af",
  enemy: "#ff0000",
  doorwayBorder: "#3b82f6",
};

const CommonStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  backButton: {
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  backText: { color: "#fff" },

  dpadContainer: {
    position: "absolute",
    right: 18,
    bottom: 18,
    alignItems: "center",
  },
  dpadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dpadButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 10,
    borderRadius: 8,
    margin: 6,
  },
  dpadText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  minimapContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 6,
    overflow: "hidden",
  },
  minimapInner: {
    backgroundColor: "#000",
    borderRadius: 2,
    overflow: "hidden",
  },
  minimapAbsolute: {
    position: "absolute",
    top: 120,
    right: 8,
    padding: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 6,
    zIndex: 50,
  },

  legendContainer: {
    position: "absolute",
    top: 120,
    right: 150,
    zIndex: 60,
  },
  legendInner: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 8,
    borderRadius: 8,
  },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  swatch: { width: 16, height: 16, marginRight: 8, borderRadius: 2 },
  legendText: { color: "#fff", fontSize: 12 },
});

export default CommonStyles;
