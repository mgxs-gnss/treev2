import { Typography, TypographyProps } from "@mui/material";

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

export { Paragraph };
