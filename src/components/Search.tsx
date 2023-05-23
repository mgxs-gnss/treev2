import { SearchRounded } from "@mui/icons-material";
import { IconButton, InputBase, Paper, Stack, useTheme } from "@mui/material";
import { useState } from "react";
import { Mems } from "../interfaces";

interface Props {
  onSearch?(num: string): void;
  images: Mems[];
}

const Search = ({ onSearch, images }: Props) => {
  const [text, setText] = useState("");
  const [notFound, setNotFound] = useState(false);
  const theme = useTheme();

  const onSubmit = () => {
    const index = images.findIndex(
      (a) => a.url.split("_")[1].split(".")[0].indexOf(text) > -1
    );

    setNotFound(false);

    if (text === "" || index === -1) {
      index === -1 && setNotFound(true);
      onSearch?.("");
    } else {
      onSearch?.(index.toString());
    }
  };

  const onChangeText = (text: string) => {
    setNotFound(false);
    setText(text.replace(/[\D\s]/, ""));
  };

  return (
    <Paper
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      sx={{
        p: 1,
        background: notFound
          ? theme.palette.error.main
          : theme.palette.grey[800],
      }}
    >
      <Stack
        direction="row"
        justifyItems="center"
        alignItems="center"
        spacing={2}
      >
        <InputBase
          color="primary"
          value={text}
          onChange={(event) => onChangeText(event.target.value)}
          inputProps={{
            inputMode: "numeric",
            maxLength: 4,
          }}
          sx={{
            borderRadius: "20px",
            border: "0 !important",
            width: "100px",
            boxShadow: "none",
          }}
        />
        <IconButton onClick={onSubmit}>
          <SearchRounded />
        </IconButton>
      </Stack>
    </Paper>
  );
};

export { Search };
