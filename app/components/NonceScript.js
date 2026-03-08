'use client';

import { useEffect } from 'react';

export default function NonceScript({ nonce }) {
  useEffect(() => {
    // Store nonce for any dynamic script injection
    if (nonce && typeof window !== 'undefined') {
      window.__webpack_nonce__ = nonce;
    }
  }, [nonce]);

  return null;
}