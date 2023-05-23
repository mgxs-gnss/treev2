import { CONTRACT_REVEAL_ADDRESS } from "@gnss/web3";
import { AlignHorizontalCenter, Info as InfoIcon } from "@mui/icons-material";
import { Box, Card, Chip, Divider, Fab, Link, Stack } from "@mui/material";
import { useState } from "react";
import { JSONData, Mems } from "../interfaces";
import { compressAddress } from "../utils";
import { Paragraph } from "./Paragraph";
import { Search } from "./Search";

interface IInfo {
  imageCount: number;
  jsonData?: JSONData;
  images: Mems[];
  onChange?(num: string): void;
}

const filterOutAttrs = [
  "GNSS",
  "A",
  "B",
  "C",
  "Strength A",
  "Strength B",
  "Strength C",
  "Ratio",
  "Shape",
  "Fractal",
  "TCfg1",
  "TCfg2",
  "TCfg3",
  "Tst1",
  "Tst2",
  "Tst3",
  "Saturation",
  "Pallete",
];

const Info = ({ imageCount, jsonData, images, onChange }: IInfo) => {
  const [opened, setOpened] = useState(false);

  return (
    <Box position="fixed" zIndex={100}>
      <Box sx={{ position: "fixed", zIndex: 6, top: 0, right: 0 }} p={[2, 4]}>
        <Fab
          color="primary"
          variant="circular"
          onClick={() => setOpened(!opened)}
        >
          <InfoIcon />
        </Fab>
      </Box>
      <Card
        sx={{
          m: 1,
          width: "300px",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 7,
          height: "auto",
          maxHeight: "100vh",
          overflowY: "scroll",
          padding: 3,
          transition: "transform .2s ease-in-out",
          transform: `translate(${opened ? 0 : "-120%"})`,
        }}
      >
        <Stack spacing={1}>
          {jsonData && (
            <>
              <Paragraph>
                <Paragraph variant="inherit" bold>
                  Name:
                </Paragraph>{" "}
                {jsonData.name}
              </Paragraph>
              <Paragraph>
                <Paragraph variant="inherit" bold>
                  Description:
                </Paragraph>{" "}
                {jsonData.description}
              </Paragraph>
              <Paragraph>
                <Paragraph variant="inherit" bold>
                  Creator:
                </Paragraph>{" "}
                {compressAddress(jsonData.creator)}
              </Paragraph>

              <Divider style={{ margin: "20px 0 15px" }} />
              <Paragraph variant="subtitle2" bold>
                GNSS #{jsonData.gnssNum}
              </Paragraph>
              <Box>
                <Link
                  href={`https://opensea.io/assets/ethereum/${CONTRACT_REVEAL_ADDRESS}/${jsonData.gnssNum}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Box
                    component="img"
                    src={`https://assets.mgxs.co/thumbs/${jsonData.gnssNum}.jpg`}
                    alt="GNSS Attribute"
                    width="100%"
                  />
                </Link>
              </Box>

              {jsonData.attributes
                .filter((attr) => !filterOutAttrs.includes(attr.trait_type))
                .map((attr, index) => (
                  <Paragraph key={index}>
                    <Paragraph variant="inherit" bold>
                      {attr.trait_type}:
                    </Paragraph>{" "}
                    {JSON.stringify(attr.value)}
                  </Paragraph>
                ))}
            </>
          )}
        </Stack>
      </Card>

      <Stack
        direction={["column", "row"]}
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{
          position: "fixed",
          zIndex: 5,
          top: ["20px", 0],
          width: "100%",
        }}
      >
        <Search images={images} onSearch={onChange} />
        <Box p={[2, 4]}>
          <Chip
            icon={<AlignHorizontalCenter />}
            color="secondary"
            label={`MEMs: ${imageCount}`}
            sx={{
              boxShadow: 5,
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export { Info };
