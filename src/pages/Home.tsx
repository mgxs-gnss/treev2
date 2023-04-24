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
  const perc = 0.5;
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

  return (
    <Box
      {...handlers}
      onWheel={onWheel}
      sx={{
        overflow: "hidden",
        width: "100vw",
        height: "100vh",
        position: "fixed",
      }}
    >
      <Typography
        variant="h6"
        textAlign="center"
        p={3}
        position="relative"
        zIndex={10000}
      >
        <Typography color="primary" component="b" variant="h6" fontWeight={800}>
          {images.length}
        </Typography>{" "}
        registered in the Memory Tree until now!
      </Typography>

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
          sx={{
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
              current === key ? images.length : images.length - current - key,
          }}
        />
      ))}
    </Box>
  );
};

export { Home };
