import { useEffect } from "react";
import { useInterval } from "../hooks";

interface IInterval {
  callback: Function;
  interval: number;
}

const Interval = ({ callback, interval }: IInterval) => {
  const loop = () => {
    callback();
    autoPlay();
  };

  const { autoPlay } = useInterval({
    callback: loop,
    active: true,
    interval,
  });
  useEffect(() => {
    autoPlay();
  }, [autoPlay]);
  return <></>;
};

export { Interval };
