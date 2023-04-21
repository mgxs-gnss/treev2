import { Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { Autoplay, EffectCards, Mousewheel } from "swiper";
import "swiper/css";
import "swiper/css/effect-cards";
import { Swiper, SwiperSlide } from "swiper/react";
import "./home.css";
import { FreeMode } from "swiper";

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

  const size = 80;
  const ratio = 1152 / 1568;

  return (
    <>
      {/* {!images && ( */}
      <CircularProgress
        sx={{
          position: "absolute",
          top: "calc(50% - 20px)",
          left: "calc(50% - 20px)",
        }}
      />
      {/* )} */}
      {images && images.length > 0 && (
        <Swiper
          style={{ transform: "rotate(90deg)" }}
          effect={"cards"}
          grabCursor
          centeredSlides
          freeMode
          cardsEffect={{
            slideShadows: false,
            perSlideRotate: 10,
            perSlideOffset: 10,
          }}
          autoplay={{ pauseOnMouseEnter: true, delay: 2000 }}
          mousewheel
          modules={[EffectCards, FreeMode, Autoplay, Mousewheel]}
        >
          {images &&
            images?.map((i, key) => (
              <SwiperSlide key={key}>
                <Box
                  sx={{
                    backgroundImage: `url(${i})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    height: `${Math.round(size / ratio)}vw`,
                    width: `${size}vw`,
                  }}
                />
              </SwiperSlide>
            ))}
        </Swiper>
      )}
    </>
  );
};

export { Home };
