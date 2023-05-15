import { Box, CircularProgress } from "@mui/material";
import { useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { useMemImages } from "../hooks";
import { Info } from "./Info";
import { Mem } from "./Mem";

const ZoomPanComponent = () => {
  const containerRef = useRef<HTMLDivElement>();
  const [highlightedIndex, setHighlightedIndex] = useState<number>();
  const { loading, images, imageCount, jsonData } =
    useMemImages(highlightedIndex);

  const highlightClosestImage = () => {
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let minDistance = Infinity;
    let closestIndex = 0;

    const images = containerRef.current?.getElementsByTagName("img");

    images &&
      Object.values(images).forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const imageCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          const dx = center.x - imageCenter.x;
          const dy = center.y - imageCenter.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        }
      });

    setHighlightedIndex(closestIndex);
  };

  if (loading) {
    return <CircularProgress size="large" color="primary" />;
  }

  return (
    <>
      <Info imageCount={imageCount} jsonData={jsonData} />

      <TransformWrapper
        initialScale={2}
        maxScale={10}
        minScale={0.1}
        limitToBounds={false}
        initialPositionX={20}
        initialPositionY={20}
        onInit={highlightClosestImage}
        onPanning={highlightClosestImage}
        onZoom={highlightClosestImage}
        onWheel={highlightClosestImage}
        wheel={{
          step: 0.025,
        }}
      >
        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
          <>
            <TransformComponent>
              <Box
                ref={containerRef}
                sx={{
                  display: "grid",
                  gridTemplateColumns: `repeat(8, 1fr)`,
                  gap: [1, 2],
                  width: "100%",
                }}
              >
                {images.slice(1).map((src, index) => (
                  <Mem
                    index={index}
                    src={src}
                    active={highlightedIndex}
                    key={index}
                  />
                ))}
              </Box>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </>
  );
};

export default ZoomPanComponent;
