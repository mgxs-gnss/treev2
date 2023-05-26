import { useEffect, useState } from "react";
import { JSONData, Mems } from "../interfaces";
import { getRandomGNSS, setColumns } from "../utils";

interface Data {
  images: Mems[];
  count: number;
}

const useMemImages = (highlightedIndex?: number, isGNSS?: boolean) => {
  const [data, setData] = useState<Data>();
  const [loading, setLoading] = useState<boolean>(false);
  const [jsonData, setJsonData] = useState<JSONData>();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let images;

        if (!isGNSS) {
          images = await (await fetch("https://api.mgxs.co/mem/list")).json();
        } else {
          const randArray = getRandomGNSS();
          images = randArray.map((a) => ({
            owner: "",
            url: `https://assets.mgxs.co/${a}.png`,
          }));
        }

        const count = images.length;

        setData({ images, count });
        setColumns(count);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    !data && !loading && load();
  }, [data, setData, loading, isGNSS]);

  useEffect(() => {
    const loadJson = async (index: number) => {
      try {
        if (!data) return;
        const { images } = data;
        const jsonURL = images[index].url.replace(".jpg", ".json");
        const jsonData = await (await fetch(jsonURL)).json();
        const imgName = images[index].url;
        const lastIndexSlash = imgName.lastIndexOf("/") + 1;
        const gnssNum = imgName
          .substring(lastIndexSlash, imgName.length)
          .replace(".jpg", "")
          .split("_")[1];

        setJsonData({ creator: images[index].owner, gnssNum, ...jsonData });
      } catch (error) {
        console.error("Error fetching JSON file:", error);
      }
    };

    data &&
      highlightedIndex !== undefined &&
      data.images.length > 0 &&
      loadJson(highlightedIndex);
  }, [highlightedIndex, data]);

  return {
    images: data?.images,
    loading,
    imageCount: data?.count,
    jsonData,
  };
};

export { useMemImages };
