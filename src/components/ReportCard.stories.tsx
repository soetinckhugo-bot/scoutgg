import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import ReportCard from "./ReportCard";

const meta: Meta<typeof ReportCard> = {
  title: "Components/ReportCard",
  component: ReportCard,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["free", "premium", "preview"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const baseReport = {
  id: "r1",
  playerId: "p1",
  title: "Scouting Report: Zeka",
  content: "Excellent mechanical skill and macro understanding. Strong in teamfights and knows how to play around objectives.",
  strengths: "Laning, Teamfighting, Objective Control",
  weaknesses: "Vision control, Roaming",
  verdict: "Must Sign",
  author: "Scout A",
  isPremium: false,
  publishedAt: new Date("2026-01-15"),
  player: { id: "p1", pseudo: "Zeka" },
};

export const Free: Story = {
  args: {
    report: baseReport,
    variant: "free",
  },
};

export const Premium: Story = {
  args: {
    report: {
      ...baseReport,
      isPremium: true,
    },
    variant: "premium",
  },
};

export const Preview: Story = {
  args: {
    report: baseReport,
    variant: "preview",
  },
};

export const NoPlayer: Story = {
  args: {
    report: {
      ...baseReport,
      player: undefined,
    },
    variant: "free",
  },
};

