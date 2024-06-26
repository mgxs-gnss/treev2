import { memo } from "react";

interface IMem {
  active?: boolean;
  src: string;
  index: string;
  isHome?: boolean;
}

const Mem = memo(
  function ({ active, src, index, isHome }: IMem) {
    const className = `mem${active ? " mem-highlight" : ""} ${
      isHome ? " mem-home" : ""
    }`;
    const optimizedSrc = src.replace(".jpg", "_low.jpg");

    return (
      <img
        loading="lazy"
        className={className}
        data-container
        id={index}
        alt={index}
        src={optimizedSrc}
      />
    );
  },
  (prevProps, nextProps) =>
    prevProps.active === nextProps.active &&
    prevProps.src === nextProps.src &&
    prevProps.index === nextProps.index &&
    prevProps.isHome === nextProps.isHome
);

export { Mem };
