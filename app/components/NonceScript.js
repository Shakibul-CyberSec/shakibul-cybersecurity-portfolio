'use client';

import { useEffect } from 'react';

export default function NonceScript({ nonce }) {
  useEffect(() => {
    // Store nonce for any dynamic script injection
    if (nonce && typeof window !== 'undefined') {
      window.__webpack_nonce__ = nonce;
    }

    // Helper to recursively remove Vercel toolbar and feedback elements
    const removeVercelNodes = (node) => {
      if (node.nodeType !== 1) return;
      const tagName = node.tagName.toLowerCase();
      const src = node.getAttribute?.('src') || '';
      const id = node.id || '';
      
      if (
        src.includes('vercel.live') ||
        src.includes('feedback') ||
        (tagName === 'iframe' && src.includes('vercel')) ||
        id.includes('vercel-toolbar')
      ) {
        node.remove();
        return;
      }
      
      if (node.children) {
        const children = Array.from(node.children);
        for (let i = 0; i < children.length; i++) {
          removeVercelNodes(children[i]);
        }
      }
    };

    // Clean existing elements immediately
    removeVercelNodes(document.documentElement);

    // Watch for future injections and clean them recursively
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          removeVercelNodes(node);
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