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
  const w = 1152;
  const h = 1568;
  const perc = 0.3;
  const ratio = w / h;

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
                    backgroundImage: `url(${i
                      .split(
                        "https://s3.eu-west-2.amazonaws.com/generated.ai.mgxs.co/mem/"
                      )
                      .join("https://generated-ai.mgxs.co/")})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    height: `${Math.round(size / ratio)}vw`,
                    width: `${size}vw`,
                    maxWidth: w * perc,
                    maxHeight: h * perc,
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
