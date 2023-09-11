import { useTheme } from "@mui/material";
import { JSONData, Mems } from "interfaces";
import { useSearchParams } from "react-router-dom";
import { TransformComponent } from "react-zoom-pan-pinch";
import { getColumns } from "../utils";
import { Mem } from "./Mem";
import { UI } from "./UI";
import { For } from "million/react";

type Props = {
  imageCount: number;
  images: Mems[];
  jsonData?: JSONData;
  onUpdateIndex: () => void;
  highlightedIndex?: string;
  setHighlightedIndex(num?: string): void;
};

const ZoomContainer = ({
  imageCount,
  images,
  jsonData,
  onUpdateIndex,
  highlightedIndex,
  setHighlightedIndex,
}: Props) => {
  const [search] = useSearchParams();
  const isHome = search.has("home");
  const theme = useTheme();

  return (
    <>
      <UI
        imageCount={imageCount}
        images={images}
        jsonData={jsonData}
        onUpdateIndex={onUpdateIndex}
        setHighlightedIndex={setHighlightedIndex}
      />
      <TransformComponent>
        <div
          style={{
            display: "grid",
            willChange: "transform",
            gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
            gap: theme.spacing(5),
            width: "100%",
          }}
        >
          <For each={images}>
            {({ url }) => (
              <Mem
                key={url}
                index={url}
                src={url}
                isHome={isHome}
                active={isHome ? undefined : highlightedIndex === url}
              />
            )}
          </For>
        </div>
      </TransformComponent>
    </>
  );
};

export { ZoomContainer };
