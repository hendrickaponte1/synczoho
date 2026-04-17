import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

// Scene 4 (540-750f, 7s): Benefits grid
export const Scene4Benefits: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerIn = spring({ frame, fps, config: { damping: 18 } });
  const fadeOut = interpolate(frame, [190, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(headerIn, fadeOut);

  const benefits = [
    {
      icon: "⏱",
      title: "Ahorro de tiempo",
      desc: "Olvídate de cargar productos dos veces o actualizar planillas.",
      color: COLORS.primaryGlow,
    },
    {
      icon: "📊",
      title: "Stock sin errores",
      desc: "Inventario sincronizado en tiempo real. Nunca vendas sin stock.",
      color: COLORS.accent,
    },
    {
      icon: "⚡",
      title: "Órdenes automáticas",
      desc: "Cada venta se refleja al instante en Zoho Inventory.",
      color: COLORS.success,
    },
    {
      icon: "🛡",
      title: "Confiable y seguro",
      desc: "Conexión oficial vía OAuth. Tus datos siempre protegidos.",
      color: "#A78BFA",
    },
  ];

  return (
    <AbsoluteFill style={{ fontFamily, opacity, padding: 100, justifyContent: "center" }}>
      <div
        style={{
          transform: `translateY(${interpolate(headerIn, [0, 1], [-20, 0])}px)`,
          opacity: headerIn,
          marginBottom: 60,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 20, color: COLORS.primaryGlow, fontWeight: 600, marginBottom: 12, letterSpacing: 2, textTransform: "uppercase" }}>
          Para comercios que escalan
        </div>
        <h2 style={{ fontSize: 80, fontWeight: 800, color: COLORS.text, margin: 0, letterSpacing: -1.5 }}>
          Todo lo que necesitás, <br />
          <span style={{ color: COLORS.accent }}>en un solo lugar.</span>
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1500, margin: "0 auto", width: "100%" }}>
        {benefits.map((b, i) => {
          const delay = 25 + i * 12;
          const cardIn = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          return (
            <div
              key={i}
              style={{
                padding: 32,
                background: COLORS.bgSoft,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20,
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
                transform: `translateY(${interpolate(cardIn, [0, 1], [40, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.95, 1])})`,
                opacity: cardIn,
                boxShadow: `0 20px 60px ${b.color}1A`,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: `${b.color}22`,
                  border: `1px solid ${b.color}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  flexShrink: 0,
                }}
              >
                {b.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 30, fontWeight: 700, color: COLORS.text, margin: 0, marginBottom: 8 }}>{b.title}</h3>
                <p style={{ fontSize: 20, color: COLORS.textMuted, margin: 0, lineHeight: 1.4 }}>{b.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
