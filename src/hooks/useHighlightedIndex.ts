import { MutableRefObject, useCallback, useState } from "react";

const useHighlightedIndex = (
  container: MutableRefObject<HTMLDivElement | undefined>
) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number>();

  const updateIndex = useCallback(() => {
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let minDistance = Infinity;
    let closestIndex = 0;

    const images = container?.current?.getElementsByTagName("img");

    images &&
      Object.values(images).forEach((ref, index) => {
        if (ref) {
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
            closestIndex = index;
          }
        }
      });

    setHighlightedIndex(closestIndex);
  }, [container]);

  return { highlightedIndex, updateIndex, setHighlightedIndex };
};

export { useHighlightedIndex };
