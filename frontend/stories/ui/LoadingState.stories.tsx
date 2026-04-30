import type { Meta, StoryObj } from "@storybook/react";
import { Spinner, DashboardCardSkeleton } from "../../app/components/ui/LoadingState";

const meta: Meta = {
  title: "UI/Loading",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;

export const SpinnerDefault: StoryObj<typeof Spinner> = {
  render: (args) => <Spinner {...args} />,
  args: {
    text: "Loading data...",
  },
};

export const DashboardSkeleton: StoryObj = {
  render: () => (
    <div className="w-[400px]">
      <DashboardCardSkeleton />
    </div>
  ),
};
