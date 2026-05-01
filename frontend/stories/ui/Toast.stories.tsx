import type { Meta, StoryObj } from "@storybook/react";
import { Toast } from "../../app/components/ui/Toast";

const meta: Meta<typeof Toast> = {
  title: "UI/Toast",
  component: Toast,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["success", "error", "warning", "info"],
    },
    title: { control: "text" },
    message: { control: "text" },
    duration: { control: "number" },
  },
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  args: {
    type: "success",
    title: "Action Successful",
    message: "Your transaction has been processed.",
  },
};

export const Error: Story = {
  args: {
    type: "error",
    title: "Transaction Failed",
    message: "Insufficient balance for this operation.",
  },
};

export const Warning: Story = {
  args: {
    type: "warning",
    title: "Network Congested",
    message: "Processing might take longer than usual.",
  },
};

export const Info: Story = {
  args: {
    type: "info",
    title: "New Update Available",
    message: "Refresh the page to see latest features.",
  },
};

export const TitleOnly: Story = {
  args: {
    type: "success",
    title: "Copied to clipboard!",
  },
};
