import { useCallback, useEffect, useRef, useState } from "react";
import { LodLevel, VisibleItem } from "./useViewportVirtualization";

const MAX_CONCURRENT_LOADS = 6;

interface LoadedImage {
  lowRes?: string; // Loaded low-res URL
  highRes?: string; // Loaded high-res URL
}

interface QueueItem {
  url: string;
  index: number;
  lodLevel: LodLevel;
  distance: number;
}

interface UseImageQueueProps {
  visibleItems: VisibleItem[];
  getImageUrl: (index: number) => string;
}

interface UseImageQueueReturn {
  getLoadedState: (index: number) => LoadedImage | undefined;
  isLoading: (index: number) => boolean;
}

export const useImageQueue = ({
  visibleItems,
  getImageUrl,
}: UseImageQueueProps): UseImageQueueReturn => {
  // Track loaded images
  const [loadedImages, setLoadedImages] = useState<Map<number, LoadedImage>>(
    new Map()
  );
  const [loadingSet, setLoadingSet] = useState<Set<number>>(new Set());

  // Refs for managing queue
  const queueRef = useRef<QueueItem[]>([]);
  const activeLoadsRef = useRef<Map<number, AbortController>>(new Map());
  const visibleIndicesRef = useRef<Set<number>>(new Set());

  // Update visible indices ref
  useEffect(() => {
    visibleIndicesRef.current = new Set(visibleItems.map((item) => item.index));
  }, [visibleItems]);

  // Process queue - load next images
  const processQueue = useCallback(() => {
    // Cancel loads for items no longer visible
    activeLoadsRef.current.forEach((controller, index) => {
      if (!visibleIndicesRef.current.has(index)) {
        controller.abort();
        activeLoadsRef.current.delete(index);
        setLoadingSet((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    });

    // Start new loads up to max concurrent
    while (
      activeLoadsRef.current.size < MAX_CONCURRENT_LOADS &&
      queueRef.current.length > 0
    ) {
      const item = queueRef.current.shift();
      if (!item) break;

      // Skip if no longer visible or already loaded at this level
      if (!visibleIndicesRef.current.has(item.index)) continue;

      const loaded = loadedImages.get(item.index);
      if (item.lodLevel === 1 && loaded?.lowRes) continue;
      if (item.lodLevel === 2 && loaded?.highRes) continue;

      // Skip if already loading
      if (activeLoadsRef.current.has(item.index)) continue;

      // Start loading
      const controller = new AbortController();
      activeLoadsRef.current.set(item.index, controller);
      setLoadingSet((prev) => new Set(prev).add(item.index));

      const img = new Image();
      const isHighRes = item.lodLevel === 2;
      const url = isHighRes ? item.url : item.url.replace(".jpg", "_low.jpg");

      img.onload = () => {
        activeLoadsRef.current.delete(item.index);
        setLoadingSet((prev) => {
          const next = new Set(prev);
          next.delete(item.index);
          return next;
        });

        setLoadedImages((prev) => {
          const next = new Map(prev);
          const current = next.get(item.index) || {};
          if (isHighRes) {
            next.set(item.index, { ...current, highRes: url });
          } else {
            next.set(item.index, { ...current, lowRes: url });
          }
          return next;
        });

        // Continue processing queue
        processQueue();
      };

      img.onerror = () => {
        activeLoadsRef.current.delete(item.index);
        setLoadingSet((prev) => {
          const next = new Set(prev);
          next.delete(item.index);
          return next;
        });
        processQueue();
      };

      // Handle abort
      controller.signal.addEventListener("abort", () => {
        img.src = ""; // Cancel load
      });

      img.src = url;
    }
  }, [loadedImages]);

  // Update queue when visible items change
  useEffect(() => {
    // Build new queue from visible items, sorted by distance
    const newQueue: QueueItem[] = visibleItems
      .filter((item) => item.lodLevel > 0) // Skip placeholders (LOD 0)
      .map((item) => ({
        url: getImageUrl(item.index),
        index: item.index,
        lodLevel: item.lodLevel,
        distance: item.distance,
      }))
      .sort((a, b) => {
        // Prioritize by: 1) LOD level (high-res first if close), 2) distance
        if (a.lodLevel !== b.lodLevel) return b.lodLevel - a.lodLevel;
        return a.distance - b.distance;
      });

    queueRef.current = newQueue;
    processQueue();
  }, [visibleItems, getImageUrl, processQueue]);

  const getLoadedState = useCallback(
    (index: number) => loadedImages.get(index),
    [loadedImages]
  );

  const isLoading = useCallback(
    (index: number) => loadingSet.has(index),
    [loadingSet]
  );

  return {
    getLoadedState,
    isLoading,
  };
};
