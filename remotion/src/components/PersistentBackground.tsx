import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Subtle drifting radial gradients
  const drift1X = Math.sin(frame / 120) * 80;
  const drift1Y = Math.cos(frame / 140) * 60;
  const drift2X = Math.cos(frame / 100) * 100;
  const drift2Y = Math.sin(frame / 160) * 80;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: "hidden" }}>
      {/* Radial blob 1 */}
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          left: -300 + drift1X,
          top: -400 + drift1Y,
          background: `radial-gradient(circle, ${COLORS.primary}22 0%, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />
      {/* Radial blob 2 */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          right: -200 + drift2X,
          bottom: -300 + drift2Y,
          background: `radial-gradient(circle, ${COLORS.accent}1F 0%, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />
      {/* Subtle grid */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, opacity: 0.06 }}
      >
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke={COLORS.text}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
