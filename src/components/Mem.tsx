import { useTheme } from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getScale } from "../utils";

interface IMem {
  active?: boolean;
  src: string;
  index: string;
}

const Mem = memo(function Mem({ active: isHighlighted, src, index }: IMem) {
  const theme = useTheme();

  const [search] = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);
  const isHome = search.has("home");

  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setIsIntersecting(entry.isIntersecting);
      });
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      id={index}
      data-container
      style={{
        willChange: "transform, box-shadow, outline, opacity, z-index",
        transform: `perspective(500px) translateZ(${isHighlighted ? 10 : 0}em)`,
        width: `${576 / getScale()}px`,
        height: `${768 / getScale()}px`,
        background: "transparent",
        objectFit: "cover",
        overflow: "hidden",
        boxShadow: isHighlighted
          ? `20px 20px 50px ${theme.palette.grey[900]}`
          : "0px 0px 0px black",
        zIndex: isHighlighted ? "1" : "0",
        transition: "all 0.1s ease-in-out",
        opacity: isHighlighted ? "1" : isHome ? 1 : ".2",
        outline: isHighlighted ? `2rem solid rgb(225, 225, 225)` : "none",
        backgroundImage: `url(${
          isIntersecting
            ? src.replace(".jpg", "_low.jpg")
            : // ? src.indexOf("assets.") > -1 || isHighlighted
              //   ? src
              //   : isHome
              //   ? src
              //   : src.replace(".jpg", "_low.jpg")
              "none"
        })`,
      }}
    >
      {/* {isIntersecting && (
        <img
          loading="lazy"
          src={
            src.indexOf("assets.") > -1 || isHighlighted
              ? src
              : isHome
              ? src
              : src.replace(".jpg", "_low.jpg")
          }
          alt=""
          style={{
            width: `${576}px`,
            height: `${768}px`,
          }}
        />
      )} */}
    </div>
  );
});

export { Mem };
