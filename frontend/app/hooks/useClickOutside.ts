"use client";

import { RefObject, useEffect } from "react";

interface UseClickOutsideOptions {
  /**
   * Whether the click outside listener is active
   */
  isActive: boolean;
  
  /**
   * Ref to the element that should not trigger the callback when clicked
   */
  ref: RefObject<HTMLElement | null>;
  
  /**
   * Callback function to execute when clicking outside
   */
  onClickOutside: () => void;
  
  /**
   * Optional array of additional refs to exclude from triggering the callback
   */
  excludeRefs?: RefObject<HTMLElement | null>[];
}

/**
 * Hook to detect clicks outside of a specified element
 * 
 * @example
 * const menuRef = useRef<HTMLDivElement>(null);
 * useClickOutside({
 *   isActive: isMenuOpen,
 *   ref: menuRef,
 *   onClickOutside: () => setIsMenuOpen(false)
 * });
 */
export function useClickOutside({
  isActive,
  ref,
  onClickOutside,
  excludeRefs = [],
}: UseClickOutsideOptions) {
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Check if click is inside the main ref
      if (ref.current?.contains(target)) {
        return;
      }
      
      // Check if click is inside any excluded refs
      const isInsideExcludedRef = excludeRefs.some(
        (excludeRef) => excludeRef.current?.contains(target)
      );
      
      if (isInsideExcludedRef) {
        return;
      }
      
      // Click is outside all refs, trigger callback
      onClickOutside();
    };

    // Add listeners with a small delay to avoid immediate triggering
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isActive, ref, onClickOutside, excludeRefs]);
}
