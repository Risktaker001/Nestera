'use client';

import React from 'react';
import { 
  BookOpen, 
  Wallet, 
  Target, 
  Code2, 
  FileCode, 
  HelpCircle 
} from 'lucide-react';
import clsx from 'clsx';

export type DocSection = 
  | 'getting-started' 
  | 'connect-wallet' 
  | 'savings-goals' 
  | 'api-docs' 
  | 'smart-contracts' 
  | 'faq';

interface SidebarItem {
  id: DocSection;
  label: string;
  icon: React.ElementType;
}

const sidebarItems: SidebarItem[] = [
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
  { id: 'connect-wallet', label: 'Connect Wallet', icon: Wallet },
  { id: 'savings-goals', label: 'Savings Goals', icon: Target },
  { id: 'api-docs', label: 'API Reference', icon: Code2 },
  { id: 'smart-contracts', label: 'Smart Contracts', icon: FileCode },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

interface DocsSidebarProps {
  activeSection: DocSection;
  onSectionChange: (id: DocSection) => void;
}

const DocsSidebar: React.FC<DocsSidebarProps> = ({ activeSection, onSectionChange }) => {
  return (
    <aside className="w-full md:w-64 shrink-0">
      <nav className="sticky top-24 flex flex-col gap-1">
        <div className="text-[0.7rem] font-bold text-[rgba(180,210,210,0.4)] uppercase tracking-[0.1em] mb-4 px-4">
          Documentation
        </div>
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSectionChange(item.id)}
            aria-current={activeSection === item.id ? 'page' : undefined}
            className={clsx(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left border-none cursor-pointer",
              activeSection === item.id
                ? "bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.2)]"
                : "text-[rgba(180,210,210,0.6)] hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))} 
      </nav>
    </aside>
  );
};

export default DocsSidebar;
