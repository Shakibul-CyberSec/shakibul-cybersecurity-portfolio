'use client';

import { useEffect } from 'react';

export default function NonceScript({ nonce }) {
  useEffect(() => {
    // Store nonce for any dynamic script injection
    if (nonce && typeof window !== 'undefined') {
      window.__webpack_nonce__ = nonce;
    }

    // Remove Vercel toolbar injections that cause CSP errors
    const cleanVercelToolbar = () => {
      document.querySelectorAll(
        'script[src*="vercel.live"], script[src*="feedback"], iframe[src*="vercel.live"]'
      ).forEach(el => el.remove());
    };

    // Clean immediately
    cleanVercelToolbar();

    // Watch for future injections
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          const el = node;
          const src = el.getAttribute?.('src') || '';
          if (src.includes('vercel.live') || src.includes('feedback')) {
            el.remove();
          }
          // Also check for iframes
          if (el.tagName === 'IFRAME' && src.includes('vercel.live')) {
            el.remove();
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [nonce]);

  return null;
}