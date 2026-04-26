import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import PlayerCard from "./PlayerCard";

const meta: Meta<typeof PlayerCard> = {
  title: "Components/PlayerCard",
  component: PlayerCard,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "compact"],
    },
    showStats: {
      control: "boolean",
    },
    showFavorite: {
      control: "boolean",
    },
    compareMode: {
      control: "boolean",
    },
    isSelected: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const basePlayer = {
  id: "p1",
  pseudo: "Zeka",
  realName: "Kim Geon-woo",
  role: "MID",
  league: "LFL",
  status: "FREE_AGENT",
  currentTeam: null,
  photoUrl: null,
};

export const Default: Story = {
  args: {
    player: basePlayer,
    showStats: true,
    showFavorite: true,
    variant: "default",
  },
};

export const Compact: Story = {
  args: {
    player: basePlayer,
    variant: "compact",
  },
};

export const WithTeam: Story = {
  args: {
    player: {
      ...basePlayer,
      currentTeam: "Team Vitality",
      status: "UNDER_CONTRACT",
    },
  },
};

export const NoStats: Story = {
  args: {
    player: basePlayer,
    showStats: false,
  },
};

export const CompareMode: Story = {
  args: {
    player: basePlayer,
    compareMode: true,
    isSelected: false,
    onToggleCompare: () => {},
  },
};

export const Selected: Story = {
  args: {
    player: basePlayer,
    compareMode: true,
    isSelected: true,
    onToggleCompare: () => {},
  },
};

