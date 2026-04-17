import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

// Scene 5: Brand close — "Zoho Sync" powered by Zoho Inventory
export const Scene5Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const taglineIn = spring({ frame: frame - 22, fps, config: { damping: 18 } });
  const logoIn = spring({ frame: frame - 45, fps, config: { damping: 18 } });
  const urlIn = spring({ frame: frame - 70, fps, config: { damping: 18 } });

  // Final glow pulse
  const pulse = interpolate(frame, [80, 110, 140], [0.3, 0.8, 0.3], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily, justifyContent: "center", alignItems: "center" }}>
      {/* Glow background */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: 999,
          background: `radial-gradient(circle, ${COLORS.primary}55 0%, transparent 60%)`,
          filter: "blur(40px)",
          opacity: pulse,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div style={{ textAlign: "center", position: "relative" }}>
        <h1
          style={{
            fontSize: 180,
            fontWeight: 800,
            color: COLORS.text,
            margin: 0,
            letterSpacing: -4,
            transform: `scale(${interpolate(titleIn, [0, 1], [0.85, 1])}) translateY(${interpolate(titleIn, [0, 1], [20, 0])}px)`,
            opacity: titleIn,
            lineHeight: 1,
          }}
        >
          Zoho<span style={{ color: COLORS.primaryGlow }}>Sync</span>
        </h1>

        <p
          style={{
            fontSize: 34,
            color: COLORS.textMuted,
            marginTop: 28,
            marginBottom: 0,
            transform: `translateY(${interpolate(taglineIn, [0, 1], [20, 0])}px)`,
            opacity: taglineIn,
            fontWeight: 400,
          }}
        >
          Tu tienda y tu inventario, siempre en sintonía.
        </p>

        {/* Powered by Zoho Inventory logo */}
        <div
          style={{
            marginTop: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            transform: `translateY(${interpolate(logoIn, [0, 1], [20, 0])}px)`,
            opacity: logoIn,
          }}
        >
          <div style={{ fontSize: 16, color: COLORS.textMuted, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600 }}>
            Integración oficial con
          </div>
          <div
            style={{
              padding: "20px 40px",
              background: "#FFFFFF",
              borderRadius: 20,
              boxShadow: `0 20px 60px ${COLORS.primary}33`,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Img
              src={staticFile("images/zoho-inventory-logo.png")}
              style={{ height: 80, width: "auto", display: "block" }}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 32px",
            background: `${COLORS.primary}1F`,
            border: `1px solid ${COLORS.primary}66`,
            borderRadius: 999,
            transform: `translateY(${interpolate(urlIn, [0, 1], [20, 0])}px) scale(${urlIn})`,
            opacity: urlIn,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.success, boxShadow: `0 0 12px ${COLORS.success}` }} />
          <span style={{ fontSize: 24, color: COLORS.text, fontWeight: 600 }}>synczoho.lovable.app</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
