import { block } from "million/react";

interface IMem {
  active?: boolean;
  src: string;
  index: string;
  isHome?: boolean;
}

const Mem = block(
  function Mem({ active, src, index, isHome }: IMem) {
    return (
      <img
        loading="lazy"
        className={`mem${active ? " mem-highlight" : ""} ${
          isHome ? " mem-home" : ""
        }`}
        data-container
        id={index}
        alt={index}
        src={src.replace(".jpg", "_low.jpg")}
      />
    );
  },
  { as: "img" }
);

export { Mem };
