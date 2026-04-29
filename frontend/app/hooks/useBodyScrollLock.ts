"use client";

import { useEffect } from "react";

interface UseBodyScrollLockOptions {
  /**
   * Whether the body scroll should be locked
   */
  isLocked: boolean;
}

/**
 * Hook to lock/unlock body scroll
 * Useful for modals, mobile menus, and overlays
 * 
 * @example
 * useBodyScrollLock({ isLocked: isMenuOpen });
 */
export function useBodyScrollLock({ isLocked }: UseBodyScrollLockOptions) {
  useEffect(() => {
    if (!isLocked) {
      return;
    }

    // Store original body styles
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
    
    // Get scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Lock scroll
    document.body.style.overflow = "hidden";
    
    // Add padding to compensate for scrollbar removal (prevents layout shift)
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
}
