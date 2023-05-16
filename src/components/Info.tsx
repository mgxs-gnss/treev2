import { Info as InfoIcon } from "@mui/icons-material";
import { Card, Divider, Fab, Stack } from "@mui/material";
import { useState } from "react";
import { Paragraph } from "./Paragraph";

interface IInfo {
  imageCount: number;
  jsonData?: Record<string, any>;
}

const Info = ({ imageCount, jsonData }: IInfo) => {
  const [opened, setOpened] = useState(false);
    const gnssAttribute = jsonData?.attributes?.find((attr: any) => attr.trait_type === 'GNSS');

  return (
    <>
      <Fab
        sx={{ position: "fixed", top: 0, right: 0, m: 2 }}
        color="primary"
        variant="circular"
        onClick={() => setOpened(!opened)}
      >
        <InfoIcon />
      </Fab>
      <Card
        sx={{
          width: "300px",
          padding: "20px",
          position: "fixed",
          top: 0,
          left: 0,
          transition: "transform .2s ease-in-out",
          transform: `translate(${opened ? 0 : "-100%"})`,
          zIndex: 2,
          height: "auto",
          maxHeight: "100vh",
          overflowY: "scroll",
        }}
      >
        <Stack spacing={1}>
          <Paragraph variant="subtitle2">
            <Paragraph variant="inherit" bold>
              Number of MEMs:
            </Paragraph>{" "}
            {imageCount}
          </Paragraph>
          <Divider />

          {jsonData && (

            <>
                {gnssAttribute && (
                  <Paragraph>

                    <a
                      href={`https://opensea.io/assets/ethereum/0xa1de9f93c56c290c48849b1393b09eb616d55dbb/${gnssAttribute.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                          <img
                            src={`https://assets.mgxs.co/${gnssAttribute.value}.png`}
                            alt="GNSS Attribute"
                            style={{ width: '100px', display: 'block', marginLeft: 'auto',  marginRight: 'auto'}}
                          />
                    </a>
                  </Paragraph>
                )}
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
              <Divider />
              <Paragraph variant="subtitle2" bold>
                Attributes:
              </Paragraph>

              {jsonData.attributes.map((attr: any, index: number) => (
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
    </>
  );
};

export { Info };
