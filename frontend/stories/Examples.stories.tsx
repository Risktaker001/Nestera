import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../app/components/ui/Button";
import { Input } from "../app/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../app/components/ui/Card";

const meta: Meta = {
  title: "Examples/ContactForm",
  parameters: {
    layout: "centered",
  },
};

export default meta;

export const ContactForm = () => {
  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Contact Support</CardTitle>
        <CardDescription>We'll get back to you as soon as possible.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input label="Name" placeholder="Your name" />
        <Input label="Email" type="email" placeholder="your@email.com" />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-muted px-1">Message</label>
          <textarea 
            className="flex min-h-[100px] w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-all duration-200"
            placeholder="How can we help?"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Send Message</Button>
      </CardFooter>
    </Card>
  );
};
