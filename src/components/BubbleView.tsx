import { Box, CircularProgress, Typography } from "@mui/material";
import { memo, useState, useCallback, useEffect, useRef } from "react";
import {
  forceSimulation,
  forceCollide,
  forceManyBody,
  forceX,
  forceY,
  SimulationNodeDatum,
} from "d3-force";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useBubbleData, BubbleData } from "../hooks/useBubbleData";

const MIN_BUBBLE_SIZE = 40;
const MAX_BUBBLE_SIZE = 180;

interface BubbleNode extends SimulationNodeDatum {
  data: BubbleData;
  size: number;
  mass: number; // Combined size and MEM count
}

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

  return (
    <Box className="bubble-info">
      <Typography variant="h6">GNSS #{data.gnssNum}</Typography>
      <Typography variant="body1" color="primary" sx={{ fontWeight: "bold" }}>
        {data.memCount} MEM{data.memCount !== 1 ? "s" : ""}
      </Typography>
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
  const [nodes, setNodes] = useState<BubbleNode[]>([]);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<BubbleNode>> | null>(null);

  // Calculate bubble size based on MEM count
  const calculateSize = useCallback(
    (count: number) => {
      if (maxCount === minCount) return (MIN_BUBBLE_SIZE + MAX_BUBBLE_SIZE) / 2;
      const normalizedCount = (count - minCount) / (maxCount - minCount);
      const sqrtScale = Math.sqrt(normalizedCount);
      return MIN_BUBBLE_SIZE + sqrtScale * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE);
    },
    [maxCount, minCount]
  );

  // Initialize simulation when data loads
  useEffect(() => {
    if (bubbles.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create nodes with initial positions
    const initialNodes: BubbleNode[] = bubbles.map((bubble, i) => {
      const size = calculateSize(bubble.memCount);
      const angle = (i / bubbles.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.25;

      // Mass combines visual size and MEM count for gravitational attraction
      const mass = size * Math.sqrt(bubble.memCount);

      return {
        data: bubble,
        size,
        mass,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      };
    });

    // Create force simulation
    const simulation = forceSimulation<BubbleNode>(initialNodes)
      // Attract all bubbles to center
      .force("x", forceX(width / 2).strength(0.05))
      .force("y", forceY(height / 2).strength(0.05))
      .force(
        "charge",
        forceManyBody<BubbleNode>()
          .strength((d) => d.mass * 0.15) // Mass-based attraction (size * memCount)
          .distanceMax(400)
      )
      .force(
        "collide",
        forceCollide<BubbleNode>()
          .radius((d) => d.size / 2 + 5)
          .strength(0.8)
          .iterations(2)
      )
      .alphaDecay(0.01) // Slower decay for smoother animation
      .velocityDecay(0.3) // More damping
      .on("tick", () => {
        setNodes([...simulation.nodes()]);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [bubbles, calculateSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (simulationRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        simulationRef.current.force("x", forceX(width / 2).strength(0.05));
        simulationRef.current.force("y", forceY(height / 2).strength(0.05));
        simulationRef.current.alpha(0.3).restart();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelect = useCallback((data: BubbleData) => {
    setSelectedBubble((prev) => (prev?.gnssNum === data.gnssNum ? null : data));
  }, []);

  // Reheat simulation on click for some movement
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && simulationRef.current) {
      simulationRef.current.alpha(0.1).restart();
    }
  }, []);

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
        initialScale={1}
        minScale={0.2}
        maxScale={5}
        centerOnInit
        wheel={{ step: 0.1 }}
        panning={{ velocityDisabled: true }}
      >
        <TransformComponent
          wrapperStyle={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
          }}
          contentStyle={{
            width: "100vw",
            height: "100vh",
          }}
        >
          <div
            onClick={handleContainerClick}
            style={{
              position: "relative",
              width: "100vw",
              height: "100vh",
            }}
          >
            {nodes.map((node) => (
              <div
                key={node.data.gnssNum}
                className={`bubble ${selectedBubble?.gnssNum === node.data.gnssNum ? "bubble-selected" : ""}`}
                style={{
                  position: "absolute",
                  left: (node.x ?? 0) - node.size / 2,
                  top: (node.y ?? 0) - node.size / 2,
                  width: node.size,
                  height: node.size,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(node.data);
                }}
              >
                <img
                  src={node.data.imageUrl}
                  alt={`GNSS ${node.data.gnssNum}`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
                {node.data.memCount > 0 && (
                  <div className="bubble-count">{node.data.memCount}</div>
                )}
              </div>
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </>
  );
};

export const BubbleView = memo(BubbleViewMemo);
