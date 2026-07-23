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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" type="image/svg+xml" href="/cyber-icon.svg" />

        {/* Critical inline styles with nonce */}
        {nonce && (
          <style nonce={nonce} suppressHydrationWarning>
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
        {/* Block Vercel toolbar injections and patch CSP violations before they cause errors */}
        {nonce && (
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `
            (function() {
              // 1. Automatically inject nonce to all dynamically created style tags
              var originalCreateElement = document.createElement;
              document.createElement = function(tagName, options) {
                var el = originalCreateElement.call(document, tagName, options);
                var tag = tagName.toLowerCase();
                if (tag === 'style') {
                  el.setAttribute('nonce', '${nonce}');
                } else if (tag === 'iframe') {
                  // Intercept Vercel toolbar iframes and load blank pages to prevent frame-src violations
                  Object.defineProperty(el, 'src', {
                    get: function() {
                      return this.getAttribute('src') || '';
                    },
                    set: function(val) {
                      if (val && (val.indexOf('vercel.live') > -1 || val.indexOf('vercel') > -1)) {
                        val = 'about:blank';
                      }
                      this.setAttribute('src', val);
                    },
                    configurable: true
                  });
                }
                return el;
              };

              // 2. Intercept setAttribute('style', ...) and apply via CSSOM to prevent style-src violations
              var originalSetAttribute = Element.prototype.setAttribute;
              Element.prototype.setAttribute = function(name, value) {
                if (name && name.toLowerCase() === 'style') {
                  var cssRules = (value || '').split(';');
                  for (var i = 0; i < cssRules.length; i++) {
                    var rule = cssRules[i].trim();
                    if (!rule) continue;
                    var colonIndex = rule.indexOf(':');
                    if (colonIndex > -1) {
                      var prop = rule.substring(0, colonIndex).trim();
                      var val = rule.substring(colonIndex + 1).trim();
                      this.style.setProperty(prop, val);
                    }
                  }
                  return;
                }
                return originalSetAttribute.call(this, name, value);
              };

              // 3. Aggressively clean up any physical DOM elements
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

              removeVercelNodes(document.documentElement);

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
