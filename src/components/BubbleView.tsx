import { Box, CircularProgress, Typography } from "@mui/material";
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useBubbleData, BubbleData } from "../hooks/useBubbleData";

const MIN_BUBBLE_SIZE = 40;
const MAX_BUBBLE_SIZE = 200;

// Physics constants
const GRAVITY = 0.5;
const DAMPING = 0.98;
const REPULSION = 2;
const CENTER_PULL = 0.001;

interface PhysicsBubble {
  data: BubbleData;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  mass: number;
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
  const [physicsBubbles, setPhysicsBubbles] = useState<PhysicsBubble[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

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

  // Initialize physics bubbles when data loads
  useEffect(() => {
    if (bubbles.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    const initialized: PhysicsBubble[] = bubbles.map((bubble, i) => {
      const size = calculateSize(bubble.memCount);
      const angle = (i / bubbles.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.3;

      return {
        data: bubble,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size,
        mass: size * size, // Mass proportional to area
      };
    });

    setPhysicsBubbles(initialized);
  }, [bubbles, calculateSize]);

  // Physics simulation loop
  useEffect(() => {
    if (physicsBubbles.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    const simulate = () => {
      setPhysicsBubbles((prev) => {
        const next = prev.map((bubble) => ({ ...bubble }));

        // Apply forces between all pairs
        for (let i = 0; i < next.length; i++) {
          const a = next[i];

          // Pull towards center
          const dxCenter = centerX - a.x;
          const dyCenter = centerY - a.y;
          a.vx += dxCenter * CENTER_PULL;
          a.vy += dyCenter * CENTER_PULL;

          for (let j = i + 1; j < next.length; j++) {
            const b = next[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (a.size + b.size) / 2;

            if (dist < minDist) {
              // Collision - repel
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              const totalMass = a.mass + b.mass;
              const aRatio = b.mass / totalMass;
              const bRatio = a.mass / totalMass;

              a.x -= nx * overlap * aRatio * REPULSION;
              a.y -= ny * overlap * aRatio * REPULSION;
              b.x += nx * overlap * bRatio * REPULSION;
              b.y += ny * overlap * bRatio * REPULSION;

              // Bounce velocities
              a.vx -= nx * REPULSION;
              a.vy -= ny * REPULSION;
              b.vx += nx * REPULSION;
              b.vy += ny * REPULSION;
            } else {
              // Gravitational attraction - bigger attracts smaller
              const force = (GRAVITY * a.mass * b.mass) / (dist * dist);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              // Apply force inversely proportional to mass
              a.vx += fx / a.mass;
              a.vy += fy / a.mass;
              b.vx -= fx / b.mass;
              b.vy -= fy / b.mass;
            }
          }

          // Apply damping
          a.vx *= DAMPING;
          a.vy *= DAMPING;

          // Update position
          a.x += a.vx;
          a.y += a.vy;

          // Boundary constraints
          const padding = a.size / 2;
          if (a.x < padding) {
            a.x = padding;
            a.vx *= -0.5;
          }
          if (a.x > width - padding) {
            a.x = width - padding;
            a.vx *= -0.5;
          }
          if (a.y < padding) {
            a.y = padding;
            a.vy *= -0.5;
          }
          if (a.y > height - padding) {
            a.y = height - padding;
            a.vy *= -0.5;
          }
        }

        return next;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [physicsBubbles.length]);

  const handleSelect = useCallback((data: BubbleData) => {
    setSelectedBubble((prev) => (prev?.gnssNum === data.gnssNum ? null : data));
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
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {physicsBubbles.map((bubble) => (
          <div
            key={bubble.data.gnssNum}
            className={`bubble ${selectedBubble?.gnssNum === bubble.data.gnssNum ? "bubble-selected" : ""}`}
            style={{
              position: "absolute",
              left: bubble.x - bubble.size / 2,
              top: bubble.y - bubble.size / 2,
              width: bubble.size,
              height: bubble.size,
            }}
            onClick={() => handleSelect(bubble.data)}
          >
            <img
              src={bubble.data.imageUrl}
              alt={`GNSS ${bubble.data.gnssNum}`}
              loading="lazy"
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
            {bubble.data.memCount > 0 && (
              <div className="bubble-count">{bubble.data.memCount}</div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export const BubbleView = memo(BubbleViewMemo);
