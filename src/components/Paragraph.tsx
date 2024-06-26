import { Typography, TypographyProps } from "@mui/material";
import { memo } from "react";

interface IParagraph extends TypographyProps {
  bold?: boolean;
}

const Paragraph = ({ children, bold, ...props }: IParagraph) => (
  <Typography
    variant="caption"
    {...props}
    {...(bold && {
      fontWeight: "bold",
      color: "primary",
      component: "span",
    })}
  >
    {children}
  </Typography>
);

const areEqual = (prevProps: IParagraph, nextProps: IParagraph) => {
  return (
    prevProps.children === nextProps.children &&
    prevProps.bold === nextProps.bold &&
    (Object.keys(prevProps) as (keyof IParagraph)[]).every(
      (key) => prevProps[key] === nextProps[key]
    )
  );
};
export default memo(Paragraph, areEqual);
