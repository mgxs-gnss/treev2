import { useCallback, useEffect, useState } from "react";
import { getRandomGNSS } from "../utils";
import { isMobile } from "../utils";

const NFT_API = "https://nft.mgxs.co";

export interface BubbleData {
  gnssNum: string;
  imageUrl: string;
  memCount: number;
  name: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
}

interface NftResponse {
  _id: string;
  image: string;
  name: string;
  description: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
  mems: Array<unknown>;
  animation_url?: string;
  external_url?: string;
}

interface UseBubbleDataResult {
  bubbles: BubbleData[];
  loading: boolean;
  maxCount: number;
  minCount: number;
}

export const useBubbleData = (): UseBubbleDataResult => {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxCount, setMaxCount] = useState(1);
  const [minCount, setMinCount] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      // Get random GNSS numbers to fetch
      const gnssNumbers = getRandomGNSS();
      const isMob = isMobile();

      // Limit concurrent requests - fetch in batches
      const batchSize = isMob ? 20 : 50;
      const maxBubbles = isMob ? 50 : 150;
      const numbersToFetch = gnssNumbers.slice(0, maxBubbles);

      const fetchedBubbles: BubbleData[] = [];

      // Fetch in batches to avoid overwhelming the server
      for (let i = 0; i < numbersToFetch.length; i += batchSize) {
        const batch = numbersToFetch.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map(async (gnssNum) => {
            const response = await fetch(`${NFT_API}/${gnssNum}`);
            if (!response.ok) throw new Error(`Failed to fetch GNSS ${gnssNum}`);
            const data: NftResponse = await response.json();

            return {
              gnssNum: gnssNum.toString(),
              imageUrl: data.image,
              memCount: data.mems?.length || 0,
              name: data.name,
              attributes: data.attributes || [],
            };
          })
        );

        // Collect successful results
        for (const result of batchResults) {
          if (result.status === "fulfilled") {
            fetchedBubbles.push(result.value);
          }
        }

        // Update state progressively so user sees bubbles appearing
        if (fetchedBubbles.length > 0) {
          const sorted = [...fetchedBubbles].sort((a, b) => b.memCount - a.memCount);
          const counts = sorted.map((b) => b.memCount).filter((c) => c > 0);
          const max = counts.length > 0 ? Math.max(...counts) : 1;
          const min = counts.length > 0 ? Math.min(...counts) : 0;

          setBubbles(sorted);
          setMaxCount(max);
          setMinCount(min);
        }
      }

      // Final sort and update
      const sorted = fetchedBubbles.sort((a, b) => b.memCount - a.memCount);
      const counts = sorted.map((b) => b.memCount).filter((c) => c > 0);
      const max = counts.length > 0 ? Math.max(...counts) : 1;
      const min = counts.length > 0 ? Math.min(...counts) : 0;

      setBubbles(sorted);
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
