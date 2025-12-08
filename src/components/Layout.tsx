import { memo } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { ViewTabs } from "./ViewTabs";

const LayoutMemo = () => {
  const [search] = useSearchParams();
  const isHome = search.has("home");

  return (
    <>
      <Outlet />
      {!isHome && <ViewTabs />}
    </>
  );
};

export const Layout = memo(LayoutMemo);
