import { Box, CircularProgress } from "@mui/material";
import { useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useHighlightedIndex, useMemImages } from "../hooks";
import { getColumns } from "../utils";
import { Info, Interval, Mem } from "./";

const TIME_REFRESH = 5 * 60 * 1000;

const ZoomPanComponent = () => {
  const [search] = useSearchParams();
  const isHome = search.has("home");
  const isGNSS = search.has("GNSS");
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>();
  const { highlightedIndex, updateIndex, setHighlightedIndex } =
    useHighlightedIndex(containerRef);
  const { loading, images, imageCount, jsonData } = useMemImages(
    isHome ? undefined : highlightedIndex,
    isGNSS
  );

  if (loading || !imageCount || !images) {
    return (
      <CircularProgress
        sx={{
          position: "absolute",
          top: "50%",
          left: " 50%",
          transform: "translate(-50%, -50%)",
        }}
        color="primary"
      />
    );
  }

  return (
    <>
      <TransformWrapper
        initialScale={2}
        maxScale={10}
        minScale={0.1}
        limitToBounds={false}
        // initialPositionX={20}
        // initialPositionY={20}
        onInit={updateIndex}
        onPanning={updateIndex}
        onZoom={updateIndex}
        onWheel={updateIndex}
customTransform={(x: number, y: number, scale: number) =>
          `translate3d(${x}px, ${y}px) scale(${scale})`
        }
        wheel={{
          step: 0.025,
        }}
      >
        {({ zoomToElement, zoomIn, zoomOut, resetTransform, ...rest }) => {
          const intervals = [1000, 750, 5500];

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

                    zoomToElement(
                      (~~(Math.random() * imageCount)).toString(),
                      undefined,
                      intervals[0],
                      "easeInOutQuad"
                    );
                    setTimeout(() => {
                      resetTransform(intervals[1], "easeInOutQuad");
                    }, intervals[2]);
                  }}
                />
              )}

              {!isHome && (
                <Info
                  images={images}
                  onChange={(num: string) => {
                    if (num === "") {
                      setHighlightedIndex(undefined);
                      resetTransform(intervals[1], "easeInOutQuad");
                    } else {
                      zoomToElement(`${num}`, 2, intervals[0], "easeInOutQuad");
                      setTimeout(updateIndex, intervals[0]);
                    }
                  }}
                  imageCount={imageCount}
                  jsonData={jsonData}
                />
              )}
              <TransformComponent>
                <Box
                  ref={containerRef}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
                    gap: [1, 2],
                    width: "100%",
                  }}
                >
                  {images.map((src, index) => (
                    <Mem
                      index={index}
                      src={src.url}
                      active={isHome ? undefined : highlightedIndex}
                      key={index}
                    />
                  ))}
                </Box>
              </TransformComponent>
            </>
          );
        }}
      </TransformWrapper>
    </>
  );
};

export { ZoomPanComponent };
