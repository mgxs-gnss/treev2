import { Box, CircularProgress, Modal, Typography } from "@mui/material";
import { useState } from "react";
import { useMemImages } from "../hooks";

const Home = () => {
  const { loading, images } = useMemImages();
  const [modalImage, setModalImage] = useState<string>();

  const columns = 10; // Change this to the desired number of columns

  return (
    <Box
      sx={{
        width: "100vw",
        padding: "16px",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridGap: "16px",
        }}
      >
        {images.map((i, key) => (
          <Box
            key={key}
            component="img"
            loading="lazy"
            src={i}
            onClick={() => {
              setModalImage(i);
            }}
            sx={{
              width: "100%",
              height: "auto",
              objectFit: "cover",
              cursor: "pointer",
              transition: "all .2s ease-in-out",
              "&:hover": {
                transform: "scale(1.1)",
                zIndex: 10,
              },
            }}
          />
        ))}
      </Box>
      <Modal
        sx={{ zIndex: 100 }}
        slotProps={{
          backdrop: { style: { backgroundColor: "rgba(0,0,0,.8)" } },
        }}
        open={!!modalImage}
      >
        <Box
          component="img"
          loading="lazy"
          src={modalImage}
          onClick={() => {
            setModalImage(undefined);
          }}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </Modal>
      {loading && (
        <CircularProgress
          sx={{
            position: "absolute",
            top: "calc(50% - 20px)",
            left: "calc(50% - 20px)",
          }}
        />
      )}
    </Box>
  );
};

export { Home };
