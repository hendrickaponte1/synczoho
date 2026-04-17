import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

// Scene 2 (150-330f, 6s): Two systems disconnected → connected
export const Scene2Connect: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inAnim = spring({ frame, fps, config: { damping: 18 } });
  const outAnim = interpolate(frame, [160, 180], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(inAnim, outAnim);

  // Connection beam fills 30→90
  const beam = interpolate(frame, [40, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Pulse traveling along the beam after connect
  const pulsePos = ((frame - 90) / 30) % 1;
  const pulseVisible = frame > 90 && frame < 160;

  // Text appears after connection
  const textIn = spring({ frame: frame - 100, fps, config: { damping: 18 } });

  const cardStyle: React.CSSProperties = {
    width: 380,
    height: 260,
    background: COLORS.bgSoft,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 24,
    padding: 32,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: `0 30px 80px ${COLORS.primary}22`,
  };

  return (
    <AbsoluteFill style={{ fontFamily, opacity, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, position: "relative" }}>
        {/* Tiendanube card */}
        <div
          style={{
            ...cardStyle,
            transform: `translateX(${interpolate(inAnim, [0, 1], [-120, 0])}px)`,
            opacity: inAnim,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#00B0E3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>T</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>Tiendanube</span>
          </div>
          <div>
            <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 8 }}>Tu tienda online</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Productos", "Pedidos", "Clientes"].map((t) => (
                <span key={t} style={{ fontSize: 14, padding: "6px 12px", background: `${COLORS.primary}1F`, color: COLORS.primaryGlow, borderRadius: 8 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Beam container */}
        <div style={{ width: 280, height: 4, position: "relative", margin: "0 -2px" }}>
          <div style={{ position: "absolute", inset: 0, background: COLORS.border, borderRadius: 2 }} />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: 4,
              width: `${beam * 100}%`,
              background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
              borderRadius: 2,
              boxShadow: `0 0 20px ${COLORS.accent}`,
            }}
          />
          {pulseVisible && (
            <div
              style={{
                position: "absolute",
                top: -6,
                left: `${pulsePos * 100}%`,
                width: 16,
                height: 16,
                borderRadius: 999,
                background: COLORS.accent,
                boxShadow: `0 0 24px ${COLORS.accent}`,
                transform: "translateX(-50%)",
              }}
            />
          )}
        </div>

        {/* Zoho card */}
        <div
          style={{
            ...cardStyle,
            transform: `translateX(${interpolate(inAnim, [0, 1], [120, 0])}px)`,
            opacity: inAnim,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E42527", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff" }}>Z</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>Zoho Inventory</span>
          </div>
          <div>
            <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 8 }}>Tu sistema de gestión</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Items", "Stock", "Órdenes"].map((t) => (
                <span key={t} style={{ fontSize: 14, padding: "6px 12px", background: `${COLORS.accent}1F`, color: COLORS.accent, borderRadius: 8 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 80,
          textAlign: "center",
          transform: `translateY(${interpolate(textIn, [0, 1], [30, 0])}px)`,
          opacity: textIn,
        }}
      >
        <h2 style={{ fontSize: 84, fontWeight: 800, color: COLORS.text, margin: 0, letterSpacing: -1.5 }}>
          Conectá una vez. <span style={{ color: COLORS.accent }}>Sincronizá para siempre.</span>
        </h2>
      </div>
    </AbsoluteFill>
  );
};
