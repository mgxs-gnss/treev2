import { useTheme } from "@mui/material";
import { JSONData, Mems } from "interfaces";
import { useSearchParams } from "react-router-dom";
import { ReactZoomPanPinchState, TransformComponent } from "react-zoom-pan-pinch";
import { getColumns } from "../utils";
import { Mem } from "./Mem";
import { UI } from "./UI";
import React, { useMemo } from "react";
import { useViewportVirtualization } from "../hooks";

type Props = {
  imageCount: number;
  images: Mems[];
  jsonData?: JSONData;
  onUpdateIndex: () => void;
  highlightedIndex?: string;
  setHighlightedIndex(num?: string): void;
  transformState: ReactZoomPanPinchState | null;
};

const ZoomContainer = React.memo(
  ({
    imageCount,
    images,
    jsonData,
    onUpdateIndex,
    highlightedIndex,
    setHighlightedIndex,
    transformState,
  }: Props) => {
    const [search] = useSearchParams();
    const isHome = search.has("home");
    const theme = useTheme();

    const { visibleIndices } = useViewportVirtualization({
      totalImages: imageCount,
      transformState,
      buffer: 3,
    });

    const columns = getColumns();

    // Memoize the grid items to prevent unnecessary re-renders
    const gridItems = useMemo(() => {
      return images.map((image, index) => {
        const isVisible = visibleIndices.has(index);
        const { url } = image;

        if (!isVisible) {
          // Render placeholder to maintain grid structure
          return <div key={url} className="mem" style={{ visibility: 'hidden' }} />;
        }

        return (
          <MemoizedMem
            key={url}
            index={url}
            src={url}
            isHome={isHome}
            active={isHome ? undefined : highlightedIndex === url}
          />
        );
      });
    }, [images, visibleIndices, isHome, highlightedIndex]);

    return (
      <>
        <UI
          imageCount={imageCount}
          images={images}
          jsonData={jsonData}
          onUpdateIndex={onUpdateIndex}
          setHighlightedIndex={setHighlightedIndex}
        />
        <TransformComponent>
          <div
            style={{
              display: "grid",
              willChange: "transform",
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: theme.spacing(5),
              width: "100%",
            }}
          >
            {gridItems}
          </div>
        </TransformComponent>
      </>
    );
  }
);

const MemoizedMem = React.memo(Mem);

export { ZoomContainer };
