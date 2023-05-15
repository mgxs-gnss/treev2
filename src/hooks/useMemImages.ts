import { useState, useEffect } from "react";

const useMemImages = (highlightedIndex?: number) => {
  const [images, setImages] = useState<string[]>([]);
  const [imageCount, setImageCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [jsonData, setJsonData] = useState<Record<string, any>>();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const imagesLoaded = await (
          await fetch("https://api.mgxs.co/mem/list")
        ).json();

        setImageCount(imagesLoaded.length);
        setImages(imagesLoaded);
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
        const jsonURL = images[index].replace(".jpg", ".json");
        const data = await (await fetch(jsonURL)).json();
        setJsonData(data);
      } catch (error) {
        console.error("Error fetching JSON file:", error);
      }
    };

    highlightedIndex && loadJson(highlightedIndex);
  }, [highlightedIndex, images]);

  return { images, loading, imageCount, jsonData };
};

export { useMemImages };
