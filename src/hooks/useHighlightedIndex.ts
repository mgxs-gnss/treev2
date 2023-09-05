import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

const useHighlightedIndex = () => {
  const [highlightedIndex, setHighlightedIndex] = useState<string>();

  const updateIndex = useDebouncedCallback(() => {
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let minDistance = Infinity;
    let closestIndex = "";

    const images = document.body.querySelectorAll("[data-container]");

    if (!images) return;

    const visibleImages = Object.values(images).filter((img) => {
      const rect = img.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
          (window.innerWidth || document.documentElement.clientWidth)
      );
    });

    visibleImages.forEach((ref) => {
      const rect = ref.getBoundingClientRect();
      const imageCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const dx = center.x - imageCenter.x;
      const dy = center.y - imageCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = ref.id;
      }
    });

    setHighlightedIndex(closestIndex);
  }, 500);

  return { highlightedIndex, updateIndex, setHighlightedIndex };
};

export { useHighlightedIndex };
