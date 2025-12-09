import { Box, Typography } from "@mui/material";
import { memo, useState, useCallback, useEffect, useRef } from "react";
import {
  forceSimulation,
  forceCollide,
  forceManyBody,
  forceX,
  forceY,
  SimulationNodeDatum,
} from "d3-force";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
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
const SKELETON_COUNT = 15;
const TICK_THROTTLE_MS = 16; // ~60fps throttle for state updates

// Individual GNSS bubble - memoized to prevent re-renders
const GnssBubble = memo(function GnssBubble({
  node,
  isSelected,
  isFaded,
  onSelect,
}: {
  node: BubbleNode;
  isSelected: boolean;
  isFaded: boolean;
  onSelect: (data: BubbleData) => void;
}) {
  return (
    <div
      className={`bubble ${isSelected ? "bubble-selected" : ""}`}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(${(node.x ?? 0) - node.size / 2}px, ${(node.y ?? 0) - node.size / 2}px)`,
        width: node.size,
        height: node.size,
        opacity: isFaded ? 0.1 : undefined,
        willChange: "transform",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.data);
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
});

// Individual MEM bubble - memoized
const MemBubble = memo(function MemBubble({
  memNode,
  index,
  onMemClick,
}: {
  memNode: MemNode;
  index: number;
  onMemClick: (url: string) => void;
}) {
  return (
    <div
      className="bubble mem-bubble"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(${(memNode.x ?? 0) - memNode.size / 2}px, ${(memNode.y ?? 0) - memNode.size / 2}px)`,
        width: memNode.size,
        height: memNode.size,
        zIndex: 100,
        willChange: "transform",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onMemClick(memNode.url);
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
  );
});

