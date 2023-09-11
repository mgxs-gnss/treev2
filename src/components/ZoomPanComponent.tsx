import { Box, CircularProgress } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import {
  TransformWrapper,
  getMatrixTransformStyles,
} from "react-zoom-pan-pinch";
import { useHighlightedIndex, useMemImages } from "../hooks";
import { isMobile } from "../utils";
import { ZoomContainer } from "./ZoomContainer";

const ZoomPanComponent = () => {
  const [search] = useSearchParams();
  const isHome = search.has("home");
  const isGNSS = search.has("GNSS");

  const { highlightedIndex, updateIndex, setHighlightedIndex } =
    useHighlightedIndex();
  const { loading, images, imageCount, jsonData } = useMemImages(
    isHome ? undefined : highlightedIndex,
    isGNSS
  );

  const isMob = isMobile();

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
      <ZoomContainer
        imageCount={imageCount}
        images={images}
        jsonData={jsonData}
        highlightedIndex={highlightedIndex}
        onUpdateIndex={updateIndex}
        setHighlightedIndex={setHighlightedIndex}
      />
    </TransformWrapper>
  );
};

export { ZoomPanComponent };
