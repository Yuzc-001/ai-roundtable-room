import { Composition } from 'remotion';
import { RoundtableExplainer } from './RoundtableExplainer.jsx';

export const RemotionRoot = () => (
  <Composition
    id="RoundtableExplainer"
    component={RoundtableExplainer}
    durationInFrames={720}
    fps={30}
    width={1920}
    height={1080}
  />
);
