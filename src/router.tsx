import { createBrowserRouter } from "react-router-dom";
import { ZoomPanComponent, BubbleView, Layout } from "./components";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ZoomPanComponent />,
      },
      {
        path: "bubbles",
        element: <BubbleView />,
      },
    ],
  },
]);

export { router };
