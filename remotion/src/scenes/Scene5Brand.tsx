import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

// Scene 5 (750-900f, 5s): Brand close
export const Scene5Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoIn = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const titleIn = spring({ frame: frame - 18, fps, config: { damping: 18 } });
  const taglineIn = spring({ frame: frame - 40, fps, config: { damping: 18 } });
  const urlIn = spring({ frame: frame - 65, fps, config: { damping: 18 } });

  // Subtle logo float
  const float = Math.sin(frame / 20) * 4;

  // Final glow pulse
  const pulse = interpolate(frame, [80, 110, 140], [0.3, 0.8, 0.3], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily, justifyContent: "center", alignItems: "center" }}>
      {/* Glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: 999,
          background: `radial-gradient(circle, ${COLORS.primary}55 0%, transparent 60%)`,
          filter: "blur(40px)",
          opacity: pulse,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -75%)",
        }}
      />

      <div style={{ textAlign: "center", position: "relative" }}>
        <div
          style={{
            transform: `scale(${logoIn}) translateY(${float}px)`,
            opacity: logoIn,
            marginBottom: 32,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 180, height: 180, borderRadius: 36, overflow: "hidden", boxShadow: `0 20px 60px ${COLORS.primary}66` }}>
            <Img src={staticFile("images/app-icon.png")} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>

        <h1
          style={{
            fontSize: 140,
            fontWeight: 800,
            color: COLORS.text,
            margin: 0,
            letterSpacing: -3,
            transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
            opacity: titleIn,
          }}
        >
          Tienda<span style={{ color: COLORS.primaryGlow }}>Sync</span>
        </h1>

        <p
          style={{
            fontSize: 36,
            color: COLORS.textMuted,
            marginTop: 24,
            marginBottom: 0,
            transform: `translateY(${interpolate(taglineIn, [0, 1], [20, 0])}px)`,
            opacity: taglineIn,
            fontWeight: 400,
          }}
        >
          Tiendanube <span style={{ color: COLORS.accent, margin: "0 12px" }}>↔</span> Zoho Inventory
        </p>

        <div
          style={{
            marginTop: 50,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "18px 36px",
            background: `${COLORS.primary}1F`,
            border: `1px solid ${COLORS.primary}66`,
            borderRadius: 999,
            transform: `translateY(${interpolate(urlIn, [0, 1], [20, 0])}px) scale(${urlIn})`,
            opacity: urlIn,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.success, boxShadow: `0 0 12px ${COLORS.success}` }} />
          <span style={{ fontSize: 26, color: COLORS.text, fontWeight: 600 }}>synczoho.lovable.app</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
