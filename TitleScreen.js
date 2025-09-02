import { useState, useRef, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, TextInput } from "react-native";
import * as RN from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Torch sprite sheet config
const TORCH_FRAME_WIDTH = 32; // Each frame width
const TORCH_FRAME_HEIGHT = 32; // Each frame height
const TORCH_FRAMES = 6; // 3 columns x 2 rows
const TORCH_ANIMATION_SPEED = 100; // ms per frame
const TORCH_COLUMNS = 3;
const TORCH_ROWS = 2;

export default function TitleScreen() {
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(frame);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => {
    let lastTime = Date.now();
    let running = true;
    function animate() {
      if (!running) return;
      const now = Date.now();
      if (now - lastTime > TORCH_ANIMATION_SPEED) {
        frameRef.current = (frameRef.current + 1) % TORCH_FRAMES;
        setFrame(frameRef.current);
        lastTime = now;
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return () => {
      running = false;
    };
  }, []);

  // Background image path (replace with your own cave/dungeon image)
  const backgroundSource = require("./assets/main_screen/cave_bg.jpg"); // Add cave_bg.jpg to assets/main_screen

  // Calculate column and row for current frame
  const col = frame % TORCH_COLUMNS;
  const row = Math.floor(frame / TORCH_COLUMNS);
  const [showGame, setShowGame] = useState(false);

  if (showGame) {
    const GameScreen = require("./GameScreen").default;
    return <GameScreen onExit={() => setShowGame(false)} />;
  }

  return (
    <View style={styles.container}>
      <Image source={backgroundSource} style={styles.background} />
      <View style={styles.dim} />
      <View style={styles.overlay}>
        <View style={styles.topThird}>
          <Text style={styles.title}>Embers of Avalon</Text>
          <Text style={styles.subtitle}>
            Uncover ancient dungeons, light your path, become a legend.
          </Text>
        </View>

        {/* Auth box with email/password fields and options (UI-only) */}
        <View style={styles.authBox}>
          <Text style={styles.authTitle}>Sign up / Sign in</Text>
          <Text style={styles.authSubtitle}>
            Enter your email and password or continue with Google
          </Text>

          <TextInput
            style={styles.authInput}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.authInput}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            autoCapitalize="none"
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionButton]} activeOpacity={0.8}>
              <Text style={styles.actionButtonText}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.signInButton]}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.authButton, styles.googleButton]}
            activeOpacity={0.9}
          >
            <View style={styles.googleIcon}>
              <FontAwesome name="google" size={18} color="#DB4437" />
            </View>
            <Text style={[styles.authButtonText, styles.googleButtonText]}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Separate Start Game container below auth box */}
        <View style={styles.startContainer}>
          <TouchableOpacity
            style={styles.startActionButton}
            activeOpacity={0.9}
            onPress={() => setShowGame(true)}
          >
            <Text style={styles.startActionText}>Start Game</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topHalf}>
          <View style={styles.torchRow}>
            {[0, 1].map((i) => (
              <View key={i} style={styles.torchSpriteContainer}>
                <View
                  style={{
                    width: TORCH_FRAME_WIDTH,
                    height: TORCH_FRAME_HEIGHT,
                    overflow: "hidden",
                    backgroundColor: "transparent",
                  }}
                >
                  <Image
                    source={require("./assets/main_screen/Torch_Sheet.png")}
                    style={{
                      position: "absolute",
                      left: -col * TORCH_FRAME_WIDTH,
                      top: -row * TORCH_FRAME_HEIGHT,
                      width: TORCH_FRAME_WIDTH * TORCH_COLUMNS,
                      height: TORCH_FRAME_HEIGHT * TORCH_ROWS,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
        {/* ...other content for bottom half can go here... */}
      </View>
    </View>
  );
}

const styles = RN.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181818",
    position: "relative",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    zIndex: 0,
  },
  overlay: {
    flex: 1,
    zIndex: 1,
  },
  dim: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 0,
  },
  topThird: {
    position: "absolute",
    top: "20%",
    height: "20%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  topHalf: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
    letterSpacing: 2,
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 32,
    textAlign: "center",
  },
  authBox: {
    position: "absolute",
    top: "40%",
    width: "90%",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    zIndex: 2,
  },
  startContainer: {
    position: "absolute",
    bottom: "15%",
    width: "100%",
    alignItems: "center",
    zIndex: 2,
  },
  startActionButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  startActionText: {
    color: "#111",
    fontWeight: "700",
  },
  authTitle: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 6,
  },
  authSubtitle: {
    color: "#ddd",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  authButtons: {
    width: "100%",
  },
  authButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  googleButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    width: "100%",
  },
  googleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  googleIconText: {
    color: "#444",
    fontWeight: "700",
  },
  googleButtonText: {
    color: "#222",
    fontWeight: "600",
  },
  authButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  authInput: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.35)",
    color: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#444",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  signInButton: {
    backgroundColor: "#222",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  torchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 80,
    marginBottom: 16,
  },
  torchSpriteContainer: {
    width: TORCH_FRAME_WIDTH,
    height: TORCH_FRAME_HEIGHT,
    overflow: "hidden",
    backgroundColor: "transparent",
    marginHorizontal: 8,
  },
});
