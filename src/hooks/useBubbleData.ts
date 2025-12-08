import { useCallback, useEffect, useState, useMemo } from "react";
import { Mems } from "../interfaces";
import { API } from "../config";

export interface BubbleData {
  gnssNum: string;
  imageUrl: string;
  memCount: number;
  owners: string[];
}

interface UseBubbleDataResult {
  bubbles: BubbleData[];
  loading: boolean;
  maxCount: number;
  minCount: number;
}

const extractGnssNum = (url: string): string => {
  // URL format: https://assets.mgxs.co/GNSS_1234.jpg
  const match = url.match(/GNSS_(\d+)/i);
  return match ? match[1] : "";
};

export const useBubbleData = (): UseBubbleDataResult => {
  const [mems, setMems] = useState<Mems[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const images: Mems[] = await (await fetch(`${API}/mem/list`)).json();
      setMems(images);
    } catch (e) {
      console.error("Failed to load MEMs:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { bubbles, maxCount, minCount } = useMemo(() => {
    // Group MEMs by GNSS number
    const gnssMap = new Map<string, { imageUrl: string; owners: Set<string> }>();

    for (const mem of mems) {
      const gnssNum = extractGnssNum(mem.url);
      if (!gnssNum) continue;

      if (!gnssMap.has(gnssNum)) {
        gnssMap.set(gnssNum, {
          imageUrl: mem.url,
          owners: new Set(),
        });
      }

      const entry = gnssMap.get(gnssNum)!;
      if (mem.owner) {
        entry.owners.add(mem.owner);
      }
    }

    // Convert to array and calculate counts
    const bubbleArray: BubbleData[] = [];
    let max = 0;
    let min = Infinity;

    gnssMap.forEach((value, gnssNum) => {
      const count = value.owners.size || 1; // At least 1 if no owner info
      max = Math.max(max, count);
      min = Math.min(min, count);

      bubbleArray.push({
        gnssNum,
        imageUrl: value.imageUrl,
        memCount: count,
        owners: Array.from(value.owners),
      });
    });

    // Sort by count descending (biggest bubbles first)
    bubbleArray.sort((a, b) => b.memCount - a.memCount);

    return {
      bubbles: bubbleArray,
      maxCount: max,
      minCount: min === Infinity ? 1 : min,
    };
  }, [mems]);

  return { bubbles, loading, maxCount, minCount };
};
