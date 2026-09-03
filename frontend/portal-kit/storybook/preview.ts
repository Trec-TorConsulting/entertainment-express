import type { Preview } from "@storybook/react";
import "../src/tokens.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "var(--ee-bg)" },
        { name: "dark", value: "#0b0f17" },
      ],
    },
  },
};

export default preview;
