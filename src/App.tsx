import { Theme } from "@mgxs/common";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useEffect, memo } from "react";

const App = () => {
  useEffect(() => {
    (window as any).timeStart = new Date().getTime();
  }, []);

  return (
    <Theme>
      <RouterProvider router={router} />
    </Theme>
  );
};

export default memo(App);
