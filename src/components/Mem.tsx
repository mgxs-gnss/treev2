import { memo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

interface IMem {
  active?: boolean;
  src: string;
  index: string;
}

const Mem = memo(function Mem({ active, src, index }: IMem) {
  const [search] = useSearchParams();
  const ref = useRef<HTMLImageElement>(null);
  const isHome = search.has("home");

  return (
    <img
      loading="lazy"
      className={`mem${active ? " mem-highlight" : ""} ${
        isHome ? " mem-home" : ""
      }`}
      data-container
      ref={ref}
      id={index}
      alt={index}
      src={src.replace(".jpg", "_low.jpg")}
    />
  );
});

export { Mem };
