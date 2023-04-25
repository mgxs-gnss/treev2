import { Box, CircularProgress, Modal, Typography } from "@mui/material";
import { useState } from "react";
import { useInterval, useMemImages } from "../hooks";

const Home = () => {
  const [current, setCurrent] = useState(0);
  const { loading, images } = useMemImages();
  const [modalImage, setModalImage] = useState<string>();

  const isHome = !!new URLSearchParams(window.location.search).get("home");

  const onNext = () => {
    clearInterval();
    setCurrent((current) => {
      let next = current + 1;
      if (next > images.length - 1) {
        next = 0;
      }

      autoPlay();
      return next;
    });
  };

  const { autoPlay, clearInterval } = useInterval({
    active: isHome,
    callback: onNext,
  });

  // const size = 80;
  // const w = 1152;
  const h = 1568;
  const perc = 0.2;
  // const ratio = w / h;

  return (
    <Box
      sx={{
        width: "100vw",
      }}
    >
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          textAlign: "center",
          zIndex: 50,
          backgroundImage:
            "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
        }}
      >
        <Typography variant="h6" p={3} position="relative">
          <Typography
            color="primary"
            component="b"
            variant="h6"
            fontWeight={800}
          >
            {images.length}
          </Typography>{" "}
          registered in the Memory Tree until now!
        </Typography>
      </Box>

      {loading && (
        <CircularProgress
          sx={{
            position: "absolute",
            top: "calc(50% - 20px)",
            left: "calc(50% - 20px)",
          }}
        />
      )}
      <Box
        sx={
          !isHome
            ? {
                display: "grid",
                gridTemplateColumns: [
                  `repeat(auto-fill, minmax(auto, 50vw))`,
                  `repeat(auto-fill, minmax(auto, 33vw))`,
                  `repeat(auto-fill, minmax(auto, 20vw))`,
                ],
              }
            : undefined
        }
      >
        {images.map((i, key) => (
          <Box
            key={key}
            component="img"
            loading="lazy"
            src={i}
            onClick={
              !isHome
                ? () => {
                    setModalImage(i);
                  }
                : undefined
            }
            sx={
              isHome
                ? {
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "all .3s ease-in-out",
                    opacity: key === current ? "100%" : 0,
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }
                : {
                    // boxShadow: "0 0 16px rgba(0, 0, 0, 1)",
                    maxHeight: h * perc,
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                    transition: "all .2s ease-in-out",
                    filter: "brightness(.4) grayscale(1)",
                    cursor: "pointer",
                    "&:hover": {
                      filter: "brightness(1)",
                      transform: "scale(1.1)",
                      zIndex: 10,
                    },
                  }
            }
          />
        ))}
      </Box>
      <Modal
        sx={{ zIndex: 100 }}
        slotProps={{
          backdrop: { style: { backgroundColor: "rgba(0,0,0,.8)" } },
        }}
        open={!!modalImage}
      >
        <Box
          component="img"
          loading="lazy"
          src={modalImage}
          onClick={() => {
            setModalImage(undefined);
          }}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </Modal>
    </Box>
  );
};

export { Home };
