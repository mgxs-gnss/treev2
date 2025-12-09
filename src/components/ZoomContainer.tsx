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

    const { visibleItems, scale } = useViewportVirtualization({
      totalImages: imageCount,
      transformState,
      buffer: 5, // Larger buffer for GTA-style preloading
    });

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

    // Only render visible items - true virtualization
    // Calculate grid dimensions
    const gridItems = useMemo(() => {
      const cellWidth = 576 + 40; // IMAGE_WIDTH + GAP
      const cellHeight = 768 + 40; // IMAGE_HEIGHT + GAP

      // Only render items that are visible
      return visibleItems.map((item) => {
        const { index, row, col, lodLevel } = item;
        const image = images[index];
        if (!image) return null;

        const { url } = image;
        const loadedState = getLoadedState(index);
        const loading = isLoading(index);

        // Position absolutely within the grid
        const left = col * cellWidth;
        const top = row * cellHeight;

        return (
          <div
            key={url}
            className="grid-item-fade"
            style={{
              position: "absolute",
              left,
              top,
              width: 576,
              height: 768,
            }}
          >
            <MemoizedMem
              index={url}
              src={url}
              isHome={isHome}
              active={isHome ? undefined : highlightedIndex === url}
              lodLevel={lodLevel}
              loadedLowRes={loadedState?.lowRes}
              loadedHighRes={loadedState?.highRes}
              isLoading={loading}
            />
          </div>
        );
      });
    }, [
      visibleItems,
      images,
      isHome,
      highlightedIndex,
      getLoadedState,
      isLoading,
    ]);

    // Calculate total grid size for container
    const totalGridSize = useMemo(() => {
      const cellWidth = 576 + 40;
      const cellHeight = 768 + 40;
      const rows = Math.ceil(imageCount / columns);
      return {
        width: columns * cellWidth,
        height: rows * cellHeight,
      };
    }, [imageCount, columns]);

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
              position: "relative",
              willChange: "transform",
              width: totalGridSize.width,
              height: totalGridSize.height,
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