// Skeleton bubble for loading state
const SkeletonBubble = memo(function SkeletonBubble({
  index,
  total,
}: {
  index: number;
  total: number;
}) {
  const angle = (index / total) * Math.PI * 2;
  const radius = 150 + Math.random() * 100;
  const size = 40 + Math.random() * 80;
  const delay = index * 0.1;

  return (
    <div
      className="bubble bubble-skeleton-animated"
      style={{
        position: "absolute",
        left: `calc(50% + ${Math.cos(angle) * radius}px - ${size / 2}px)`,
        top: `calc(50% + ${Math.sin(angle) * radius}px - ${size / 2}px)`,
        width: size,
        height: size,
        animationDelay: `${delay}s`,
      }}
    />
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

// Inner component to access TransformWrapper controls
const BubbleCanvas = memo(function BubbleCanvas({
  nodes,
  memNodes,
  selectedBubble,
  onSelect,
  onContainerClick,
  onMemClick,
}: {
  nodes: BubbleNode[];
  memNodes: MemNode[];
  selectedBubble: BubbleData | null;
  onSelect: (data: BubbleData) => void;
  onContainerClick: (e: React.MouseEvent) => void;
  onMemClick: (url: string) => void;
}) {
  const { setTransform } = useControls();
  const selectedNode = nodes.find((n) => n.data.gnssNum === selectedBubble?.gnssNum);

  // Center on selected bubble
  useEffect(() => {
    if (selectedNode) {
      const x = selectedNode.x ?? window.innerWidth / 2;
      const y = selectedNode.y ?? window.innerHeight / 2;
      const newX = window.innerWidth / 2 - x;
      const newY = window.innerHeight / 2 - y;
      setTransform(newX, newY, 1, 500, "easeOut");
    }
  }, [selectedNode, setTransform]);

  return (
    <div
      onClick={onContainerClick}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
      }}
    >
      {/* GNSS Bubbles */}
      {nodes.map((node) => (
        <GnssBubble
          key={node.data.gnssNum}
          node={node}
          isSelected={selectedBubble?.gnssNum === node.data.gnssNum}
          isFaded={!!selectedBubble && selectedBubble.gnssNum !== node.data.gnssNum}
          onSelect={onSelect}
        />
      ))}
      {/* MEM Bubbles */}
      {memNodes.map((memNode, index) => (
        <MemBubble
          key={memNode.url}
          memNode={memNode}
          index={index}
          onMemClick={onMemClick}
        />
      ))}
    </div>
  );
});

const BubbleViewMemo = () => {
  const { bubbles, loading, maxCount, minCount } = useBubbleData();
  const [selectedBubble, setSelectedBubble] = useState<BubbleData | null>(null);
  const [nodes, setNodes] = useState<BubbleNode[]>([]);
  const [memNodes, setMemNodes] = useState<MemNode[]>([]);
  const [fullscreenMem, setFullscreenMem] = useState<string | null>(null);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<BubbleNode>> | null>(null);
  const memSimulationRef = useRef<ReturnType<typeof forceSimulation<MemNode>> | null>(null);
  const addedBubblesRef = useRef<Set<string>>(new Set()); // Track which bubbles are already in simulation
  const addedMemsRef = useRef<Set<string>>(new Set()); // Track which MEMs are already in simulation
  const maxMassRef = useRef<number>(1); // Store maxMass for simulation forces
  const lastTickRef = useRef<number>(0); // Throttle tick updates
  const lastMemTickRef = useRef<number>(0); // Throttle MEM tick updates
  const rafRef = useRef<number | null>(null); // requestAnimationFrame handle
  const memRafRef = useRef<number | null>(null); // MEM requestAnimationFrame handle
  const [loadedMemUrls, setLoadedMemUrls] = useState<string[]>([]); // Progressively loaded MEM URLs

  const MEM_CONCURRENT = 4; // Concurrent MEM image loads

  // Preload a single image
  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  }, []);

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

  // Initialize simulation and handle progressive bubble addition
  useEffect(() => {
    if (bubbles.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    // Find new bubbles that haven't been added to simulation yet
    const newBubbles = bubbles.filter((b) => !addedBubblesRef.current.has(b.gnssNum));

    // If no simulation exists, create it
    if (!simulationRef.current) {
      // Calculate max mass for all bubbles for consistent sizing
      const allMasses = bubbles.map((b) => {
        const size = calculateSize(b.memCount);
        return size * Math.sqrt(b.memCount);
      });
      const maxMass = Math.max(...allMasses);
      maxMassRef.current = maxMass;

      // Create initial nodes
      const initialNodes: BubbleNode[] = newBubbles.map((bubble, i) => {
        const size = calculateSize(bubble.memCount);
        const mass = size * Math.sqrt(bubble.memCount);
        const normalizedMass = mass / maxMass;

        const orbitRadius = Math.min(width, height) * 0.3 * (1 - normalizedMass * 0.8);
        const angle = (i / Math.max(newBubbles.length, 1)) * Math.PI * 2 + Math.random() * 0.5;
        const orbitalSpeed = (1 - normalizedMass) * 3;

        addedBubblesRef.current.add(bubble.gnssNum);

        return {
          data: bubble,
          size,
          mass,
          x: centerX + Math.cos(angle) * orbitRadius,
          y: centerY + Math.sin(angle) * orbitRadius,
          vx: -Math.sin(angle) * orbitalSpeed,
          vy: Math.cos(angle) * orbitalSpeed,
        };
      });

      // Create force simulation
      const simulation = forceSimulation<BubbleNode>(initialNodes)
        .force(
          "x",
          forceX<BubbleNode>(centerX).strength((d) => 0.03 + (d.mass / maxMass) * 0.1)
        )
        .force(
          "y",
          forceY<BubbleNode>(centerY).strength((d) => 0.03 + (d.mass / maxMass) * 0.1)
        )
        .force(
          "charge",
          forceManyBody<BubbleNode>()
            .strength((d) => -d.mass * 0.8)
            .distanceMin(20)
            .distanceMax(300)
        )
        .force(
          "collide",
          forceCollide<BubbleNode>()
            .radius((d) => d.size / 2 + 8)
            .strength(1)
            .iterations(2) // Reduced for performance
        )
        .alphaDecay(0.008)
        .velocityDecay(0.2)
        .on("tick", () => {
          // Throttle state updates to ~60fps using requestAnimationFrame
          const now = performance.now();
          if (now - lastTickRef.current >= TICK_THROTTLE_MS) {
            lastTickRef.current = now;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
              setNodes([...simulation.nodes()]);
            });
          }
        });

      simulationRef.current = simulation;
    } else if (newBubbles.length > 0) {
      // Add new bubbles to existing simulation
      const simulation = simulationRef.current;
      const existingNodes = simulation.nodes();
      const maxMass = maxMassRef.current;

      // Create new nodes for new bubbles
      const newNodes: BubbleNode[] = newBubbles.map((bubble) => {
        const size = calculateSize(bubble.memCount);
        const mass = size * Math.sqrt(bubble.memCount);
        const normalizedMass = mass / maxMass;

        // New bubbles appear from edges and drift in
        const angle = Math.random() * Math.PI * 2;
        const spawnRadius = Math.max(width, height) * 0.5;
        const orbitalSpeed = (1 - normalizedMass) * 2;

        addedBubblesRef.current.add(bubble.gnssNum);

        return {
          data: bubble,
          size,
          mass,
          x: centerX + Math.cos(angle) * spawnRadius,
          y: centerY + Math.sin(angle) * spawnRadius,
          vx: -Math.cos(angle) * orbitalSpeed, // Drift toward center
          vy: -Math.sin(angle) * orbitalSpeed,
        };
      });

      // Add new nodes to simulation
      simulation.nodes([...existingNodes, ...newNodes]);

      // Gently reheat simulation to integrate new nodes
      simulation.alpha(0.3).restart();
    }

    return () => {
      // Only stop simulation on unmount, not on every update
    };
  }, [bubbles, calculateSize]);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        addedBubblesRef.current.clear();
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (memRafRef.current) cancelAnimationFrame(memRafRef.current);
    };
  }, []);


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

  // Progressively load MEM images when a bubble is selected
  useEffect(() => {
    if (!selectedBubble) {
      setLoadedMemUrls([]);
      addedMemsRef.current.clear();
      return;
    }

    const memUrls = selectedBubble.memUrls;
    if (memUrls.length === 0) return;

    let aborted = false;
    const loaded: string[] = [];
    let currentIndex = 0;

    const loadNext = async (): Promise<void> => {
      while (currentIndex < memUrls.length && !aborted) {
        const index = currentIndex++;
        const url = memUrls[index];
        await preloadImage(url);
        if (aborted) return;
        loaded.push(url);
        setLoadedMemUrls([...loaded]);
      }
    };

    // Start concurrent loaders
    const loaders = Array.from(
      { length: Math.min(MEM_CONCURRENT, memUrls.length) },
      () => loadNext()
    );

    Promise.all(loaders);

    return () => {
      aborted = true;
    };
  }, [selectedBubble, preloadImage]);

  // Get the position of the selected bubble
  const selectedNode = nodes.find((n) => n.data.gnssNum === selectedBubble?.gnssNum);

  // Create MEM bubble simulation with progressive loading
  useEffect(() => {
    if (!selectedBubble || !selectedNode) {
      // Clean up when deselected
      if (memSimulationRef.current) {
        memSimulationRef.current.stop();
        memSimulationRef.current = null;
      }
      setMemNodes([]);
      return;
    }

    if (loadedMemUrls.length === 0) return;

    const centerX = selectedNode.x ?? window.innerWidth / 2;
    const centerY = selectedNode.y ?? window.innerHeight / 2;
    const parentRadius = selectedNode.size / 2;

    // Minimum distance from center to not cover parent bubble
    const minOrbitRadius = parentRadius + MEM_BUBBLE_SIZE / 2 + 15;
    // Target orbit distance based on total MEM count
    const targetOrbitRadius = minOrbitRadius + Math.min(selectedBubble.memUrls.length * 4, 100);

    // Find new MEMs that haven't been added yet
    const newMemUrls = loadedMemUrls.filter((url) => !addedMemsRef.current.has(url));

    // If no simulation exists, create it
    if (!memSimulationRef.current) {
      // Create initial MEM nodes
      const initialMemNodes: MemNode[] = newMemUrls.map((url, i) => {
        const angle = (i / Math.max(selectedBubble.memUrls.length, 1)) * Math.PI * 2;
        addedMemsRef.current.add(url);

        return {
          url,
          size: MEM_BUBBLE_SIZE,
          x: centerX + Math.cos(angle) * targetOrbitRadius,
          y: centerY + Math.sin(angle) * targetOrbitRadius,
          vx: -Math.sin(angle) * 0.5,
          vy: Math.cos(angle) * 0.5,
        };
      });

      // Create simulation for MEM bubbles
      const memSimulation = forceSimulation<MemNode>(initialMemNodes)
        .force("x", forceX(centerX).strength(0.01))
        .force("y", forceY(centerY).strength(0.01))
        .force(
          "charge",
          forceManyBody<MemNode>().strength(-30).distanceMax(150)
        )
        .force(
          "collide",
          forceCollide<MemNode>()
            .radius((d) => d.size / 2 + 3)
            .strength(0.8)
        )
        .force(
          "orbit",
          () => {
            // Keep MEMs in orbit - push away if too close to parent
            memSimulation.nodes().forEach((node) => {
              const dx = (node.x ?? 0) - centerX;
              const dy = (node.y ?? 0) - centerY;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < minOrbitRadius && dist > 0) {
                const pushFactor = ((minOrbitRadius - dist) / dist) * 0.1;
                node.vx = (node.vx ?? 0) + dx * pushFactor;
                node.vy = (node.vy ?? 0) + dy * pushFactor;
              } else if (dist > 0) {
                const factor = ((targetOrbitRadius - dist) / dist) * 0.005;
                node.vx = (node.vx ?? 0) + dx * factor;
                node.vy = (node.vy ?? 0) + dy * factor;
              }
            });
          }
        )
        .alphaDecay(0.02)
        .velocityDecay(0.4)
        .on("tick", () => {
          // Throttle state updates to ~60fps using requestAnimationFrame
          const now = performance.now();
          if (now - lastMemTickRef.current >= TICK_THROTTLE_MS) {
            lastMemTickRef.current = now;
            if (memRafRef.current) cancelAnimationFrame(memRafRef.current);
            memRafRef.current = requestAnimationFrame(() => {
              setMemNodes([...memSimulation.nodes()]);
            });
          }
        });

      memSimulationRef.current = memSimulation;
    } else if (newMemUrls.length > 0) {
      // Add new MEMs to existing simulation
      const memSimulation = memSimulationRef.current;
      const existingNodes = memSimulation.nodes();

      // Create new nodes - spawn from random angles around orbit
      const newNodes: MemNode[] = newMemUrls.map((url) => {
        const angle = Math.random() * Math.PI * 2;
        addedMemsRef.current.add(url);

        return {
          url,
          size: MEM_BUBBLE_SIZE,
          x: centerX + Math.cos(angle) * (targetOrbitRadius + 50),
          y: centerY + Math.sin(angle) * (targetOrbitRadius + 50),
          vx: -Math.cos(angle) * 0.3,
          vy: -Math.sin(angle) * 0.3,
        };
      });

      // Add new nodes to simulation
      memSimulation.nodes([...existingNodes, ...newNodes]);
      memSimulation.alpha(0.3).restart();
    }
  }, [selectedBubble, selectedNode, loadedMemUrls]);

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
          inset: 0,
          overflow: "hidden",
        }}
      >
        {/* Animated skeleton bubbles */}
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <SkeletonBubble key={i} index={i} total={SKELETON_COUNT} />
        ))}
        {/* Loading text */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.9)",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              mb: 1,
            }}
          >
            Loading GNSS
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  animation: "pulse 1s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </Box>
        </Box>
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
          <BubbleCanvas
            nodes={nodes}
            memNodes={memNodes}
            selectedBubble={selectedBubble}
            onSelect={handleSelect}
            onContainerClick={handleContainerClick}
            onMemClick={setFullscreenMem}
          />
        </TransformComponent>
      </TransformWrapper>
      {/* Fullscreen MEM overlay - outside TransformWrapper to stay fixed */}
      {fullscreenMem && (
        <div
          onClick={() => setFullscreenMem(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <img
            src={fullscreenMem}
            alt="MEM fullscreen"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: 8,
              boxShadow: "0 0 60px rgba(0,0,0,0.5)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              color: "rgba(255,255,255,0.7)",
              fontSize: 14,
            }}
          >
            Click anywhere to close
          </div>
        </div>
      )}
    </>
  );
};

export const BubbleView = memo(BubbleViewMemo);
