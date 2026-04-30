"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "../context/ToastContext";

const NewsletterSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type NewsletterValues = z.infer<typeof NewsletterSchema>;

const Newsletter: React.FC = () => {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterValues>({
    resolver: zodResolver(NewsletterSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: NewsletterValues) => {
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email.trim() }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409) {
          toast.info(
            "Already subscribed",
            "This email is already on our newsletter list.",
          );
          return;
        }

        toast.error(
          "Subscription failed",
          payload?.message ?? "Unable to subscribe right now. Please try again.",
        );
        return;
      }

      toast.success("Subscribed", "You have been added to the newsletter list.");
      reset();
    } catch {
      toast.error(
        "Network error",
        "Could not reach the newsletter service. Please try again.",
      );
    }
  };

  return (
    <section className="bg-[#041c1e] py-16 px-8 flex justify-center items-center w-full">
      <div className="flex justify-between items-center w-full max-w-[1200px] flex-wrap gap-8 max-md:flex-col max-md:items-stretch max-md:text-center">
        <div className="flex-1 min-w-[280px]">
          <h2 className="text-white text-2xl font-semibold mb-2 leading-tight">
            Want to receive any updates or news?
          </h2>
          <p className="text-gray-400 text-sm m-0">Sign up for our Newsletter</p>
        </div>

        <form
          className="flex gap-3 flex-1 justify-end min-w-[320px] max-md:flex-col max-md:justify-center"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="flex-1 max-w-[400px] max-md:max-w-full">
            <div className="relative">
              <input
                {...register("email")}
                type="email"
                aria-label="Email address"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full px-4 py-3 bg-[#020c0c] border rounded-md text-white text-sm placeholder:text-gray-500 outline-none transition-colors duration-200 focus:border-[#00d1c1] box-border ${
                  errors.email ? "border-red-500" : "border-[#1f3536]"
                }`}
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="text-red-500 text-xs mt-1 absolute left-0"
                >
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#00d1c1] text-[#020c0c] border-none rounded-md text-sm font-semibold cursor-pointer transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Newsletter;
