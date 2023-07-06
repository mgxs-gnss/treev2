import { Chip } from "@mui/material";
import { memo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Info, Interval } from ".";
import { JSONData, Mems } from "../interfaces";
import { intervals, isMobile } from "../utils";

type Props = {
  imageCount: number;
  onResetTransform(): void;
  onZoomToElement(node: string | HTMLElement, scale?: number): void;
  setHighlightedIndex(num?: string): void;
  onUpdateIndex(): void;
  images: Mems[];
  jsonData?: JSONData;
};

const TIME_REFRESH = 5 * 60 * 1000;

const UI = memo(function UI({
  imageCount,
  onZoomToElement,
  onResetTransform,
  setHighlightedIndex,
  onUpdateIndex,
  images,
  jsonData,
}: Props) {
  const [search] = useSearchParams();
  const isHome = search.has("home");

  const navigate = useNavigate();

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
            onZoomToElement(num.toString());
            setTimeout(onResetTransform, intervals[2]);
          }}
        />
      )}

      {!isHome && (
        <Info
          images={images}
          onChange={(num: string) => {
            if (num === "") {
              setHighlightedIndex(undefined);
              onResetTransform();
            } else {
              onZoomToElement(`${num}`, 2);
              setHighlightedIndex(num);
              setTimeout(onUpdateIndex, intervals[0]);
            }
          }}
          imageCount={imageCount}
          jsonData={jsonData}
        />
      )}
      {isMobile() && (
        <Chip
          sx={{
            position: "fixed",
            bottom: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          label="Full experience on Desktop"
        />
      )}
    </>
  );
});

export { UI };
