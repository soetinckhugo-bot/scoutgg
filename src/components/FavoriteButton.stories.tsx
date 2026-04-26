import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import FavoriteButton from "./FavoriteButton";

const meta: Meta<typeof FavoriteButton> = {
  title: "Components/FavoriteButton",
  component: FavoriteButton,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "small"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    playerId: "p1",
    variant: "default",
  },
};

export const Small: Story = {
  args: {
    playerId: "p1",
    variant: "small",
  },
};

