import { Box, CircularProgress } from "@mui/material";
import { useRef } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useHighlightedIndex, useMemImages } from "../hooks";
import { getColumns } from "../utils";
import { Info } from "./Info";
import { Interval } from "./Interval";
import { Mem } from "./Mem";

const ZoomPanComponent = () => {
  const isHome = new URLSearchParams(window.location.search).has("home");

  const containerRef = useRef<HTMLDivElement>();
  const { highlightedIndex, updateIndex } = useHighlightedIndex(containerRef);
  const { loading, images, imageCount, jsonData } = useMemImages(
    isHome ? undefined : highlightedIndex
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
                  onChange={(num: string) => {
                    const index = images.findIndex(
                      (a) => a.url.split("_")[1].split(".")[0].indexOf(num) > -1
                    );

                    if (num === "" || index === -1) {
                      resetTransform(intervals[1], "easeInOutQuad");
                    } else {
                      zoomToElement(num, 3, intervals[0], "easeInOutQuad");
                      updateIndex();
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

export default ZoomPanComponent;
