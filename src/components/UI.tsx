import { memo, useCallback, useMemo } from "react";
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
  const isHome = useMemo(() => search.has("home"), [search]);

  const navigate = useNavigate();
  const { zoomToElement, resetTransform } = useControls();

  const intervalCallback = useCallback(() => {
    const now = new Date().getTime();

    //@ts-ignore
    if (now - window.timeStart >= TIME_REFRESH) {
      navigate(0);
    }

    const num = ~~(Math.random() * imageCount);
    zoomToElement(num.toString());
    setTimeout(resetTransform, intervals[2]);
  }, [imageCount, navigate, resetTransform, zoomToElement]);

  const infoOnChange = useCallback(
    (num: string) => {
      if (num === "") {
        setHighlightedIndex(undefined);
        resetTransform();
      } else {
        zoomToElement(`${num}`, 0.5);
        setHighlightedIndex(num);
        setTimeout(onUpdateIndex, intervals[0]);
      }
    },
    [onUpdateIndex, resetTransform, setHighlightedIndex, zoomToElement]
  );

  return (
    <>
      {isHome && (
        <Interval
          interval={intervals.reduce((a, b) => a + b, 0)}
          callback={intervalCallback}
        />
      )}

      {!isHome && (
        <Info
          images={images}
          onChange={infoOnChange}
          imageCount={imageCount}
          jsonData={jsonData}
        />
      )}
    </>
  );
});

export { UI };
