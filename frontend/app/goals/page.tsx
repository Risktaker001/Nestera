import { Metadata } from "next";
import GoalManagementHeader from "./GoalsClient";

export const metadata: Metadata = {
  title: "Savings Goals",
  description: "Explore and create personalized savings goals. Set targets, choose frequencies, and watch your savings grow on-chain.",
  alternates: {
    canonical: "/goals",
  },
  openGraph: {
    title: "Savings Goals - Nestera",
    description: "Explore and create personalized savings goals. Set targets, choose frequencies, and watch your savings grow on-chain.",
    images: ["/api/og?page=savings"],
  },
};

export default function Page() {
  return <GoalManagementHeader />;
}