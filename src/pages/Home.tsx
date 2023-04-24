import { Box, CircularProgress, Typography } from "@mui/material";
import { WheelEvent, useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";

let wheelTimer: ReturnType<typeof setTimeout> | undefined;

const Home = () => {
  const [images, setImages] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [wheeling, setWheeling] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const images = await (
          await fetch("https://api.mgxs.co/mem/list")
        ).json();
        if (Array.isArray(images)) {
          setImages(images.filter((i) => i.indexOf(".jpg") > -1));
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [setImages]);

  const size = 80;
  const w = 1152;
  const h = 1568;
  const perc = 0.3;
  const ratio = w / h;

  const onNext = () => {
    setCurrent(Math.min(current + 1, images.length - 1));
  };

  const onPrev = () => {
    setCurrent(Math.max(current - 1, 0));
  };

  const onWheel = (event: WheelEvent) => {
    if (!wheeling) {
      if (event.deltaY > 0) {
        onNext();
      } else if (event.deltaY < 0) {
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
    }, 25); // Replace with your desired debounce delay
  };

  const handlers = useSwipeable({
    onSwipedUp: onNext,
    onSwipedDown: onPrev,
    onSwipedLeft: onNext,
    onSwipedRight: onPrev,
  });

  const OFFSET = 20;

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
      <Typography variant="h6" textAlign="center" p={6} zIndex={10000}>
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
          src={i
            .split(
              "https://s3.eu-west-2.amazonaws.com/generated.ai.mgxs.co/mem/"
            )
            .join("https://generated-ai.mgxs.co/")}
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transformOrigin: "center",
            transform: `perspective(${10000}px) translate(-50%, calc(-50% + ${
              (key - current) * OFFSET
            }px)) scale(${
              key === current
                ? 1
                : 1 - Math.abs(key - current) / (images.length * 2)
            })`,
            height: `${Math.round(size / ratio)}vw`,
            width: `${size}vw`,
            maxWidth: w * perc,
            maxHeight: h * perc,
            transition: "all .3s ease-in-out",
            filter: `brightness(${key === current ? 1 : 0.2}) blur(${
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
