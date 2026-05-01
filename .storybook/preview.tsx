import type { Preview } from "@storybook/nextjs-vite";
import { SessionProvider } from "next-auth/react";
import React from "react";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#0f172a" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          user: {
            name: "Demo User",
            email: "demo@example.com",
            image: null,
          },
          expires: "2099-01-01T00:00:00.000Z",
        }}
      >
        <Story />
      </SessionProvider>
    ),
  ],
};

export default preview;
