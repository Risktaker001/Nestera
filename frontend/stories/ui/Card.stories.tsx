import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../app/components/ui/Card";
import { Button } from "../../app/components/ui/Button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "glass", "accent"],
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    className: "w-[380px]",
    children: (
      <>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <CardDescription>Review your recent activity and balance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-text-muted">Total Balance</span>
            <span className="text-lg font-bold">$12,450.00</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-text-muted">Pending Rewards</span>
            <span className="text-sm font-medium text-emerald-500">+$124.50</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">View Details</Button>
        </CardFooter>
      </>
    ),
  },
};

export const Glass: Story = {
  args: {
    variant: "glass",
    className: "w-[380px] bg-[#061218]",
    children: (
      <>
        <CardHeader>
          <CardTitle className="text-white">Stellar Wallet</CardTitle>
          <CardDescription className="text-cyan-200/60">Connected to Mainnet</CardDescription>
        </CardHeader>
        <CardContent className="text-white">
          <div className="text-3xl font-extrabold mb-2">45,210.50 XLM</div>
          <div className="text-xs text-white/40 font-mono bg-white/5 p-2 rounded-lg truncate">
            GC3H...4K9L
          </div>
        </CardContent>
      </>
    ),
  },
};

export const Accent: Story = {
  args: {
    variant: "accent",
    className: "w-[380px]",
    children: (
      <>
        <CardHeader>
          <CardTitle>Special Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Stake your AQUA tokens today and earn up to 15% APY in rewards.</p>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full text-accent hover:bg-accent/10">Learn More</Button>
        </CardFooter>
      </>
    ),
  },
};
