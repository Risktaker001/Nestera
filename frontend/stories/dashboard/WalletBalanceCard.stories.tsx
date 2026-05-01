import type { Meta, StoryObj } from "@storybook/react";
import WalletBalanceCard from "../../app/components/dashboard/WalletBalanceCard";
import { WalletDecorator } from "../mocks/WalletDecorator";

const meta: Meta<typeof WalletBalanceCard> = {
  title: "Dashboard/WalletBalanceCard",
  component: WalletBalanceCard,
  tags: ["autodocs"],
  decorators: [WalletDecorator],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof WalletBalanceCard>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div className="w-[450px]">
        <Story />
      </div>
    ),
  ],
};
