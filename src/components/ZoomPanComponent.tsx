import { Box, CircularProgress } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import {
  TransformWrapper,
  getMatrixTransformStyles,
  ReactZoomPanPinchState,
} from "react-zoom-pan-pinch";
import { useHighlightedIndex, useMemImages } from "../hooks";
import { isMobile } from "../utils";
import { ZoomContainer } from "./ZoomContainer";
import React, { useCallback, useMemo, useState } from "react";

const ZoomPanComponentMemo = () => {
  const [search] = useSearchParams();
  const isHome = search.has("home");
  const isGNSS = search.has("GNSS");
  const [transformState, setTransformState] = useState<ReactZoomPanPinchState | null>(null);

  const { highlightedIndex, updateIndex, setHighlightedIndex } =
    useHighlightedIndex();
  const { loading, images, imageCount, jsonData } = useMemImages(
    isHome ? undefined : highlightedIndex,
    isGNSS
  );

  const isMob = useMemo(() => isMobile(), []);

  const handleTransformChange = useCallback((ref: { state: ReactZoomPanPinchState }) => {
    setTransformState(ref.state);
    updateIndex();
  }, [updateIndex]);

  const memoizedUpdateIndex = useCallback(updateIndex, [updateIndex]);

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
    <TransformWrapper
      centerOnInit
      initialScale={0.25}
      maxScale={0.6}
      minScale={isMob ? 0.25 : 0.1}
      limitToBounds={isMob}
      onInit={handleTransformChange}
      onPanning={handleTransformChange}
      onZoom={handleTransformChange}
      onWheel={handleTransformChange}
      customTransform={(x: number, y: number, scale: number) =>
        getMatrixTransformStyles(x, y, scale)
      }
      wheel={{
        step: 0.2,
      }}
    >
      <ZoomContainer
        imageCount={imageCount}
        images={images}
        jsonData={jsonData}
        highlightedIndex={highlightedIndex}
        onUpdateIndex={memoizedUpdateIndex}
        setHighlightedIndex={setHighlightedIndex}
        transformState={transformState}
      />
    </TransformWrapper>
  );
};

export const ZoomPanComponent = React.memo(ZoomPanComponentMemo);
