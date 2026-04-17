import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

// Scene 1 (0-150f, 5s): The chaos — manual sync problem
export const Scene1Chaos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [130, 150], [1, 0], { extrapolateLeft: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  // Word reveals
  const word1 = spring({ frame: frame - 10, fps, config: { damping: 15 } });
  const word2 = spring({ frame: frame - 35, fps, config: { damping: 15 } });
  const word3 = spring({ frame: frame - 60, fps, config: { damping: 12, stiffness: 120 } });

  // Floating "chaos" tags
  const tags = ["stock.xlsx", "pedido #4521", "actualizar precio", "¡sin stock!", "¿factura?"];

  return (
    <AbsoluteFill style={{ fontFamily, opacity, padding: 120, justifyContent: "center" }}>
      {/* Floating chaos tags in background */}
      {tags.map((t, i) => {
        const delay = i * 6;
        const appear = spring({ frame: frame - 5 - delay, fps, config: { damping: 20 } });
        const drift = Math.sin((frame + i * 30) / 25) * 8;
        const positions = [
          { left: "8%", top: "15%", rot: -6 },
          { left: "70%", top: "12%", rot: 4 },
          { left: "75%", top: "75%", rot: -3 },
          { left: "5%", top: "72%", rot: 5 },
          { left: "45%", top: "82%", rot: -2 },
        ];
        const p = positions[i];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.left,
              top: p.top,
              transform: `translateY(${drift}px) rotate(${p.rot}deg) scale(${appear})`,
              opacity: appear * 0.55,
              padding: "10px 18px",
              background: COLORS.bgSoft,
              border: `1px solid ${COLORS.warning}55`,
              borderRadius: 8,
              color: COLORS.warning,
              fontSize: 22,
              fontWeight: 600,
              fontFamily: "monospace",
            }}
          >
            {t}
          </div>
        );
      })}

      <div style={{ maxWidth: 1300 }}>
        <div
          style={{
            display: "inline-block",
            padding: "8px 16px",
            background: `${COLORS.warning}1F`,
            border: `1px solid ${COLORS.warning}55`,
            borderRadius: 999,
            color: COLORS.warning,
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 32,
            transform: `translateY(${interpolate(word1, [0, 1], [20, 0])}px)`,
            opacity: word1,
          }}
        >
          ● El problema
        </div>
        <h1
          style={{
            fontSize: 110,
            fontWeight: 800,
            color: COLORS.text,
            lineHeight: 1.05,
            letterSpacing: -2,
            margin: 0,
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: `translateY(${interpolate(word2, [0, 1], [40, 0])}px)`,
              opacity: word2,
            }}
          >
            Sincronizar tu tienda
          </span>{" "}
          <span
            style={{
              display: "inline-block",
              transform: `translateY(${interpolate(word3, [0, 1], [40, 0])}px)`,
              opacity: word3,
              color: COLORS.warning,
            }}
          >
            manualmente
          </span>
        </h1>
        <p
          style={{
            fontSize: 32,
            color: COLORS.textMuted,
            marginTop: 28,
            opacity: interpolate(frame, [70, 95], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          es lento, repetitivo y propenso a errores.
        </p>
      </div>
    </AbsoluteFill>
  );
};
