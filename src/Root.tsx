import "./index.css";
import { Composition } from "remotion";
import { z } from "zod";
import { ManiculePromo } from "./ManiculePromo";

const schema = z.object({
  wallBaseOpacity: z.number().min(0).max(1).default(0.55),
  scene1Dur: z.number().min(60).default(225),
  scene2Dur: z.number().min(30).default(120),
  scene4Dur: z.number().min(60).default(250),
  introY: z.number().default(300),
  taglineY: z.number().default(510),
});

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ManiculePromo"
      component={ManiculePromo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
      schema={schema}
      defaultProps={{"wallBaseOpacity":1,"scene1Dur":225,"scene2Dur":120,"scene4Dur":250,"introY":445,"taglineY":665}}
    />
  );
};
