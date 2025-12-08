import { memo, useState, useCallback } from "react";
import { LodLevel } from "../hooks/useViewportVirtualization";

interface IMem {
  active?: boolean;
  src: string;
  index: string;
  isHome?: boolean;
  lodLevel?: LodLevel;
  loadedLowRes?: string;
  loadedHighRes?: string;
  isLoading?: boolean;
}

// Placeholder colors based on index for visual variety
const PLACEHOLDER_COLORS = [
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#1a1a1a",
  "#2d132c",
  "#1e3d59",
  "#17223b",
  "#263859",
];

const getPlaceholderColor = (index: string): string => {
  const num = parseInt(index.replace(/\D/g, ""), 10) || 0;
  return PLACEHOLDER_COLORS[num % PLACEHOLDER_COLORS.length];
};

const Mem = memo(
  function ({
    active,
    src,
    index,
    isHome,
    lodLevel = 1,
    loadedLowRes,
    loadedHighRes,
    isLoading,
  }: IMem) {
    const [fadeIn, setFadeIn] = useState(false);
    const className = `mem${active ? " mem-highlight" : ""} ${
      isHome ? " mem-home" : ""
    }`;

    const handleLoad = useCallback(() => {
      setFadeIn(true);
    }, []);

    // LOD 0: Just show placeholder
    if (lodLevel === 0) {
      return (
        <div
          className={className}
          data-container
          id={index}
          style={{
            backgroundColor: getPlaceholderColor(index),
            width: "100%",
            height: "100%",
          }}
        />
      );
    }

    // Determine which image to show
    const displaySrc = loadedHighRes || loadedLowRes;
    const lowResSrc = src.replace(".jpg", "_low.jpg");

    // If nothing loaded yet, show placeholder with loading state
    if (!displaySrc) {
      return (
        <div
          className={className}
          data-container
          id={index}
          style={{
            backgroundColor: getPlaceholderColor(index),
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {isLoading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                animation: "shimmer 1.5s infinite",
              }}
            />
          )}
          {/* Hidden image to trigger native lazy loading */}
          <img
            loading="lazy"
            decoding="async"
            fetchPriority={active ? "high" : "low"}
            src={lowResSrc}
            alt={index}
            onLoad={handleLoad}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: fadeIn ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
            }}
          />
        </div>
      );
    }

    // Show loaded image with potential upgrade
    return (
      <div
        className={className}
        data-container
        id={index}
        style={{
          backgroundColor: getPlaceholderColor(index),
          position: "relative",
        }}
      >
        {/* Low-res base layer */}
        {loadedLowRes && (
          <img
            decoding="async"
            src={loadedLowRes}
            alt={index}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        {/* High-res overlay (fades in over low-res) */}
        {loadedHighRes && (
          <img
            decoding="async"
            fetchPriority={active ? "high" : "low"}
            src={loadedHighRes}
            alt={index}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 1,
              transition: "opacity 0.3s ease-in-out",
            }}
          />
        )}
        {/* Loading indicator for upgrade */}
        {isLoading && loadedLowRes && !loadedHighRes && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.5)",
              animation: "pulse 1s infinite",
            }}
          />
        )}
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.active === nextProps.active &&
    prevProps.src === nextProps.src &&
    prevProps.index === nextProps.index &&
    prevProps.isHome === nextProps.isHome &&
    prevProps.lodLevel === nextProps.lodLevel &&
    prevProps.loadedLowRes === nextProps.loadedLowRes &&
    prevProps.loadedHighRes === nextProps.loadedHighRes &&
    prevProps.isLoading === nextProps.isLoading
);

export { Mem };
