import { SearchRounded } from "@mui/icons-material";
import { IconButton, InputBase, Paper, Stack } from "@mui/material";
import { useState } from "react";

interface Props {
  onSearch?(num: string): void;
}

const Search = ({ onSearch }: Props) => {
  const [text, setText] = useState("");
  return (
    <Paper
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch?.(text);
      }}
      sx={{
        p: 1,
      }}
    >
      <Stack
        direction="row"
        justifyItems="center"
        alignItems="center"
        spacing={2}
      >
        <InputBase
          color="secondary"
          value={text}
          onChange={(event) =>
            setText(event.target.value.replace(/[\D\s]/, ""))
          }
          inputProps={{
            inputMode: "numeric",
            maxLength: 4,
          }}
          sx={{
            borderRadius: "10px",
            ml: 2,
            border: "0 !important",
            boxShadow: "none",
          }}
        />
        <IconButton
          onClick={() => {
            onSearch?.(text);
          }}
        >
          <SearchRounded />
        </IconButton>
      </Stack>
    </Paper>
  );
};

export { Search };
