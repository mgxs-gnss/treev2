import { useCallback, useEffect, useState, useMemo } from "react";
import { Mems } from "../interfaces";
import { API } from "../config";
import { getRandomGNSS } from "../utils";

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
  // Handle multiple URL formats:
  // - https://assets.mgxs.co/GNSS_1234.jpg
  // - https://assets.mgxs.co/1234.jpg
  // - Any URL with a number before .jpg

  // Try GNSS_ pattern first
  const gnssMatch = url.match(/GNSS_(\d+)/i);
  if (gnssMatch) return gnssMatch[1];

  // Fallback: extract number before .jpg
  const numMatch = url.match(/\/(\d+)\.jpg/i);
  if (numMatch) return numMatch[1];

  // Last resort: any number in the filename
  const lastSlash = url.lastIndexOf("/");
  const filename = url.substring(lastSlash + 1);
  const anyNum = filename.match(/(\d+)/);
  return anyNum ? anyNum[1] : "";
};

// Generate random MEM counts for demo bubbles
const generateRandomMemCount = (): number => {
  // Power law distribution - most have few, some have many
  const rand = Math.random();
  if (rand < 0.6) return 1;
  if (rand < 0.8) return Math.floor(Math.random() * 3) + 2; // 2-4
  if (rand < 0.95) return Math.floor(Math.random() * 6) + 5; // 5-10
  return Math.floor(Math.random() * 15) + 11; // 11-25
};

export const useBubbleData = (): UseBubbleDataResult => {
  const [mems, setMems] = useState<Mems[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/mem/list`);
      const images: Mems[] = await response.json();

      if (Array.isArray(images) && images.length > 0) {
        setMems(images);
        setUseFallback(false);
      } else {
        // API returned empty, use fallback
        setUseFallback(true);
      }
    } catch (e) {
      console.error("Failed to load MEMs, using fallback:", e);
      setUseFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { bubbles, maxCount, minCount } = useMemo(() => {
    // Use fallback: generate random GNSS bubbles with simulated MEM counts
    if (useFallback) {
      const randomGnss = getRandomGNSS();
      const bubbleArray: BubbleData[] = randomGnss.map((gnssNum) => {
        const count = generateRandomMemCount();
        return {
          gnssNum: gnssNum.toString(),
          imageUrl: `https://assets.mgxs.co/GNSS_${gnssNum}.jpg`,
          memCount: count,
          owners: [],
        };
      });

      // Sort by count descending
      bubbleArray.sort((a, b) => b.memCount - a.memCount);

      const max = Math.max(...bubbleArray.map((b) => b.memCount));
      const min = Math.min(...bubbleArray.map((b) => b.memCount));

      return {
        bubbles: bubbleArray,
        maxCount: max,
        minCount: min,
      };
    }

    // Group MEMs by GNSS number from API data
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
  }, [mems, useFallback]);

  return { bubbles, loading, maxCount, minCount };
};
