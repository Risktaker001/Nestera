import type { Meta, StoryObj } from "@storybook/react";
import ErrorFallback from "../../app/components/ErrorFallback";

const meta: Meta<typeof ErrorFallback> = {
  title: "Components/ErrorFallback",
  component: ErrorFallback,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ErrorFallback>;

export const Default: Story = {
  args: {
    error: new Error("Failed to fetch wallet data"),
    resetErrorBoundary: () => console.log("Reset clicked"),
  },
};
