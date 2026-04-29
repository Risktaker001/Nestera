import type { Meta, StoryObj } from "@storybook/react";
import ThemeToggle from "../../app/components/ThemeToggle";
import { ThemeDecorator } from "../mocks/ThemeDecorator";

const meta: Meta<typeof ThemeToggle> = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  decorators: [ThemeDecorator],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};
