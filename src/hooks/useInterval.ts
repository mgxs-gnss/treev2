import { useCallback, useEffect } from "react";

let autoPlayInterval: ReturnType<typeof setTimeout> | undefined;

interface UseInterval {
  callback: Function;
  interval?: number;
  active?: boolean;
}

const useInterval = ({ active, callback, interval = 2000 }: UseInterval) => {
  const clearInterval = () => {
    clearTimeout(autoPlayInterval);
  };

  const autoPlay = useCallback(() => {
    clearTimeout(autoPlayInterval);
    autoPlayInterval = setTimeout(() => callback(), interval);
  }, [callback, interval]);

  useEffect(() => {
    active && autoPlay();
    return () => clearInterval();
  }, [active, autoPlay]);

  return { autoPlay, clearInterval };
};

export { useInterval };
