import { createBrowserRouter } from "react-router-dom";
import { ZoomPanComponent } from "./components";

const router = createBrowserRouter([
  {
    path: "/",
    element: <ZoomPanComponent />,
  },
]);

export { router };
