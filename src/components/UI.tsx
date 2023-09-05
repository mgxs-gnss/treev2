import { memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Info, Interval } from ".";
import { JSONData, Mems } from "../interfaces";
import { intervals } from "../utils";
import { useControls } from "react-zoom-pan-pinch";

type Props = {
  imageCount: number;
  setHighlightedIndex(num?: string): void;
  onUpdateIndex(): void;
  images: Mems[];
  jsonData?: JSONData;
};

const TIME_REFRESH = 5 * 60 * 1000;

const UI = memo(function UI({
  imageCount,
  setHighlightedIndex,
  onUpdateIndex,
  images,
  jsonData,
}: Props) {
  const [search] = useSearchParams();
  const isHome = search.has("home");

  const navigate = useNavigate();
  const { zoomToElement, resetTransform } = useControls();

  return (
    <>
      {isHome && (
        <Interval
          interval={intervals.reduce((a, b) => a + b, 0)}
          callback={() => {
            const now = new Date().getTime();

            //@ts-ignore
            if (now - window.timeStart >= TIME_REFRESH) {
              navigate(0);
            }

            const num = ~~(Math.random() * imageCount);
            zoomToElement(num.toString());
            setTimeout(resetTransform, intervals[2]);
          }}
        />
      )}

      {!isHome && (
        <Info
          images={images}
          onChange={(num: string) => {
            if (num === "") {
              setHighlightedIndex(undefined);
              resetTransform();
            } else {
              zoomToElement(`${num}`, 0.5);
              setHighlightedIndex(num);
              setTimeout(onUpdateIndex, intervals[0]);
            }
          }}
          imageCount={imageCount}
          jsonData={jsonData}
        />
      )}
    </>
  );
});

export { UI };
