import { Box, CircularProgress } from "@mui/material";
import { useRef } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useHighlightedIndex, useMemImages } from "../hooks";
import { Info } from "./Info";
import { Mem } from "./Mem";
import { Interval } from "./Interval";
import { COLUMNS } from "../utils";

const ZoomPanComponent = () => {
  const isHome = new URLSearchParams(window.location.search).has("home");

  const containerRef = useRef<HTMLDivElement>();
  const { highlightedIndex, updateIndex } = useHighlightedIndex(containerRef);
  const { loading, images, imageCount, jsonData } = useMemImages(
    isHome ? undefined : highlightedIndex
  );

  if (loading) {
    return <CircularProgress size="large" color="primary" />;
  }

  return (
    <>
      {!isHome && <Info imageCount={imageCount} jsonData={jsonData} />}

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
              <TransformComponent>
                <Box
                  ref={containerRef}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
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
