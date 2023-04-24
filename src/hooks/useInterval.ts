import { useEffect } from "react";

let autoPlayInterval: ReturnType<typeof setTimeout> | undefined;

interface UseInterval {
  callback: Function;
  interval?: number;
}

const useInterval = ({ callback, interval = 2000 }: UseInterval) => {
  const clearInterval = () => {
    clearTimeout(autoPlayInterval);
  };

  const autoPlay = () => {
    clearTimeout(autoPlayInterval);
    autoPlayInterval = setTimeout(() => callback(), interval);
  };

  useEffect(() => {
    autoPlay();
    return () => clearInterval();
  });

  return { autoPlay, clearInterval };
};

export { useInterval };
