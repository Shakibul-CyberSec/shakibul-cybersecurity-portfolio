'use client';

import { useEffect } from 'react';

export default function NonceScript({ nonce }) {
  useEffect(() => {
    // Store nonce for any dynamic script injection
    if (nonce && typeof window !== 'undefined') {
      window.__webpack_nonce__ = nonce;
    }

    // Initialize animations for elements that need delayed activation
    const initializeAnimations = () => {
      // Find all elements with animation classes that should start on mount
      const animatedElements = document.querySelectorAll(
        '[class*="animate-fadeIn"], [class*="animate-slideUp"], [class*="animate-scaleIn"]'
      );

      // Ensure they're visible and trigger animations
      animatedElements.forEach((element) => {
        // Force reflow to ensure animation triggers
        void element.offsetWidth;
      });
    };

    // Run after a small delay to ensure DOM is ready
    const timer = setTimeout(initializeAnimations, 50);

    return () => clearTimeout(timer);
  }, [nonce]);

  return null;
}