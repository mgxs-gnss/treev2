import { Box, useTheme } from "@mui/material";

interface IMem {
  active?: number;
  src: string;
  index: number;
}

const Mem = ({ active, src, index }: IMem) => {
  const theme = useTheme();

  const isHighlighted = active === index;

  return (
    <Box
      id={index.toString()}
      component="img"
      loading="lazy"
      src={src}
      alt=""
      sx={{
        objectFit: "cover",
        width: "100%",
        height: `${(window.innerWidth / 8) * 1.2}px`,
        transform: isHighlighted ? "scale(1.4)" : "scale(1)",
        boxShadow: isHighlighted
          ? `20px 20px 50px ${theme.palette.grey[900]}`
          : "0px 0px 0px black",
        zIndex: isHighlighted ? "1" : "0",
        transition: "transform, boxShadow 0.1s ease-in-out",
        opacity: isHighlighted ? "1" : ".9",
        outline: isHighlighted
          ? `.7rem solid ${theme.palette.grey[700]}`
          : "none",
      }}
    />
  );
};

export { Mem };
