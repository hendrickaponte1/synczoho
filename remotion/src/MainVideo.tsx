import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { slide } from "@remotion/transitions/slide";
import { PersistentBackground } from "./components/PersistentBackground";
import { Scene1Chaos } from "./scenes/Scene1Chaos";
import { Scene2Connect } from "./scenes/Scene2Connect";
import { Scene3Sync } from "./scenes/Scene3Sync";
import { Scene4Benefits } from "./scenes/Scene4Benefits";
import { Scene5Brand } from "./scenes/Scene5Brand";

// Scene durations (frames @ 30fps):
// Scene 1: 150 (5s) — Problem
// Scene 2: 180 (6s) — Connect
// Scene 3: 210 (7s) — Sync demo
// Scene 4: 210 (7s) — Benefits
// Scene 5: 150 (5s) — Brand close
// Transitions: 4 × 20 frames overlap = 80 frames
// Total: 150+180+210+210+150 - 80 = 820... composition is 900 to give breathing room
// We use durations that sum cleanly with transitions accounted for.

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene1Chaos />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene2Connect />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />
        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene3Sync />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 25 })}
        />
        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene4Benefits />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 22 })}
        />
        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene5Brand />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
