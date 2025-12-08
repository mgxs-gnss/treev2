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

interface MemNode extends SimulationNodeDatum {
  url: string;
  size: number;
}

const MEM_BUBBLE_SIZE = 50;

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
  const [memNodes, setMemNodes] = useState<MemNode[]>([]);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<BubbleNode>> | null>(null);
  const memSimulationRef = useRef<ReturnType<typeof forceSimulation<MemNode>> | null>(null);

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
    const centerX = width / 2;
    const centerY = height / 2;

    // Sort bubbles by mass (biggest first) for layering
    const sortedBubbles = [...bubbles].sort((a, b) => b.memCount - a.memCount);

    // Find max mass for normalization
    const masses = sortedBubbles.map((b) => {
      const size = calculateSize(b.memCount);
      return size * Math.sqrt(b.memCount);
    });
    const maxMass = Math.max(...masses);

    // Create nodes with initial positions - bigger ones closer to center
    const initialNodes: BubbleNode[] = sortedBubbles.map((bubble, i) => {
      const size = calculateSize(bubble.memCount);
      const mass = size * Math.sqrt(bubble.memCount);
      const normalizedMass = mass / maxMass; // 0 to 1, where 1 is heaviest

      // Bigger bubbles start closer to center, smaller ones further out
      const orbitRadius = Math.min(width, height) * 0.3 * (1 - normalizedMass * 0.8);
      const angle = (i / sortedBubbles.length) * Math.PI * 2 + Math.random() * 0.5;

      // Give smaller bubbles initial tangential velocity for orbital motion
      const orbitalSpeed = (1 - normalizedMass) * 3; // Smaller = faster orbit
      const vx = -Math.sin(angle) * orbitalSpeed;
      const vy = Math.cos(angle) * orbitalSpeed;

      return {
        data: bubble,
        size,
        mass,
        x: centerX + Math.cos(angle) * orbitRadius,
        y: centerY + Math.sin(angle) * orbitRadius,
        vx,
        vy,
      };
    });

    // Create force simulation with orbital dynamics
    const simulation = forceSimulation<BubbleNode>(initialNodes)
      // Center attraction - stronger for heavier bubbles (they stay at center)
      .force(
        "x",
        forceX<BubbleNode>(centerX).strength((d) => 0.03 + (d.mass / maxMass) * 0.1)
      )
      .force(
        "y",
        forceY<BubbleNode>(centerY).strength((d) => 0.03 + (d.mass / maxMass) * 0.1)
      )
      // Repulsion - bubbles push each other away (negative = repel)
      .force(
        "charge",
        forceManyBody<BubbleNode>()
          .strength((d) => -d.mass * 0.8) // Negative for repulsion, scaled by mass
          .distanceMin(20)
          .distanceMax(300)
      )
      // Collision to prevent overlap
      .force(
        "collide",
        forceCollide<BubbleNode>()
          .radius((d) => d.size / 2 + 8)
          .strength(1)
          .iterations(3)
      )
      .alphaDecay(0.008) // Slow decay for continuous motion
      .velocityDecay(0.2) // Some friction to prevent chaos
      .on("tick", () => {
        setNodes([...simulation.nodes()]);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [bubbles, calculateSize]);

  // Store maxMass for resize handler
  const maxMassRef = useRef<number>(1);

  // Update maxMass when bubbles change
  useEffect(() => {
    if (bubbles.length > 0) {
      const masses = bubbles.map((b) => {
        const size = calculateSize(b.memCount);
        return size * Math.sqrt(b.memCount);
      });
      maxMassRef.current = Math.max(...masses);
    }
  }, [bubbles, calculateSize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (simulationRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxMass = maxMassRef.current;

        simulationRef.current.force(
          "x",
          forceX<BubbleNode>(centerX).strength((d) => 0.03 + (d.mass / maxMass) * 0.1)
        );
        simulationRef.current.force(
          "y",
          forceY<BubbleNode>(centerY).strength((d) => 0.03 + (d.mass / maxMass) * 0.1)
        );
        simulationRef.current.alpha(0.3).restart();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelect = useCallback((data: BubbleData) => {
    setSelectedBubble((prev) => (prev?.gnssNum === data.gnssNum ? null : data));
  }, []);

  // Get the position of the selected bubble
  const selectedNode = nodes.find((n) => n.data.gnssNum === selectedBubble?.gnssNum);

  // Create MEM bubble simulation when a bubble is selected
  useEffect(() => {
    // Clean up previous simulation
    if (memSimulationRef.current) {
      memSimulationRef.current.stop();
      memSimulationRef.current = null;
    }

    if (!selectedBubble || !selectedNode) {
      setMemNodes([]);
      return;
    }

    const centerX = selectedNode.x ?? window.innerWidth / 2;
    const centerY = selectedNode.y ?? window.innerHeight / 2;
    const parentRadius = selectedNode.size / 2;

    // Create MEM nodes around the selected bubble
    const initialMemNodes: MemNode[] = selectedBubble.memUrls.map((url, i) => {
      const angle = (i / selectedBubble.memUrls.length) * Math.PI * 2;
      const orbitRadius = parentRadius + MEM_BUBBLE_SIZE + 20;

      return {
        url,
        size: MEM_BUBBLE_SIZE,
        x: centerX + Math.cos(angle) * orbitRadius,
        y: centerY + Math.sin(angle) * orbitRadius,
        vx: -Math.sin(angle) * 2,
        vy: Math.cos(angle) * 2,
      };
    });

    // Create simulation for MEM bubbles
    const memSimulation = forceSimulation<MemNode>(initialMemNodes)
      .force("x", forceX(centerX).strength(0.02))
      .force("y", forceY(centerY).strength(0.02))
      .force(
        "charge",
        forceManyBody<MemNode>().strength(-100).distanceMax(200)
      )
      .force(
        "collide",
        forceCollide<MemNode>()
          .radius((d) => d.size / 2 + 5)
          .strength(1)
      )
      .force(
        "orbit",
        () => {
          // Custom force to keep MEMs orbiting around parent
          initialMemNodes.forEach((node) => {
            const dx = (node.x ?? 0) - centerX;
            const dy = (node.y ?? 0) - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const targetDist = parentRadius + MEM_BUBBLE_SIZE * 1.5 + Math.min(selectedBubble.memUrls.length * 3, 80);

            if (dist > 0) {
              const factor = ((targetDist - dist) / dist) * 0.02;
              node.vx = (node.vx ?? 0) + dx * factor;
              node.vy = (node.vy ?? 0) + dy * factor;
            }
          });
        }
      )
      .alphaDecay(0.01)
      .velocityDecay(0.1)
      .on("tick", () => {
        setMemNodes([...memSimulation.nodes()]);
      });

    memSimulationRef.current = memSimulation;

    return () => {
      memSimulation.stop();
    };
  }, [selectedBubble, selectedNode]);

  // Handle container click - close selection or reheat simulation
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (selectedBubble) {
        setSelectedBubble(null);
      } else if (simulationRef.current) {
        simulationRef.current.alpha(0.1).restart();
      }
    }
  }, [selectedBubble]);

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
            {/* GNSS Bubbles */}
            {nodes.map((node) => {
              const isSelected = selectedBubble?.gnssNum === node.data.gnssNum;
              return (
                <div
                  key={node.data.gnssNum}
                  className={`bubble ${isSelected ? "bubble-selected" : ""}`}
                  style={{
                    position: "absolute",
                    left: (node.x ?? 0) - node.size / 2,
                    top: (node.y ?? 0) - node.size / 2,
                    width: node.size,
                    height: node.size,
                    opacity: selectedBubble && !isSelected ? 0.3 : undefined,
                    transition: "opacity 0.3s ease",
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
              );
            })}
            {/* MEM Bubbles - shown when a GNSS is selected */}
            {memNodes.map((memNode, index) => (
              <div
                key={`mem-${index}`}
                className="bubble mem-bubble"
                style={{
                  position: "absolute",
                  left: (memNode.x ?? 0) - memNode.size / 2,
                  top: (memNode.y ?? 0) - memNode.size / 2,
                  width: memNode.size,
                  height: memNode.size,
                  zIndex: 100,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(memNode.url, "_blank");
                }}
              >
                <img
                  src={memNode.url}
                  alt={`MEM ${index + 1}`}
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
              </div>
            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </>
  );
};

export const BubbleView = memo(BubbleViewMemo);
