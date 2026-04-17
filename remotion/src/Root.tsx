import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 30s @ 30fps. Transitions overlap, so we account for them in MainVideo.
// Total: 5 scenes, ~900 frames after transition overlaps.
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
