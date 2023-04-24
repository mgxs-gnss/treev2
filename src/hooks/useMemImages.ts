import { useState, useEffect } from "react";

const useMemImages = () => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const images = await (
          await fetch("https://api.mgxs.co/mem/list")
        ).json();
        if (Array.isArray(images)) {
          setImages(
            images
              .filter((i) => i.indexOf(".jpg") > -1)
              .map((i) =>
                i.replace(
                  "https://s3.eu-west-2.amazonaws.com/generated.ai.mgxs.co/mem/",
                  "https://generated-ai.mgxs.co/"
                )
              )
          );
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [setImages]);

  return { images, loading };
};

export { useMemImages };
