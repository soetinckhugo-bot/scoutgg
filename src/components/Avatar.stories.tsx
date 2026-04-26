import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Avatar from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
    },
    src: {
      control: "text",
    },
    fallback: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {
    src: "https://via.placeholder.com/150",
    alt: "Player photo",
    fallback: "Z",
    size: "lg",
  },
};

export const Fallback: Story = {
  args: {
    src: null,
    alt: "Zeka",
    fallback: "Zeka",
    size: "lg",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar src={null} alt="A" fallback="A" size="sm" />
      <Avatar src={null} alt="A" fallback="A" size="md" />
      <Avatar src={null} alt="A" fallback="A" size="lg" />
      <Avatar src={null} alt="A" fallback="A" size="xl" />
    </div>
  ),
};

