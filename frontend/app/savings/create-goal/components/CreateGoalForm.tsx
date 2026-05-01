"use client";

import React from "react";
import { ChevronDown, X } from "lucide-react";
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
  startingAmount: z.preprocess(
    (value) =>
      value === "" || value === undefined || value === null
        ? undefined
        : Number(value),
    z.number().min(0, "Starting amount cannot be negative"),
  ).optional(),
  targetDate: z
    .string()
    .min(1, "Please select a target date")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !Number.isNaN(date.getTime()) && date >= today;
    }, "Target date cannot be in the past"),
  frequency: z.string().min(1, "Please select a frequency"),
  description: z.string().max(200, "Note must be less than 200 characters").optional(),
  autoSave: z.boolean().default(false),
  routeToYield: z.boolean().default(false),
});

type GoalValues = z.infer<typeof GoalSchema>;

export default function CreateGoalForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GoalValues>({
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(GoalSchema),
    defaultValues: {
      goalName: "",
      category: "",
      targetAmount: undefined,
      startingAmount: 0,
      targetDate: "",
      frequency: "monthly",
      description: "",
      autoSave: false,
      routeToYield: false,
    },
  });

  const autoSave = watch("autoSave");
  const routeToYield = watch("routeToYield");

  const onSubmit = async (data: GoalValues) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Goal created:", data);
    reset();
    alert("Goal created successfully!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061218]/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl mx-auto px-6 md:px-8">
        <div className="rounded-2xl border border-white/10 bg-[#0D2626] shadow-2xl overflow-hidden relative">
          {isSubmitting && (
            <div className="absolute inset-0 z-10 bg-[#0A1A1A]/40 backdrop-blur-[2px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <span className="text-cyan-400 font-medium">Creating your goal...</span>
              </div>
            </div>
          )}
          <div className="px-6 pt-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Create New Goal</h2>
            <button
              type="button"
              className="text-[#8C9BAB] hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 space-y-5"
            noValidate
          >
            {/* Goal Name */}
            <div>
              <label
                htmlFor="goalName"
                className="block text-[#8C9BAB] font-semibold mb-2 text-sm"
              >
                Goal Name
              </label>
              <input
                {...register("goalName")}
                id="goalName"
                type="text"
                placeholder="e.g., Emergency Fund"
                aria-invalid={errors.goalName ? "true" : "false"}
                aria-describedby={errors.goalName ? "goalName-error" : undefined}
                className={`w-full px-4 py-2.5 rounded-lg bg-[#0F2D2D] border text-[#8C9BAB] placeholder-[#6a8a93] focus:border-[#00D9C0] focus:outline-none transition-colors ${
                  errors.goalName ? "border-red-500/50" : "border-white/10"
                }`}
                disabled={isSubmitting}
              />
              {errors.goalName && (
                <p id="goalName-error" className="text-red-500 text-xs mt-1">
                  {errors.goalName.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-[#8C9BAB] font-semibold mb-2 text-sm"
              >
                Category
              </label>
              <div className="relative">
                <select
                  {...register("category")}
                  id="category"
                  aria-invalid={errors.category ? "true" : "false"}
                  className={`w-full px-4 py-2.5 rounded-lg bg-[#0F2D2D] border text-[#8C9BAB] focus:border-[#00D9C0] focus:outline-none appearance-none transition-colors ${
                    errors.category ? "border-red-500/50" : "border-white/10"
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">Select category</option>
                  <option value="emergency">Emergency Fund</option>
                  <option value="travel">Travel</option>
                  <option value="education">Education</option>
                  <option value="housing">Housing</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a8a93] pointer-events-none"
                />
              </div>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Target Amount and Starting Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="targetAmount"
                  className="block text-[#8C9BAB] font-semibold mb-2 text-sm"
                >
                  Target Amount
                </label>
                <input
                  {...register("targetAmount")}
                  id="targetAmount"
                  type="number"
                  placeholder="$15,000"
                  step="0.01"
                  aria-invalid={errors.targetAmount ? "true" : "false"}
                  className={`w-full px-4 py-2.5 rounded-lg bg-[#0F2D2D] border text-[#8C9BAB] placeholder-[#6a8a93] focus:border-[#00D9C0] focus:outline-none transition-colors ${
                    errors.targetAmount ? "border-red-500/50" : "border-white/10"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.targetAmount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.targetAmount.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="startingAmount"
                  className="block text-[#8C9BAB] font-semibold mb-2 text-sm"
                >
                  Starting Amount
                </label>
                <input
                  {...register("startingAmount")}
                  id="startingAmount"
                  type="number"
                  placeholder="$0 (optional)"
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0F2D2D] border border-white/10 text-[#8C9BAB] placeholder-[#6a8a93] focus:border-[#00D9C0] focus:outline-none transition-colors"
                  disabled={isSubmitting}
                />
                {errors.startingAmount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.startingAmount.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="targetDate"
                  className="block text-[#8C9BAB] font-semibold mb-2 text-sm"
                >
                  Target Date
                </label>
                <input
                  {...register("targetDate")}
                  id="targetDate"
                  type="date"
                  aria-invalid={errors.targetDate ? "true" : "false"}
                  aria-describedby={errors.targetDate ? "targetDate-error" : undefined}
                  className={`w-full px-4 py-2.5 rounded-lg bg-[#0F2D2D] border text-[#8C9BAB] focus:border-[#00D9C0] focus:outline-none transition-colors ${
                    errors.targetDate ? "border-red-500/50" : "border-white/10"
                  }`}
                  disabled={isSubmitting}
                />
                {errors.targetDate && (
                  <p
                    id="targetDate-error"
                    role="alert"
                    aria-live="assertive"
                    className="text-red-500 text-xs mt-1"
                  >
                    {errors.targetDate.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="frequency"
                  className="block text-[#8C9BAB] font-semibold mb-2 text-sm"
                >
                  Contribution Frequency
                </label>
                <div className="relative">
                  <select
                    {...register("frequency")}
                    id="frequency"
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0F2D2D] border border-white/10 text-[#A1ADAD] focus:border-[#00D9C0] focus:outline-none appearance-none transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="one-time">One-time</option>
                  </select>
                  <ChevronDown
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1ADAD] pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="w-full px-3 py-4 rounded-lg bg-[#0F2D2D] border border-white/10 flex items-center justify-between">
                <label
                  htmlFor="autoSave-toggle"
                  className="text-[#A1ADAD] font-semibold text-sm"
                >
                  Enable auto-save
                </label>
                <button
                  id="autoSave-toggle"
                  type="button"
                  role="switch"
                  aria-checked={autoSave}
                  onClick={() => setValue("autoSave", !autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoSave ? "bg-[#00D9C0]" : "bg-[#1a3f3a]"
                  }`}
                  disabled={isSubmitting}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                      autoSave
                        ? "translate-x-5 bg-white"
                        : "translate-x-0.5 bg-[#A1ADAD]"
                    }`}
                  />
                </button>
              </div>

              <div className="w-full px-3 py-3 rounded-lg bg-[#0F2D2D] border border-white/10 flex items-center justify-between">
                <div>
                  <label
                    htmlFor="yield-toggle"
                    className="text-[#A1ADAD] font-semibold text-sm"
                  >
                    Route to yield pool
                  </label>
                  <p className="text-[#4F6565] text-xs mt-0.5">
                    Earn up to 8% APY on your savings.
                  </p>
                </div>
                <button
                  id="yield-toggle"
                  type="button"
                  role="switch"
                  aria-checked={routeToYield}
                  onClick={() => setValue("routeToYield", !routeToYield)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    routeToYield ? "bg-[#00D9C0]" : "bg-[#1a3f3a]"
                  }`}
                  disabled={isSubmitting}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
                      routeToYield
                        ? "translate-x-5 bg-white"
                        : "translate-x-0.5 bg-[#A1ADAD]"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Note */}
            <div>
              <label
                htmlFor="description"
                className="block text-[#8C9BAB] font-semibold mb-2 text-sm"
              >
                Note (Optional)
              </label>
              <textarea
                {...register("description")}
                id="description"
                placeholder="Add a personal note or description..."
                rows={3}
                className={`w-full px-4 py-2.5 rounded-lg bg-[#0F2D2D] border text-[#8C9BAB] placeholder-[#6a8a93] focus:border-[#00D9C0] focus:outline-none transition-colors resize-none ${
                  errors.description ? "border-red-500/50" : "border-white/10"
                }`}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 border border-white/10 rounded-lg text-[#8C9BAB] font-semibold hover:bg-white/10 transition-colors"
                disabled={isSubmitting}
                onClick={() => reset()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-[#00D9C0] hover:bg-[#00b3a0] text-white font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Goal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
