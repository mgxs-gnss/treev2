import { Box, CircularProgress, Typography } from "@mui/material";
import { memo, useMemo, useState, useCallback } from "react";
import {
  TransformWrapper,
  TransformComponent,
  getMatrixTransformStyles,
} from "react-zoom-pan-pinch";
import { useBubbleData, BubbleData } from "../hooks/useBubbleData";
import { isMobile } from "../utils";

const MIN_BUBBLE_SIZE = 60;
const MAX_BUBBLE_SIZE = 300;

interface BubbleProps {
  data: BubbleData;
  size: number;
  onSelect: (data: BubbleData) => void;
  isSelected: boolean;
}

const Bubble = memo(function Bubble({ data, size, onSelect, isSelected }: BubbleProps) {
  return (
    <div
      className={`bubble ${isSelected ? "bubble-selected" : ""}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
      onClick={() => onSelect(data)}
    >
      <img
        src={data.imageUrl}
        alt={data.name || `GNSS ${data.gnssNum}`}
        loading="lazy"
        decoding="async"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "50%",
        }}
      />
      {data.memCount > 0 && <div className="bubble-count">{data.memCount}</div>}
    </div>
  );
});

const BubbleInfo = memo(function BubbleInfo({ data }: { data: BubbleData | null }) {
  if (!data) {
    return (
      <Box className="bubble-info">
        <Typography variant="body2" color="text.secondary">
          Click a bubble to see details
        </Typography>
      </Box>
    );
  }

  // Get key attributes to display
  const specie = data.attributes?.find((a) => a.trait_type === "Specie")?.value;
  const subspecie = data.attributes?.find((a) => a.trait_type === "Subspecie")?.value;

  return (
    <Box className="bubble-info">
      <Typography variant="h6">{data.name || `GNSS #${data.gnssNum}`}</Typography>
      <Typography variant="body1" color="primary" sx={{ fontWeight: "bold" }}>
        {data.memCount} MEM{data.memCount !== 1 ? "s" : ""}
      </Typography>
      {specie && (
        <Typography variant="body2" color="text.secondary">
          {specie}{subspecie && subspecie !== "None" ? ` / ${subspecie}` : ""}
        </Typography>
      )}
      <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <a
          href={`https://opensea.io/assets/ethereum/0x769ed5662d86b8c29bce4df6a8684473a4def783/${data.gnssNum}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1976d2", fontSize: "0.875rem" }}
        >
          OpenSea
        </a>
        <a
          href={`https://embed.mgxs.co/${data.gnssNum}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1976d2", fontSize: "0.875rem" }}
        >
          View Live
        </a>
      </Box>
    </Box>
  );
});

const BubbleViewMemo = () => {
  const { bubbles, loading, maxCount, minCount } = useBubbleData();
  const [selectedBubble, setSelectedBubble] = useState<BubbleData | null>(null);
  const isMob = useMemo(() => isMobile(), []);

  const handleSelect = useCallback((data: BubbleData) => {
    setSelectedBubble((prev) => (prev?.gnssNum === data.gnssNum ? null : data));
  }, []);

  // Calculate bubble size based on MEM count
  const calculateSize = useCallback(
    (count: number) => {
      if (maxCount === minCount) return (MIN_BUBBLE_SIZE + MAX_BUBBLE_SIZE) / 2;

      // Use sqrt scale for better visual distribution
      const normalizedCount = (count - minCount) / (maxCount - minCount);
      const sqrtScale = Math.sqrt(normalizedCount);

      return MIN_BUBBLE_SIZE + sqrtScale * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE);
    },
    [maxCount, minCount]
  );

  const bubbleElements = useMemo(() => {
    // Limit bubbles on mobile
    const displayBubbles = isMob ? bubbles.slice(0, 100) : bubbles;

    return displayBubbles.map((bubble) => (
      <Bubble
        key={bubble.gnssNum}
        data={bubble}
        size={calculateSize(bubble.memCount)}
        onSelect={handleSelect}
        isSelected={selectedBubble?.gnssNum === bubble.gnssNum}
      />
    ));
  }, [bubbles, calculateSize, handleSelect, selectedBubble, isMob]);

  // Show loading spinner only when we have no bubbles yet
  if (loading && bubbles.length === 0) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading GNSS...
        </Typography>
      </Box>
    );
  }

  if (!loading && bubbles.length === 0) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Failed to load GNSS data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please try refreshing the page
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <BubbleInfo data={selectedBubble} />
      <TransformWrapper
        centerOnInit
        initialScale={1}
        maxScale={3}
        minScale={isMob ? 0.3 : 0.2}
        limitToBounds={false}
        customTransform={(x: number, y: number, scale: number) =>
          getMatrixTransformStyles(x, y, scale)
        }
        wheel={{ step: 0.2 }}
      >
        <TransformComponent>
          <div className="bubble-container">{bubbleElements}</div>
        </TransformComponent>
      </TransformWrapper>
    </>
  );
};

export const BubbleView = memo(BubbleViewMemo);
