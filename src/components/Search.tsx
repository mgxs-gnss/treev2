import { SearchRounded } from "@mui/icons-material";
import {
  Autocomplete,
  IconButton,
  Stack,
  TextField,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { Mems } from "../interfaces";

interface Props {
  onSearch?(num: string): void;
  images: Mems[];
}

const Search = ({ onSearch, images }: Props) => {
  const [text, setText] = useState<string | null>(null);
  const theme = useTheme();

  const options = useMemo(
    () => [
      ...new Set(
        images
          .filter((a) => a.owner !== "Anonymous" && !a.owner.includes("0x"))
          .map((a) => ({ ...a, gnss: a.url.split("_")[1].split(".")[0] }))
          .sort((a, b) => Number(a.gnss) - Number(b.gnss))
      ),
    ],
    [images]
  );

  const onSubmit = () => {
    text && onSearch?.(text);
  };

  const onChangeText = (text: string) => {
    text && setText(text);
  };

  const compareValueToOption = (option: any, value: any) =>
    option.gnss === value.gnss;

  //4197
  return (
    <Stack
      direction="row"
      component="form"
      sx={{
        borderRadius: "20px",
        border: "0 !important",
        boxShadow: "none",
        background: theme.palette.grey[800],
      }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Autocomplete
        isOptionEqualToValue={compareValueToOption}
        getOptionLabel={(options) => options.gnss}
        onInputChange={(_, newInputValue) => {
          onChangeText(newInputValue);
        }}
        onChange={(_, newValue) => {
          onChangeText(newValue?.url || "");
        }}
        options={options}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            sx={{
              fieldSet: {
                border: "0 !important",
              },
              borderRadius: "20px",
              border: "0 !important",
              width: "160px",
              boxShadow: "none",
            }}
            label="GNSS Number"
          />
        )}
      />
      <IconButton onClick={onSubmit}>
        <SearchRounded />
      </IconButton>
    </Stack>
  );
};

export { Search };
