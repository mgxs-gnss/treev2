import { Box, useTheme } from "@mui/material";
import { getColumns } from "../utils";

interface IMem {
  active?: number;
  src: string;
  index: number;
}

const Mem = ({ active, src, index }: IMem) => {
  const theme = useTheme();

  const isHome = new URLSearchParams(window.location.search).has("home");
  const isHighlighted = active === index;

  return (
    <Box
      id={index.toString()}
      component="img"
      loading="lazy"
      src={
        src.indexOf("assets.") > -1
          ? src
          : isHighlighted
          ? src
          : src.replace(".jpg", "_low.jpg")
      }
      alt=""
      sx={{
        objectFit: "cover",
        width: "100%",
        height: `${(window.innerWidth / getColumns()) * 1.2}px`,
        transform: isHighlighted ? ["scale(6.5)", "scale(2.5)"] : "scale(1)",
        willChange: "transform",
        boxShadow: isHighlighted
          ? [
              `0 0 20px ${theme.palette.grey[900]}`,
              `20px 20px 50px ${theme.palette.grey[900]}`,
            ]
          : "0px 0px 0px black",
        zIndex: isHighlighted ? "1" : "0",
        transition: "all 0.1s ease-in-out",
        opacity: isHighlighted ? "1" : isHome ? 1 : ".6",
        outline: isHighlighted
          ? [`.1rem solid rgb(225, 225, 225)`, `.5rem solid rgb(225, 225, 225)`]
          : "none",
      }}
    />
  );
};

export { Mem };
