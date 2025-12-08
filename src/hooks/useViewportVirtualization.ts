import { useMemo, useRef } from "react";
import { ReactZoomPanPinchState } from "react-zoom-pan-pinch";
import { getColumns } from "../utils";

// Image dimensions from CSS
const IMAGE_WIDTH = 576;
const IMAGE_HEIGHT = 768;
const GAP = 40; // theme.spacing(5) = 40px

// LOD thresholds based on zoom scale
const LOD_PLACEHOLDER_THRESHOLD = 0.15; // Below this: color placeholders only
const LOD_HIGHRES_THRESHOLD = 0.4; // Above this: load full resolution

export type LodLevel = 0 | 1 | 2; // 0: placeholder, 1: low-res, 2: high-res

export interface VisibleItem {
  index: number;
  row: number;
  col: number;
  distance: number; // Distance from viewport center (for priority)
  lodLevel: LodLevel;
}

interface UseViewportVirtualizationProps {
  totalImages: number;
  transformState: ReactZoomPanPinchState | null;
  buffer?: number; // Extra rows/cols to render outside viewport
}

interface VisibleRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  visibleIndices: Set<number>;
  visibleItems: VisibleItem[]; // Sorted by distance (closest first)
  scale: number;
  panVelocity: { x: number; y: number }; // For directional preloading
}

export const useViewportVirtualization = ({
  totalImages,
  transformState,
  buffer = 2,
}: UseViewportVirtualizationProps): VisibleRange => {
  const lastPositionRef = useRef<{ x: number; y: number; time: number } | null>(null);

  return useMemo(() => {
    const columns = getColumns();
    const rows = Math.ceil(totalImages / columns);

    // Calculate pan velocity
    let panVelocity = { x: 0, y: 0 };
    const now = Date.now();

    if (transformState && lastPositionRef.current) {
      const dt = (now - lastPositionRef.current.time) / 1000; // seconds
      if (dt > 0 && dt < 0.5) {
        // Only calculate if recent
        panVelocity = {
          x: (transformState.positionX - lastPositionRef.current.x) / dt,
          y: (transformState.positionY - lastPositionRef.current.y) / dt,
        };
      }
    }

    if (transformState) {
      lastPositionRef.current = {
        x: transformState.positionX,
        y: transformState.positionY,
        time: now,
      };
    }

    // If no transform state, show center of grid
    if (!transformState) {
      const centerRow = Math.floor(rows / 2);
      const centerCol = Math.floor(columns / 2);
      const visibleIndices = new Set<number>();
      const visibleItems: VisibleItem[] = [];

      for (let r = Math.max(0, centerRow - 5); r <= Math.min(rows - 1, centerRow + 5); r++) {
        for (let c = Math.max(0, centerCol - 5); c <= Math.min(columns - 1, centerCol + 5); c++) {
          const index = r * columns + c;
          if (index < totalImages) {
            visibleIndices.add(index);
            const distance = Math.sqrt(
              Math.pow(r - centerRow, 2) + Math.pow(c - centerCol, 2)
            );
            visibleItems.push({
              index,
              row: r,
              col: c,
              distance,
              lodLevel: 1, // Default to low-res
            });
          }
        }
      }

      // Sort by distance
      visibleItems.sort((a, b) => a.distance - b.distance);

      return {
        startRow: Math.max(0, centerRow - 5),
        endRow: Math.min(rows - 1, centerRow + 5),
        startCol: Math.max(0, centerCol - 5),
        endCol: Math.min(columns - 1, centerCol + 5),
        visibleIndices,
        visibleItems,
        scale: 0.25,
        panVelocity,
      };
    }

    const { positionX, positionY, scale } = transformState;

    // Viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate visible area in grid coordinates
    const viewLeft = -positionX / scale;
    const viewTop = -positionY / scale;
    const viewRight = viewLeft + viewportWidth / scale;
    const viewBottom = viewTop + viewportHeight / scale;

    // Viewport center in grid coordinates
    const viewCenterX = (viewLeft + viewRight) / 2;
    const viewCenterY = (viewTop + viewBottom) / 2;

    // Determine base LOD level from scale
    let baseLodLevel: LodLevel = 1;
    if (scale < LOD_PLACEHOLDER_THRESHOLD) {
      baseLodLevel = 0;
    } else if (scale >= LOD_HIGHRES_THRESHOLD) {
      baseLodLevel = 2;
    }

    // Adjust buffer based on pan velocity (larger buffer in movement direction)
    const velocityMagnitude = Math.sqrt(
      panVelocity.x * panVelocity.x + panVelocity.y * panVelocity.y
    );
    const dynamicBuffer =
      velocityMagnitude > 500 ? buffer + 2 : velocityMagnitude > 200 ? buffer + 1 : buffer;

    // Convert to grid indices with dynamic buffer
    const startCol = Math.max(0, Math.floor(viewLeft / (IMAGE_WIDTH + GAP)) - dynamicBuffer);
    const endCol = Math.min(
      columns - 1,
      Math.ceil(viewRight / (IMAGE_WIDTH + GAP)) + dynamicBuffer
    );
    const startRow = Math.max(0, Math.floor(viewTop / (IMAGE_HEIGHT + GAP)) - dynamicBuffer);
    const endRow = Math.min(
      rows - 1,
      Math.ceil(viewBottom / (IMAGE_HEIGHT + GAP)) + dynamicBuffer
    );

    // Build visible items with distance and LOD
    const visibleIndices = new Set<number>();
    const visibleItems: VisibleItem[] = [];

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const index = r * columns + c;
        if (index < totalImages) {
          visibleIndices.add(index);

          // Calculate cell center position
          const cellCenterX = c * (IMAGE_WIDTH + GAP) + IMAGE_WIDTH / 2;
          const cellCenterY = r * (IMAGE_HEIGHT + GAP) + IMAGE_HEIGHT / 2;

          // Distance from viewport center (in grid units for consistency)
          const distance = Math.sqrt(
            Math.pow((cellCenterX - viewCenterX) / IMAGE_WIDTH, 2) +
              Math.pow((cellCenterY - viewCenterY) / IMAGE_HEIGHT, 2)
          );

          // LOD can be upgraded for very close items when at medium zoom
          let lodLevel = baseLodLevel;
          if (baseLodLevel === 1 && distance < 1.5 && scale > 0.3) {
            lodLevel = 2; // Upgrade to high-res for closest items
          }

          visibleItems.push({
            index,
            row: r,
            col: c,
            distance,
            lodLevel,
          });
        }
      }
    }

    // Sort by distance (closest first for priority loading)
    visibleItems.sort((a, b) => a.distance - b.distance);

    return {
      startRow,
      endRow,
      startCol,
      endCol,
      visibleIndices,
      visibleItems,
      scale,
      panVelocity,
    };
  }, [totalImages, transformState, buffer]);
};
