import { Theme } from "@gnss/common";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useEffect } from "react";

const App = () => {
  useEffect(() => {
    // @ts-ignore
    window.timeStart = new Date().getTime();
  }, []);

  return (
    <Theme>
      <RouterProvider router={router} />
    </Theme>
  );
};

export default App;
