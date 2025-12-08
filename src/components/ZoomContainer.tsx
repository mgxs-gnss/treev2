import { useTheme } from "@mui/material";
import { JSONData, Mems } from "interfaces";
import { useSearchParams } from "react-router-dom";
import { ReactZoomPanPinchState, TransformComponent } from "react-zoom-pan-pinch";
import { getColumns } from "../utils";
import { Mem } from "./Mem";
import { UI } from "./UI";
import React, { useMemo, useCallback } from "react";
import { useViewportVirtualization, useImageQueue } from "../hooks";

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

    const { visibleIndices, visibleItems, scale } = useViewportVirtualization({
      totalImages: imageCount,
      transformState,
      buffer: 3,
    });

    // Create a map for quick lookup of visible item info
    const visibleItemMap = useMemo(() => {
      const map = new Map<number, (typeof visibleItems)[0]>();
      visibleItems.forEach((item) => map.set(item.index, item));
      return map;
    }, [visibleItems]);

    // Get image URL by index
    const getImageUrl = useCallback(
      (index: number) => images[index]?.url || "",
      [images]
    );

    // Use image queue for priority loading
    const { getLoadedState, isLoading } = useImageQueue({
      visibleItems,
      getImageUrl,
    });

    const columns = getColumns();

    // Memoize the grid items to prevent unnecessary re-renders
    const gridItems = useMemo(() => {
      return images.map((image, index) => {
        const isVisible = visibleIndices.has(index);
        const { url } = image;

        if (!isVisible) {
          // Render placeholder to maintain grid structure
          return <div key={url} className="mem" style={{ visibility: "hidden" }} />;
        }

        const itemInfo = visibleItemMap.get(index);
        const lodLevel = itemInfo?.lodLevel ?? 1;
        const loadedState = getLoadedState(index);
        const loading = isLoading(index);

        return (
          <MemoizedMem
            key={url}
            index={url}
            src={url}
            isHome={isHome}
            active={isHome ? undefined : highlightedIndex === url}
            lodLevel={lodLevel}
            loadedLowRes={loadedState?.lowRes}
            loadedHighRes={loadedState?.highRes}
            isLoading={loading}
          />
        );
      });
    }, [
      images,
      visibleIndices,
      visibleItemMap,
      isHome,
      highlightedIndex,
      getLoadedState,
      isLoading,
    ]);

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
        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === "development" && (
          <div
            style={{
              position: "fixed",
              bottom: 60,
              left: 10,
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "4px 8px",
              fontSize: 11,
              borderRadius: 4,
              fontFamily: "monospace",
              zIndex: 1000,
            }}
          >
            Scale: {scale.toFixed(2)} | Visible: {visibleItems.length}
          </div>
        )}
      </>
    );
  }
);

const MemoizedMem = React.memo(Mem);

export { ZoomContainer };
