import { Box, CircularProgress, Typography } from "@mui/material";
import { WheelEvent, useState } from "react";
import { useSwipeable } from "react-swipeable";
import { useInterval, useMemImages } from "../hooks";

let wheelTimer: ReturnType<typeof setTimeout> | undefined;

const OFFSET = 30;

const Home = () => {
  const [current, setCurrent] = useState(0);
  const { loading, images } = useMemImages();

  const [wheeling, setWheeling] = useState(false);

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

  const onPrev = () => {
    clearInterval();
    setCurrent((current) => {
      let next = current - 1;
      if (next < 0) {
        next = images.length - 1;
      }
      autoPlay();
      return next;
    });
  };

  const { autoPlay, clearInterval } = useInterval({ callback: onNext });

  const size = 80;
  const w = 1152;
  const h = 1568;
  const perc = 0.4;
  const ratio = w / h;

  const onWheel = (event: WheelEvent) => {
    if (!wheeling) {
      if (event.deltaY > 0) {
        clearInterval();
        onNext();
      } else if (event.deltaY < 0) {
        clearInterval();
        onPrev();
      }

      setWheeling(true);
    }

    if (wheelTimer) {
      clearTimeout(wheelTimer);
    }

    wheelTimer = setTimeout(() => {
      setWheeling(false);
      wheelTimer = undefined;
    }, 35); // Replace with your desired debounce delay
  };

  const handlers = useSwipeable({
    onSwipedUp: onNext,
    onSwipedDown: onPrev,
    onSwipedLeft: onNext,
    onSwipedRight: onPrev,
  });

  const isHome = new URLSearchParams(window.location.search).get("home");

  return (
    <Box
      {...handlers}
      onWheel={isHome ? undefined : onWheel}
      sx={{
        overflow: "hidden",
        width: "100vw",
        height: "100vh",
        position: "fixed",
      }}
    >
      <Box
        sx={{
          position: "relative",
          textAlign: "center",
          zIndex: 10000,
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
      {images.map((i, key) => (
        <Box
          key={key}
          component="img"
          loading="lazy"
          data-active={key === current}
          src={i}
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
                  position: "fixed",
                  top: "60%",
                  left: "50%",
                  pointerEvents: "none",
                  transformOrigin: "center",
                  transform: `perspective(${20000}px) translate(-50%, calc(-50% + ${
                    (key - current) * OFFSET
                  }px)) scale(${
                    key === current
                      ? 1
                      : 1 - Math.abs(key - current) / (images.length * 1.2)
                  })`,
                  height: `${Math.round(size / ratio)}vw`,
                  width: `${size}vw`,
                  maxWidth: w * perc,
                  maxHeight: h * perc,
                  transition: "all .3s ease-in-out",
                  filter: `brightness(${key === current ? 1 : 0.25}) blur(${
                    key === current ? 0 : `${5}px`
                  })`,
                  zIndex:
                    current === key
                      ? images.length
                      : images.length - current - key,
                }
          }
        />
      ))}
    </Box>
  );
};

export { Home };
