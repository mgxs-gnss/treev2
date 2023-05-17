import { useEffect, useState } from "react";
import { JSONData } from "../interfaces";
import { setColumns } from "../utils";

interface Mems {
  owner: string;
  url: string;
}

const useMemImages = (highlightedIndex?: number) => {
  const [images, setImages] = useState<Mems[]>([]);
  const [imageCount, setImageCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [jsonData, setJsonData] = useState<JSONData>();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const imagesLoaded = await (
          await fetch("https://api.mgxs.co/mem/list")
        ).json();

        setImageCount(imagesLoaded.length);
        setImages(imagesLoaded);
        setColumns(imagesLoaded.length);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [setImages]);

  useEffect(() => {
    const loadJson = async (index: number) => {
      try {
        const jsonURL = images[index].url.replace(".jpg", ".json");
        const data = await (await fetch(jsonURL)).json();
        const imgName = images[index].url;
        const lastIndexSlash = imgName.lastIndexOf("/") + 1;
        const gnssNum = imgName
          .substring(lastIndexSlash, imgName.length)
          .replace(".jpg", "")
          .split("_")[1];

        setJsonData({ creator: images[index].owner, gnssNum, ...data });
      } catch (error) {
        console.error("Error fetching JSON file:", error);
      }
    };

    highlightedIndex !== undefined &&
      images.length > 0 &&
      loadJson(highlightedIndex);
  }, [highlightedIndex, images]);

  return { images, loading, imageCount, jsonData };
};

export { useMemImages };
