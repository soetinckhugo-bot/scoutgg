import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";
import { ROLE_COLORS, STATUS_COLORS, TIER_COLORS } from "@/lib/constants";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "destructive"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
  },
};

export const Roles: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {Object.entries(ROLE_COLORS).map(([role, colorClass]) => (
        <Badge key={role} className={colorClass}>
          {role}
        </Badge>
      ))}
    </div>
  ),
};

export const Statuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {Object.entries(STATUS_COLORS).map(([status, colorClass]) => (
        <Badge key={status} className={colorClass}>
          {status.replace("_", " ")}
        </Badge>
      ))}
    </div>
  ),
};

export const Tiers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {Object.entries(TIER_COLORS).map(([tier, colorClass]) => (
        <Badge key={tier} variant="outline" className={colorClass}>
          {tier}
        </Badge>
      ))}
    </div>
  ),
};

