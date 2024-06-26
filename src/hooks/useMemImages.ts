import { useCallback, useEffect, useState, useMemo } from "react";
import { JSONData, Mems } from "../interfaces";
import { getRandomGNSS, isMobile, randomArray, setColumns } from "../utils";
import { API } from "../config";

interface Data {
  images: Mems[];
  count: number;
}

const useMemImages = (highlightedIndex?: string, isGNSS?: boolean) => {
  const [data, setData] = useState<Data>();
  const [loading, setLoading] = useState<boolean>(false);
  const [jsonData, setJsonData] = useState<JSONData>();

  const loadJson = useCallback(
    async (index: string) => {
      try {
        if (!data) return;
        const { images } = data;
        const keys = images.filter((a) => a.url === index);

        if (!keys[0]?.url) return;

        const jsonURL = keys[0].url.replace(".jpg", ".json");
        let jsonData = await (await fetch(jsonURL)).json();
        const imgName = keys[0].url;
        const lastIndexSlash = imgName.lastIndexOf("/") + 1;
        const gnssNum = imgName
          .substring(lastIndexSlash, imgName.length)
          .replace(".jpg", "")
          .split("_")[1];

        if (!Array.isArray(jsonData.attributes)) {
          jsonData = {
            ...jsonData,
            attributes: Object.entries(jsonData.attributes).map(
              ([key, value]) => ({ trait_type: key, value })
            ),
          };
        }

        setJsonData({ creator: keys[0].owner, gnssNum, ...jsonData });
      } catch (error) {
        console.error("Error fetching JSON file:", error);
      }
    },
    [data, setJsonData]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      let images;

      if (!isGNSS) {
        images = await (await fetch(`${API}/mem/list`)).json();
      } else {
        const randArray = getRandomGNSS();
        images = randArray.map((a) => ({
          owner: "",
          url: `https://assets.mgxs.co/${a}.jpg`,
        }));
      }

      if (isMobile()) {
        images = randomArray(images, 200);
      }

      const count = images.length;

      setData({ images, count });
      setColumns(count);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [isGNSS]);

  useEffect(() => {
    if (!data) {
      load();
    } else if (
      highlightedIndex !== undefined &&
      highlightedIndex !== null &&
      data.images.length > 0
    ) {
      loadJson(highlightedIndex);
    }
  }, [highlightedIndex, load, data, loadJson]);

  const memoizedData = useMemo(
    () => ({
      images: data?.images,
      loading,
      imageCount: data?.count,
      jsonData,
    }),
    [data, loading, jsonData]
  );

  return memoizedData;
};

export { useMemImages };
