import type { Meta, StoryObj } from "@storybook/react";
import NetWorthCard from "../../app/components/dashboard/NetWorthCard";
import { WalletDecorator } from "../mocks/WalletDecorator";

const meta: Meta<typeof NetWorthCard> = {
  title: "Dashboard/NetWorthCard",
  component: NetWorthCard,
  tags: ["autodocs"],
  decorators: [WalletDecorator],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof NetWorthCard>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="w-[450px]">
        <Story />
      </div>
    ),
  ],
};
