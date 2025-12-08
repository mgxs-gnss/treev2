import { useMemo } from "react";
import { ReactZoomPanPinchState } from "react-zoom-pan-pinch";
import { getColumns } from "../utils";

// Image dimensions from CSS
const IMAGE_WIDTH = 576;
const IMAGE_HEIGHT = 768;
const GAP = 40; // theme.spacing(5) = 40px

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
}

export const useViewportVirtualization = ({
  totalImages,
  transformState,
  buffer = 2,
}: UseViewportVirtualizationProps): VisibleRange => {
  return useMemo(() => {
    const columns = getColumns();
    const rows = Math.ceil(totalImages / columns);

    // If no transform state, show center of grid
    if (!transformState) {
      const centerRow = Math.floor(rows / 2);
      const centerCol = Math.floor(columns / 2);
      const visibleIndices = new Set<number>();

      for (let r = Math.max(0, centerRow - 5); r <= Math.min(rows - 1, centerRow + 5); r++) {
        for (let c = Math.max(0, centerCol - 5); c <= Math.min(columns - 1, centerCol + 5); c++) {
          const index = r * columns + c;
          if (index < totalImages) {
            visibleIndices.add(index);
          }
        }
      }

      return {
        startRow: Math.max(0, centerRow - 5),
        endRow: Math.min(rows - 1, centerRow + 5),
        startCol: Math.max(0, centerCol - 5),
        endCol: Math.min(columns - 1, centerCol + 5),
        visibleIndices,
      };
    }

    const { positionX, positionY, scale } = transformState;

    // Viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate visible area in grid coordinates
    // positionX/Y are negative when panned
    const viewLeft = -positionX / scale;
    const viewTop = -positionY / scale;
    const viewRight = viewLeft + viewportWidth / scale;
    const viewBottom = viewTop + viewportHeight / scale;

    // Convert to grid indices
    const startCol = Math.max(0, Math.floor(viewLeft / (IMAGE_WIDTH + GAP)) - buffer);
    const endCol = Math.min(columns - 1, Math.ceil(viewRight / (IMAGE_WIDTH + GAP)) + buffer);
    const startRow = Math.max(0, Math.floor(viewTop / (IMAGE_HEIGHT + GAP)) - buffer);
    const endRow = Math.min(rows - 1, Math.ceil(viewBottom / (IMAGE_HEIGHT + GAP)) + buffer);

    // Build set of visible indices
    const visibleIndices = new Set<number>();
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const index = r * columns + c;
        if (index < totalImages) {
          visibleIndices.add(index);
        }
      }
    }

    return {
      startRow,
      endRow,
      startCol,
      endCol,
      visibleIndices,
    };
  }, [totalImages, transformState, buffer]);
};
