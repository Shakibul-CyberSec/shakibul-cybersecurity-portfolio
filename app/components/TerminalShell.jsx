'use client';
import { useState, useRef } from 'react';
import { FiTerminal, FiMaximize2, FiMinimize2, FiCornerDownLeft } from 'react-icons/fi';
import { Animate } from './Animations';

export default function TerminalShell() {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState([
    { type: 'sys', text: 'Shakibul CyberSec OS v2.6.0 (x86_64-pc-linux-gnu)' },
    { type: 'sys', text: 'Type "help" for a list of available cybersecurity commands.' }
  ]);
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef(null);

  const handleCommand = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = inputVal.trim().toLowerCase();
      if (!cmd) return;

      const newHistory = [...history, { type: 'user', text: `$ ${inputVal}` }];

      switch (cmd) {
        case 'help':
          newHistory.push({
            type: 'output',
            text: `Available Commands:
  whoami    - Display professional bio & background summary
  skills    - View technical penetration testing & defensive stack
  soc       - Show live SOC threat mitigation telemetry
  contact   - Display email & communication links
  cat flag.txt - [CLASSIFIED] Secret CTF flag challenge
  clear     - Clear terminal buffer`
          });
          break;

        case 'whoami':
          newHistory.push({
            type: 'output',
            text: `Shakibul Bokthiar | Cybersecurity Specialist & Security Engineer
Focused on Web Application Penetration Testing, Secure Software Development, Threat Hunting, and Edge Security Architecture.`
          });
          break;

        case 'skills':
          newHistory.push({
            type: 'output',
            text: `[+] Offensive: Web App Pentesting, API Security, OWASP Top 10, Network Recon
[+] Defensive: Edge Rate-Limiting, Subnet Shadow-Banning, XSS/CSP Nonce Mitigation, Rate-Limit Proxies
[+] Full-Stack: Next.js 16, React 19, Tailwind CSS v4, Node.js, Upstash Redis, Nodemailer`
          });
          break;

        case 'soc':
          newHistory.push({
            type: 'output',
            text: `STATUS: 200 OK | Threat Level: DEFCON 5 SECURE
Scrapers Blocked: 1,420+ | Shadow Banned Subnets: 38
CSP Nonce Verification: Active`
          });
          break;

        case 'contact':
          newHistory.push({
            type: 'output',
            text: `Email: contact@shakibul.cybersec
LinkedIn: linkedin.com/in/shakibul-cybersec
GitHub: github.com/Shakibul-CyberSec`
          });
          break;

        case 'cat flag.txt':
          newHistory.push({
            type: 'flag',
            text: `🚩 CONGRATULATIONS! You found the hidden Easter egg:
CTF{N2g0azFidTFfY1liM3JfczNjXzIwMjZfZDNmM25zMXYzX3N0NGNr}`
          });
          break;

        case 'clear':
          setHistory([]);
          setInputVal('');
          return;

        default:
          newHistory.push({
            type: 'error',
            text: `Command not found: "${cmd}". Type "help" for a list of valid commands.`
          });
          break;
      }

      setHistory(newHistory);
      setInputVal('');
    }
  };

  return (
    <section id="terminal" className="py-16 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <Animate animation="fadeInUp" delay={0.1}>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-heading text-white font-bold">
              Interactive <span className="text-neon-green">Cyber Web Shell</span>
            </h2>
            <p className="text-cyber-gray text-xs sm:text-sm font-mono mt-1">
              Execute terminal commands to explore profile metrics directly.
            </p>
          </div>
        </Animate>

        {/* Terminal Box */}
        <Animate animation="fadeInUp" delay={0.2}>
          <div
            className="bg-[#0d0d0d] border border-cyber-border rounded-xl shadow-2xl overflow-hidden font-mono text-xs sm:text-sm transition-all duration-300"
          >
            {/* Header Bar */}
            <div className="bg-[#151515] px-4 py-3 border-b border-cyber-border flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                <span className="ml-2 text-cyber-gray text-xs font-mono flex items-center space-x-2">
                  <FiTerminal className="text-neon-green" />
                  <span>shakibul@cybersec-node:~</span>
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="text-cyber-gray hover:text-white transition-colors cursor-pointer"
              >
                {isMinimized ? <FiMaximize2 /> : <FiMinimize2 />}
              </button>
            </div>

            {/* Terminal Output Area */}
            {!isMinimized && (
              <div className="p-4 h-80 overflow-y-auto space-y-2.5 custom-scrollbar">
                {history.map((item, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {item.type === 'user' && (
                      <div className="text-neon-green font-bold">{item.text}</div>
                    )}
                    {item.type === 'sys' && (
                      <div className="text-cyber-gray italic">{item.text}</div>
                    )}
                    {item.type === 'output' && (
                      <pre className="text-white whitespace-pre-wrap font-mono">{item.text}</pre>
                    )}
                    {item.type === 'flag' && (
                      <div className="p-2.5 bg-neon-green/10 border border-neon-green/40 text-neon-green rounded-lg font-bold">
                        {item.text}
                      </div>
                    )}
                    {item.type === 'error' && (
                      <div className="text-red-400">{item.text}</div>
                    )}
                  </div>
                ))}

                {/* Input prompt line */}
                <div
                  className="flex items-center space-x-2 pt-1 cursor-text"
                  onClick={() => inputRef.current?.focus()}
                >
                  <span className="text-neon-green font-bold">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleCommand}
                    className="flex-1 bg-transparent text-white outline-none font-mono caret-neon-green"
                    placeholder="Type 'help'..."
                  />
                  <FiCornerDownLeft className="text-cyber-gray text-xs" />
                </div>
              </div>
            )}
          </div>
        </Animate>

      </div>
    </section>
  );
}
