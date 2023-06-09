import { Box, useTheme } from "@mui/material";
import { useSearchParams } from "react-router-dom";

interface IMem {
  active?: number;
  src: string;
  index: number;
}

const Mem = ({ active, src, index }: IMem) => {
  const theme = useTheme();

  const [search] = useSearchParams();
  const isHome = search.has("home");

  const isHighlighted = active === index;

  return (
    <Box
      id={index.toString()}
      component="img"
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
        transform: `perspective(500px) translateZ(${isHighlighted ? 10 : 0}em)`,
        width: `${576 / 4}px`,
        height: `${768 / 4}px`,
      }}
      sx={{
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
    />
  );
};

export { Mem };
