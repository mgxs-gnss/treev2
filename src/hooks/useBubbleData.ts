import { useCallback, useEffect, useRef, useState } from "react";
import { API } from "../config";

export interface BubbleData {
  gnssNum: string;
  imageUrl: string;
  memCount: number;
  memUrls: string[]; // URLs of individual MEMs
}

interface UseBubbleDataResult {
  bubbles: BubbleData[];
  loading: boolean;
  maxCount: number;
  minCount: number;
}

// API returns: [["gnss_number", ["mem_url_1", "mem_url_2", ...]], ...]
type GnssMemsResponse = [string, string[]][];

const MAX_CONCURRENT = 6; // Limit concurrent image loads

// Preload image and resolve when loaded
const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resolve even on error to continue
    img.src = url;
  });
};

export const useBubbleData = (): UseBubbleDataResult => {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(1);
  const [minCount, setMinCount] = useState(1);
  const abortRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setBubbles([]);
      abortRef.current = false;

      // Fetch all GNSS with MEMs in one request
      const response = await fetch(`${API}/mem/list/gnss`);
      if (!response.ok) throw new Error("Failed to fetch GNSS MEMs list");

      const data: GnssMemsResponse = await response.json();

      // Transform to BubbleData format
      const bubbleData: BubbleData[] = data
        .filter(([_, mems]) => mems.length > 0)
        .map(([gnssNum, mems]) => ({
          gnssNum,
          imageUrl: `https://assets.mgxs.co/${gnssNum}.jpg`,
          memCount: mems.length,
          memUrls: mems,
        }));

      // Sort by MEM count descending and take top 100
      bubbleData.sort((a, b) => b.memCount - a.memCount);
      const displayBubbles = bubbleData.slice(0, 100);

      // Calculate min/max upfront
      const counts = displayBubbles.map((b) => b.memCount);
      const max = counts.length > 0 ? Math.max(...counts) : 1;
      const min = counts.length > 0 ? Math.min(...counts) : 1;
      setMaxCount(max);
      setMinCount(min);

      // Progressive loading with concurrency limit
      let currentIndex = 0;
      const loadedBubbles: BubbleData[] = [];

      const loadNext = async (): Promise<void> => {
        while (currentIndex < displayBubbles.length && !abortRef.current) {
          const index = currentIndex++;
          const bubble = displayBubbles[index];

          // Preload the image
          await preloadImage(bubble.imageUrl);

          if (abortRef.current) return;

          // Add bubble to state
          loadedBubbles.push(bubble);
          setBubbles([...loadedBubbles]);
        }
      };

      // Start concurrent loaders
      const loaders = Array.from(
        { length: Math.min(MAX_CONCURRENT, displayBubbles.length) },
        () => loadNext()
      );

      await Promise.all(loaders);

      if (!abortRef.current) {
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to load GNSS data:", e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      abortRef.current = true;
    };
  }, [load]);

  return { bubbles, loading, maxCount, minCount };
};
