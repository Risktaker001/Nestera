import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "../../app/components/ui/Input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    error: { control: "text" },
    helperText: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Type something...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Email Address",
    placeholder: "hello@nestera.io",
  },
};

export const WithError: Story = {
  args: {
    label: "Password",
    type: "password",
    placeholder: "••••••••",
    error: "Password must be at least 8 characters",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Username",
    placeholder: "johndoe",
    helperText: "This is how you'll appear to others",
  },
};

export const Disabled: Story = {
  args: {
    label: "Account ID",
    value: "GC...1234",
    disabled: true,
  },
};
