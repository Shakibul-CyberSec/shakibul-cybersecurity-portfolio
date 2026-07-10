import './globals.css';
import { headers } from 'next/headers';
import NonceScript from './components/NonceScript';

export const metadata = {
  title: 'Shakibul-Bokthiar',
  description: 'Professional cybersecurity specialist specializing in web application security, penetration testing, and vulnerability assessment.',
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" type="image/svg+xml" href="/cyber-icon.svg" />

        {/* Critical inline styles with nonce */}
        {nonce && (
          <style nonce={nonce}>
            {`
              body { 
                margin: 0; 
                padding: 0; 
                overflow-x: hidden;
              }
              * { 
                box-sizing: border-box; 
              }
            `}
          </style>
        )}
        {/* Block Vercel toolbar injections before they cause CSP errors */}
        {nonce && (
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `
            (function() {
              function removeVercelNodes(node) {
                if (node.nodeType !== 1) return;
                var tagName = node.tagName.toLowerCase();
                var src = node.getAttribute && node.getAttribute('src') || '';
                var id = node.id || '';
                if (
                  src.indexOf('vercel.live') > -1 ||
                  src.indexOf('feedback') > -1 ||
                  (tagName === 'iframe' && src.indexOf('vercel') > -1) ||
                  id.indexOf('vercel-toolbar') > -1
                ) {
                  node.remove();
                  return;
                }
                if (node.children) {
                  var children = Array.from(node.children);
                  for (var i = 0; i < children.length; i++) {
                    removeVercelNodes(children[i]);
                  }
                }
              }

              // Run immediately to catch any elements already in the DOM
              removeVercelNodes(document.documentElement);

              // Observe any new additions to the DOM
              new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                  mutation.addedNodes.forEach(function(node) {
                    removeVercelNodes(node);
                  });
                });
              }).observe(document.documentElement, { childList: true, subtree: true });
            })();
          `}} />
        )}
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <NonceScript nonce={nonce} />
        <div className="fixed inset-0 bg-linear-to-br from-cyber-dark via-black to-cyber-dark pointer-events-none will-change-transform gpu-accelerate" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
