import { memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ViewTabsMemo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isGrid = location.pathname === "/" || location.pathname === "";
  const isBubbles = location.pathname === "/bubbles";

  return (
    <div className="view-tabs">
      <button
        className={`view-tab ${isGrid ? "view-tab-active" : ""}`}
        onClick={() => navigate("/")}
      >
        Grid
      </button>
      <button
        className={`view-tab ${isBubbles ? "view-tab-active" : ""}`}
        onClick={() => navigate("/bubbles")}
      >
        Bubbles
      </button>
    </div>
  );
};

export const ViewTabs = memo(ViewTabsMemo);
