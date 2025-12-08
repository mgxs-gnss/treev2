import { useCallback, useEffect, useState } from "react";
import { API } from "../config";

export interface BubbleData {
  gnssNum: string;
  imageUrl: string;
  memCount: number;
}

interface UseBubbleDataResult {
  bubbles: BubbleData[];
  loading: boolean;
  maxCount: number;
  minCount: number;
}

// API returns: [["gnss_number", ["mem_url_1", "mem_url_2", ...]], ...]
type GnssMemsResponse = [string, string[]][];

export const useBubbleData = (): UseBubbleDataResult => {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(1);
  const [minCount, setMinCount] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all GNSS with MEMs in one request
      const response = await fetch(`${API}/mem/list/gnss`);
      if (!response.ok) throw new Error("Failed to fetch GNSS MEMs list");

      const data: GnssMemsResponse = await response.json();

      // Transform to BubbleData format
      const bubbleData: BubbleData[] = data
        .filter(([_, mems]) => mems.length > 0) // Only include GNSS with MEMs
        .map(([gnssNum, mems]) => ({
          gnssNum,
          imageUrl: `https://assets.mgxs.co/${gnssNum}.jpg`,
          memCount: mems.length,
        }));

      // Sort by MEM count descending and take top 100
      bubbleData.sort((a, b) => b.memCount - a.memCount);
      const displayBubbles = bubbleData.slice(0, 100);

      // Calculate min/max
      const counts = displayBubbles.map((b) => b.memCount);
      const max = counts.length > 0 ? Math.max(...counts) : 1;
      const min = counts.length > 0 ? Math.min(...counts) : 1;

      setBubbles(displayBubbles);
      setMaxCount(max);
      setMinCount(min);
    } catch (e) {
      console.error("Failed to load GNSS data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { bubbles, loading, maxCount, minCount };
};
