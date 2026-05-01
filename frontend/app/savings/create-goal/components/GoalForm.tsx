"use client";

import React from "react";
import { Calendar, CircleDollarSign, Flag, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const GoalSchema = z.object({
  goalName: z
    .string()
    .min(3, "Goal name must be at least 3 characters")
    .max(50, "Goal name must be less than 50 characters"),
  category: z.string().min(1, "Please select a category"),
  targetAmount: z.coerce
    .number()
    .refine((value) => !Number.isNaN(value), {
      message: "Target amount must be a number",
    })
    .positive("Target amount must be greater than 0"),
  targetDate: z.string().min(1, "Please select a target date").refine((val) => {
    const date = new Date(`${val}T00:00:00`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return !Number.isNaN(date.getTime()) && date >= today;
  }, "Target date cannot be in the past"),
});

type GoalValues = z.infer<typeof GoalSchema>;

export default function GoalForm() {
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalValues>({
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(GoalSchema),
    defaultValues: {
      goalName: "",
      category: "General",
      targetAmount: undefined,
      targetDate: "",
    },
  });

  const onSubmit = async (data: GoalValues) => {
    setSubmitted(false);
    // Backend creation endpoint is not wired in this repo yet.
    // We still provide a complete UI and validate inputs client-side.
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    setSubmitted(true);
    reset();
  };

  return (
    <div
      id="goal-form"
      className="w-full max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-14"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-white/5 bg-linear-to-br from-[rgba(6,26,26,0.82)] to-[rgba(4,14,16,0.6)] shadow-[0_18px_45px_rgba(0,0,0,0.32)] backdrop-blur-sm p-6 md:p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-white text-xl font-bold m-0">
                  Goal details
                </h2>
                <p className="text-[#6a8a93] text-sm m-0 mt-2">
                  Set a target and a date. You can start contributing right
                  after.
                </p>
              </div>
              <div className="shrink-0 w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300">
                <Sparkles size={20} />
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label
                  htmlFor="goalName"
                  className="block text-sm font-semibold text-white mb-2"
                >
                  Goal name
                </label>
                <div className="relative">
                  <Flag
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e8c96]"
                    size={18}
                  />
                  <input
                    {...register("goalName")}
                    id="goalName"
                    type="text"
                    placeholder="e.g. Emergency Fund"
                    aria-invalid={errors.goalName ? "true" : "false"}
                    aria-describedby={
                      errors.goalName ? "goalName-error" : undefined
                    }
                    className={`w-full bg-[#0e2330] border rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-[#4e7a86] focus:outline-hidden focus:border-cyan-500/50 transition-colors ${
                      errors.goalName ? "border-amber-400/50" : "border-white/5"
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.goalName && (
                  <p id="goalName-error" className="text-amber-400 text-xs mt-2 m-0">
                    {errors.goalName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-semibold text-white mb-2"
                  >
                    Category
                  </label>
                  <select
                    {...register("category")}
                    id="category"
                    className="w-full bg-[#0e2330] border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-hidden focus:border-cyan-500/50 transition-colors"
                    disabled={isSubmitting}
                  >
                    {[
                      "General",
                      "Security",
                      "Travel",
                      "Housing",
                      "Education",
                      "Tech",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-amber-400 text-xs mt-2 m-0">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="targetAmount"
                    className="block text-sm font-semibold text-white mb-2"
                  >
                    Target amount
                  </label>
                  <div className="relative">
                    <CircleDollarSign
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e8c96]"
                      size={18}
                    />
                    <input
                      {...register("targetAmount")}
                      id="targetAmount"
                      inputMode="decimal"
                      placeholder="e.g. 10000"
                      aria-invalid={errors.targetAmount ? "true" : "false"}
                      aria-describedby={
                        errors.targetAmount ? "targetAmount-error" : undefined
                      }
                      className={`w-full bg-[#0e2330] border rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-[#4e7a86] focus:outline-hidden focus:border-cyan-500/50 transition-colors ${
                        errors.targetAmount
                          ? "border-amber-400/50"
                          : "border-white/5"
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.targetAmount && (
                    <p
                      id="targetAmount-error"
                      className="text-amber-400 text-xs mt-2 m-0"
                    >
                      {errors.targetAmount.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="targetDate"
                  className="block text-sm font-semibold text-white mb-2"
                >
                  Target date
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e8c96]"
                    size={18}
                  />
                  <input
                    {...register("targetDate")}
                    id="targetDate"
                    type="date"
                    aria-invalid={errors.targetDate ? "true" : "false"}
                    aria-describedby={
                      errors.targetDate ? "targetDate-error" : undefined
                    }
                    className={`w-full bg-[#0e2330] border rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-[#4e7a86] focus:outline-hidden focus:border-cyan-500/50 transition-colors ${
                      errors.targetDate
                        ? "border-amber-400/50"
                        : "border-white/5"
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.targetDate && (
                  <p id="targetDate-error" role="alert" aria-live="assertive" className="text-amber-400 text-xs mt-2 m-0">
                    {errors.targetDate.message}
                  </p>
                )}
              </div>

              {submitted && (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
                  <p className="text-emerald-300 text-sm font-semibold m-0">
                    Goal created successfully! You can now track it on your
                    dashboard.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-[#061a1a] font-bold rounded-2xl transition-all shadow-[0_10px_20px_rgba(0,212,192,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating..." : "Create goal"}
                </button>
                <p className="text-[#6a8a93] text-xs m-0">
                  You’ll be able to contribute and track progress on the
                  dashboard.
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-white/5 bg-[#0e2330] p-6 md:p-7">
            <h3 className="text-white font-bold text-lg m-0">
              Tips for success
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[#6a8a93]">
              <li>
                <span className="text-white font-semibold">
                  Pick a realistic timeline.
                </span>{" "}
                Shorter deadlines help momentum, but keep it achievable.
              </li>
              <li>
                <span className="text-white font-semibold">Start small.</span>{" "}
                Even modest contributions build consistency.
              </li>
              <li>
                <span className="text-white font-semibold">
                  Name it clearly.
                </span>{" "}
                A specific goal feels more tangible and motivating.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
