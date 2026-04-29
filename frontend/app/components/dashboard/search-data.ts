"use client";

export type SearchEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "goals" | "pools" | "transactions" | "dashboard" | "pages";
  keywords: string[];
};

export const searchEntries: SearchEntry[] = [
  {
    id: "dashboard-overview",
    title: "Dashboard Overview",
    description: "Net worth, wallet balance, active pools, and recent activity.",
    href: "/dashboard",
    category: "dashboard",
    keywords: ["overview", "wallet", "portfolio", "activity"],
  },
  {
    id: "dashboard-analytics",
    title: "Portfolio Analytics",
    description: "Performance, allocation, and comparison charts.",
    href: "/dashboard/analytics",
    category: "dashboard",
    keywords: ["analytics", "performance", "charts", "allocation"],
  },
  {
    id: "dashboard-transactions",
    title: "Transaction History",
    description: "Review deposits, swaps, withdrawals, and yield activity.",
    href: "/dashboard/transactions",
    category: "transactions",
    keywords: ["transactions", "history", "export", "csv"],
  },
  {
    id: "dashboard-governance",
    title: "Governance",
    description: "Vote on proposals and follow protocol decisions.",
    href: "/dashboard/governance",
    category: "pages",
    keywords: ["vote", "proposals", "governance"],
  },
  {
    id: "dashboard-settings",
    title: "Settings",
    description: "Update preferences, security settings, and notifications.",
    href: "/dashboard/settings",
    category: "pages",
    keywords: ["preferences", "security", "notifications"],
  },
  {
    id: "dashboard-profile",
    title: "Profile",
    description: "Manage your account identity and preferences.",
    href: "/dashboard/profile",
    category: "pages",
    keywords: ["profile", "account", "identity"],
  },
  {
    id: "create-goal",
    title: "Create a Goal",
    description: "Start a new savings goal with targeted milestones.",
    href: "/savings/create-goal",
    category: "goals",
    keywords: ["goal", "create", "target", "milestone"],
  },
  {
    id: "goals-page",
    title: "Goal Management",
    description: "Manage savings goals and progress tracking.",
    href: "/goals",
    category: "goals",
    keywords: ["goals", "savings", "target", "progress"],
  },
  {
    id: "savings-pools",
    title: "Savings Pools",
    description: "Browse pool strategies including USDC Flexible and XLM Staking.",
    href: "/dashboard/savings-pools",
    category: "pools",
    keywords: ["pools", "apy", "yield", "staking", "usdc", "xlm"],
  },
  {
    id: "support",
    title: "Support Center",
    description: "Find answers and troubleshooting guidance.",
    href: "/support",
    category: "pages",
    keywords: ["help", "faq", "support"],
  },
  {
    id: "docs",
    title: "Documentation",
    description: "Product and integration documentation.",
    href: "/docs",
    category: "pages",
    keywords: ["docs", "guide", "documentation"],
  },
  {
    id: "community",
    title: "Community",
    description: "Community activity, proposals, and discussions.",
    href: "/community",
    category: "pages",
    keywords: ["community", "proposals", "discussion"],
  },
  {
    id: "transaction-deposit-usdc",
    title: "Deposit USDC",
    description: "Today, 10:23 AM - +$500.00 completed deposit.",
    href: "/dashboard/transactions",
    category: "transactions",
    keywords: ["deposit", "usdc", "completed", "wallet"],
  },
  {
    id: "transaction-yield-earned",
    title: "Yield Earned",
    description: "Today, 8:15 AM - yield reward credited.",
    href: "/dashboard/transactions",
    category: "transactions",
    keywords: ["yield", "reward", "interest"],
  },
  {
    id: "transaction-swap",
    title: "Swap ETH to USDC",
    description: "Yesterday, 4:32 PM - converted ETH into USDC.",
    href: "/dashboard/transactions",
    category: "transactions",
    keywords: ["swap", "eth", "usdc", "trade"],
  },
];

export function buildSearchIndex() {
  return searchEntries;
}
