import { Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";

const Home = () => {
  const [images, setImages] = useState<string[]>();

  useEffect(() => {
    const load = async () => {
      try {
        const images = await (
          await fetch("https://api.mgxs.co/mem/list")
        ).json();
        if (Array.isArray(images)) {
          setImages(images);
        }
      } catch (e) {
        console.log(e);
      }
    };

    load();
  }, [setImages]);

  const w = 1152;
  const h = 1568;
  const perc = 0.3;

  return (
    <Box
      display="grid"
      maxWidth="100vw"
      overflow="hidden"
      gap={1}
      gridTemplateColumns={`repeat( auto-fit, minmax(${w * perc}px, 1fr) )`}
      justifyItems="center"
    >
      {!images && (
        <CircularProgress
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      {images &&
        images?.map((i, key) => (
          <Box
            sx={{
              backgroundImage: `url(${i})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              width: "100%",
              height: `${h * perc}px`,
            }}
            key={key}
          />
        ))}
    </Box>
  );
};

export { Home };
