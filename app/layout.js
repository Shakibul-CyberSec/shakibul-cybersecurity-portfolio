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
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <NonceScript nonce={nonce} />
        <div className="fixed inset-0 bg-gradient-to-br from-cyber-dark via-black to-cyber-dark pointer-events-none will-change-transform gpu-accelerate" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
