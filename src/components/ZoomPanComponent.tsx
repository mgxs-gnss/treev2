import { Box, CircularProgress, useTheme } from "@mui/material";
import { useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TransformComponent,
  TransformWrapper,
  getMatrixTransformStyles,
} from "react-zoom-pan-pinch";
import { useHighlightedIndex, useMemImages } from "../hooks";
import { getColumns, getScale, intervals } from "../utils";
import { Mem, UI } from "./";

const ZoomPanComponent = () => {
  const theme = useTheme();
  const [search] = useSearchParams();
  const isHome = search.has("home");
  const isGNSS = search.has("GNSS");

  const containerRef = useRef<HTMLDivElement>(null);
  const { highlightedIndex, updateIndex, setHighlightedIndex } =
    useHighlightedIndex(containerRef);
  const { loading, images, imageCount, jsonData } = useMemImages(
    isHome ? undefined : highlightedIndex,
    isGNSS
  );

  const content = useMemo(
    () => (
      <div
        ref={containerRef}
        style={{
          display: "grid",
          willChange: "transform",
          gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
          gap: theme.spacing(5),
          width: "100%",
        }}
      >
        {images?.map((src) => (
          <Mem
            key={src.url}
            index={src.url.split("_")[1].split(".")[0]}
            src={src.url}
            active={
              isHome
                ? undefined
                : highlightedIndex === src.url.split("_")[1].split(".")[0]
            }
          />
        ))}
      </div>
    ),
    [images, containerRef, isHome, highlightedIndex, theme]
  );

  const onUpdateIndex = () => {
    updateIndex();
  };

  if (loading || !imageCount || !images) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          left: " 50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <>
      <TransformWrapper
        centerOnInit
        initialScale={0.25}
        maxScale={0.6}
        minScale={0.1}
        limitToBounds={false}
        onInit={updateIndex}
        onPanning={updateIndex}
        onZoom={updateIndex}
        onWheel={updateIndex}
        customTransform={(x: number, y: number, scale: number) =>
          getMatrixTransformStyles(x, y, scale)
        }
        wheel={{
          step: 0.2,
        }}
      >
        {({ zoomToElement, resetTransform }) => {
          const onZoomToElement = (el: string, scale?: number) => {
            zoomToElement(el, scale, intervals[0], "easeInOutQuad");
          };

          const onResetTransform = () => {
            resetTransform(intervals[1], "easeInOutQuad");
          };

          return (
            <>
              <UI
                onZoomToElement={onZoomToElement}
                onResetTransform={onResetTransform}
                imageCount={imageCount}
                images={images}
                jsonData={jsonData}
                onUpdateIndex={onUpdateIndex}
                setHighlightedIndex={setHighlightedIndex}
              />
              <TransformComponent>{content}</TransformComponent>
            </>
          );
        }}
      </TransformWrapper>
    </>
  );
};

export { ZoomPanComponent };
