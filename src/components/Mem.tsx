import { useTheme } from "@mui/material";
import { memo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

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

  return (
    <div
      ref={ref}
      id={index}
      data-container
      style={{
        transform: `perspective(500px) translateZ(${isHighlighted ? 10 : 0}em)`,
        width: `${576 / 4}px`,
        height: `${768 / 4}px`,
        background: "transparent",
        objectFit: "cover",

        boxShadow: isHighlighted
          ? `20px 20px 50px ${theme.palette.grey[900]}`
          : "0px 0px 0px black",
        zIndex: isHighlighted ? "1" : "0",
        transition: "all 0.1s ease-in-out",
        opacity: isHighlighted ? "1" : isHome ? 1 : ".2",
        outline: isHighlighted ? `.7rem solid rgb(225, 225, 225)` : "none",
      }}
    >
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
          width: `${576 / 4}px`,
          height: `${768 / 4}px`,
        }}
      />
    </div>
  );
});

export { Mem };
