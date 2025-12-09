import { JSONData, Mems } from "interfaces";
import { useSearchParams } from "react-router-dom";
import { ReactZoomPanPinchState, TransformComponent } from "react-zoom-pan-pinch";
import { UI } from "./UI";
import React, { useMemo } from "react";

// Image dimensions
const IMAGE_WIDTH = 576;
const IMAGE_HEIGHT = 768;
const GAP = 40;
const CELL_WIDTH = IMAGE_WIDTH + GAP;
const CELL_HEIGHT = IMAGE_HEIGHT + GAP;

type Props = {
  imageCount: number;
  images: Mems[];
  jsonData?: JSONData;
  onUpdateIndex: () => void;
  highlightedIndex?: string;
  setHighlightedIndex(num?: string): void;
  transformState: ReactZoomPanPinchState | null;
};

// Simple grid item component
const GridItem = React.memo(function GridItem({
  url,
  left,
  top,
  isHome,
  isActive,
}: {
  url: string;
  left: number;
  top: number;
  isHome: boolean;
  isActive: boolean;
}) {
  return (
    <div
      className="grid-item-fade"
      style={{
        position: "absolute",
        left,
        top,
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
      }}
    >
      <div
        className={`mem${isActive ? " mem-highlight" : ""}${isHome ? " mem-home" : ""}`}
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </div>
  );
});

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

    // Calculate columns directly from imageCount (square grid)
    const columns = useMemo(() => Math.ceil(Math.sqrt(imageCount)) + 1, [imageCount]);

    // Calculate visible range based on transform state
    const visibleItems = useMemo(() => {
      const rows = Math.ceil(imageCount / columns);

      // Default: show center area
      if (!transformState) {
        const centerRow = Math.floor(rows / 2);
        const centerCol = Math.floor(columns / 2);
        const buffer = 5;

        const items: { index: number; row: number; col: number }[] = [];
        for (let r = Math.max(0, centerRow - buffer); r <= Math.min(rows - 1, centerRow + buffer); r++) {
          for (let c = Math.max(0, centerCol - buffer); c <= Math.min(columns - 1, centerCol + buffer); c++) {
            const index = r * columns + c;
            if (index < imageCount) {
              items.push({ index, row: r, col: c });
            }
          }
        }
        return items;
      }

      const { positionX, positionY, scale } = transformState;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate visible area in grid coordinates
      const viewLeft = -positionX / scale;
      const viewTop = -positionY / scale;
      const viewRight = viewLeft + viewportWidth / scale;
      const viewBottom = viewTop + viewportHeight / scale;

      // Buffer for preloading
      const buffer = 5;

      // Convert to grid indices
      const startCol = Math.max(0, Math.floor(viewLeft / CELL_WIDTH) - buffer);
      const endCol = Math.min(columns - 1, Math.ceil(viewRight / CELL_WIDTH) + buffer);
      const startRow = Math.max(0, Math.floor(viewTop / CELL_HEIGHT) - buffer);
      const endRow = Math.min(rows - 1, Math.ceil(viewBottom / CELL_HEIGHT) + buffer);

      const items: { index: number; row: number; col: number }[] = [];
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const index = r * columns + c;
          if (index < imageCount) {
            items.push({ index, row: r, col: c });
          }
        }
      }
      return items;
    }, [imageCount, columns, transformState]);

    // Calculate total grid size
    const totalGridSize = useMemo(() => {
      const rows = Math.ceil(imageCount / columns);
      return {
        width: columns * CELL_WIDTH,
        height: rows * CELL_HEIGHT,
      };
    }, [imageCount, columns]);

    // Render only visible items
    const gridItems = useMemo(() => {
      return visibleItems.map((item) => {
        const image = images[item.index];
        if (!image) return null;

        const { url } = image;
        const left = item.col * CELL_WIDTH;
        const top = item.row * CELL_HEIGHT;

        return (
          <GridItem
            key={url}
            url={url}
            left={left}
            top={top}
            isHome={isHome}
            isActive={highlightedIndex === url}
          />
        );
      });
    }, [visibleItems, images, isHome, highlightedIndex]);

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
              width: totalGridSize.width,
              height: totalGridSize.height,
            }}
          >
            {gridItems}
          </div>
        </TransformComponent>
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
            Grid: {columns}x{Math.ceil(imageCount / columns)} | Visible: {visibleItems.length} / {imageCount}
          </div>
        )}
      </>
    );
  }
);

export { ZoomContainer };
