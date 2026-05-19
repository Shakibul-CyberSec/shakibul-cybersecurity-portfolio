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
            new MutationObserver(function(m,o){
              m.forEach(function(r){
                r.addedNodes.forEach(function(n){
                  if(n.nodeType!==1)return;
                  var s=n.getAttribute&&n.getAttribute('src')||'';
                  if(s.indexOf('vercel.live')>-1||s.indexOf('feedback')>-1||
                     (n.tagName==='IFRAME'&&s.indexOf('vercel')>-1)){
                    n.remove();
                  }
                });
              });
            }).observe(document.documentElement,{childList:true,subtree:true});
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
