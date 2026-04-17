import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";

const { fontFamily } = loadFont("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin"] });

// Scene 3 (330-540f, 7s): Live sync demo — items syncing
export const Scene3Sync: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerIn = spring({ frame, fps, config: { damping: 18 } });
  const fadeOut = interpolate(frame, [190, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(headerIn, fadeOut);

  const items = [
    { sku: "REM-001", name: "Remera básica blanca", stock: 42 },
    { sku: "PNT-204", name: "Pantalón slim azul", stock: 18 },
    { sku: "ZAP-117", name: "Zapatillas urbanas", stock: 7 },
    { sku: "BUZ-309", name: "Buzo oversize negro", stock: 25 },
    { sku: "CAM-088", name: "Camisa lino beige", stock: 13 },
  ];

  return (
    <AbsoluteFill style={{ fontFamily, opacity, padding: 100, justifyContent: "center" }}>
      <div
        style={{
          transform: `translateY(${interpolate(headerIn, [0, 1], [-20, 0])}px)`,
          opacity: headerIn,
          marginBottom: 40,
        }}
      >
        <div style={{ fontSize: 20, color: COLORS.accent, fontWeight: 600, marginBottom: 12, letterSpacing: 2, textTransform: "uppercase" }}>
          Sincronización en vivo
        </div>
        <h2 style={{ fontSize: 72, fontWeight: 800, color: COLORS.text, margin: 0, letterSpacing: -1 }}>
          Productos, stock y precios <br />
          <span style={{ color: COLORS.primaryGlow }}>siempre alineados.</span>
        </h2>
      </div>

      {/* Sync rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
        {items.map((item, i) => {
          const delay = 30 + i * 18;
          const rowIn = spring({ frame: frame - delay, fps, config: { damping: 18 } });
          const checkIn = spring({ frame: frame - delay - 18, fps, config: { damping: 12, stiffness: 200 } });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "20px 28px",
                background: COLORS.bgSoft,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                transform: `translateX(${interpolate(rowIn, [0, 1], [-40, 0])}px)`,
                opacity: rowIn,
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${COLORS.primary}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>{item.name}</div>
                <div style={{ fontSize: 16, color: COLORS.textMuted, fontFamily: "monospace", marginTop: 2 }}>SKU: {item.sku}</div>
              </div>
              <div style={{ fontSize: 18, color: COLORS.textMuted }}>Stock: <span style={{ color: COLORS.text, fontWeight: 700 }}>{item.stock}</span></div>
              {/* Animated arrow */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: rowIn }}>
                <div style={{ width: 32, height: 2, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
                <div style={{ color: COLORS.accent, fontSize: 18 }}>→</div>
              </div>
              {/* Status badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  background: `${COLORS.success}1F`,
                  border: `1px solid ${COLORS.success}55`,
                  borderRadius: 999,
                  transform: `scale(${checkIn})`,
                  opacity: checkIn,
                }}
              >
                <div style={{ width: 18, height: 18, borderRadius: 999, background: COLORS.success, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</div>
                <span style={{ color: COLORS.success, fontWeight: 600, fontSize: 15 }}>Sincronizado</span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
