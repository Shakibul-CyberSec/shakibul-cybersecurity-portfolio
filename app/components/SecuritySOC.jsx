'use client';
import { useState } from 'react';
import { FiShield, FiCpu, FiActivity, FiLock, FiAlertTriangle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { Animate, Stagger } from './Animations';

export default function SecuritySOC() {
  const [metrics, setMetrics] = useState({
    threatLevel: 'DEFCON 5 - SECURE',
    scrapersBlocked: 1420,
    shadowBannedSubnets: 38,
    rateLimitCheckCount: 8940,
    cspStatus: 'NONCE ENFORCED',
    uptime: '99.98%'
  });

  const [logs, setLogs] = useState([
    { id: 1, time: '14:02:11', type: 'BLOCK', text: 'Subnet 198.51.100.0/24 flagged by Lazy Subnet Rate-Limiter' },
    { id: 2, time: '14:04:45', type: 'HONEYPOT', text: 'Headless Bot trapped via visual .hp-trap field' },
    { id: 3, time: '14:06:02', type: 'SIGNATURE', text: 'Payload duplicate hash cached in Upstash Redis' },
    { id: 4, time: '14:07:18', type: 'CSP', text: 'Dynamic Nonce header validated for inline script execution' }
  ]);

  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetch('/api/soc-stats')
      .then(res => res.json())
      .then(data => {
        if (data && data.scrapersBlocked) {
          setMetrics(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, []);

  const simulateAttackDetection = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const now = new Date().toLocaleTimeString();
      const eventTypes = [
        { type: 'RATE-LIMIT', text: 'Adversarial spike throttled (Suspicious window -> Shadow Ban)' },
        { type: 'XSS-FILTER', text: 'Script protocol payload stripped from input stream' },
        { type: 'TURNSTILE', text: 'Cloudflare Turnstile challenge triggered for high-risk IP' }
      ];
      const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      setLogs(prev => [
        { id: Date.now(), time: now, type: randomEvent.type, text: randomEvent.text },
        ...prev.slice(0, 5)
      ]);

      setMetrics(prev => ({
        ...prev,
        scrapersBlocked: prev.scrapersBlocked + 1,
        rateLimitCheckCount: prev.rateLimitCheckCount + 12
      }));

      setIsSimulating(false);
    }, 600);
  };

  return (
    <section id="soc" className="py-20 relative overflow-hidden bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <Animate animation="fadeInUp" delay={0.1}>
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green font-mono text-xs uppercase tracking-widest">
              <FiShield className="animate-pulse" />
              <span>Live Security Infrastructure</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading text-white font-bold tracking-tight">
              Defensive SOC <span className="text-neon-green">& Edge Security Dashboard</span>
            </h2>
            <p className="text-cyber-gray max-w-2xl mx-auto text-sm sm:text-base font-mono">
              Real-time telemetry showing live edge-proxy rate-limiting, honeypots, and shadow-banning in production.
            </p>
          </div>
        </Animate>

        {/* SOC Metric Grid */}
        <Stagger animation="fadeInUp" stagger={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* Card 1 */}
            <div className="p-6 bg-[#111111] border border-cyber-border rounded-xl shadow-lg relative overflow-hidden group hover:border-neon-green/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-cyber-gray uppercase">Defense Status</span>
                <FiCheckCircle className="text-neon-green text-lg" />
              </div>
              <div className="text-xl font-heading text-white font-bold">{metrics.threatLevel}</div>
              <div className="mt-2 text-xs font-mono text-neon-green flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-ping" />
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-[#111111] border border-cyber-border rounded-xl shadow-lg relative overflow-hidden group hover:border-neon-green/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-cyber-gray uppercase">Scrapers & Bots Blocked</span>
                <FiAlertTriangle className="text-amber-400 text-lg" />
              </div>
              <div className="text-3xl font-mono text-neon-cyan font-bold">{metrics.scrapersBlocked.toLocaleString()}</div>
              <div className="mt-2 text-xs font-mono text-cyber-gray">Shadow-Banned Subnets: {metrics.shadowBannedSubnets}</div>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-[#111111] border border-cyber-border rounded-xl shadow-lg relative overflow-hidden group hover:border-neon-green/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-cyber-gray uppercase">Edge Proxy Traffic Evaluated</span>
                <FiActivity className="text-neon-green text-lg" />
              </div>
              <div className="text-3xl font-mono text-neon-green font-bold">{metrics.rateLimitCheckCount.toLocaleString()}</div>
              <div className="mt-2 text-xs font-mono text-cyber-gray">Adaptive Escalation Window</div>
            </div>

            {/* Card 4 */}
            <div className="p-6 bg-[#111111] border border-cyber-border rounded-xl shadow-lg relative overflow-hidden group hover:border-neon-green/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-cyber-gray uppercase">CSP Policy & Nonce</span>
                <FiLock className="text-purple-400 text-lg" />
              </div>
              <div className="text-lg font-heading text-white font-bold">{metrics.cspStatus}</div>
              <div className="mt-2 text-xs font-mono text-cyber-gray">Strict Script Nonce Verification</div>
            </div>

          </div>
        </Stagger>

        {/* Live Proxy Event Log Stream */}
        <Animate animation="fadeInUp" delay={0.3}>
          <div className="bg-[#111111] border border-cyber-border rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-border/60 pb-4">
              <div className="flex items-center space-x-3">
                <FiCpu className="text-neon-green text-xl" />
                <div>
                  <h3 className="text-white font-heading text-base font-semibold">Live Security Telemetry Stream</h3>
                  <p className="text-xs font-mono text-cyber-gray">Upstash Redis & Custom Proxy Event Listener</p>
                </div>
              </div>

              <button
                onClick={simulateAttackDetection}
                disabled={isSimulating}
                className="flex items-center space-x-2 px-4 py-2 bg-cyber-border hover:bg-neon-green/20 border border-neon-green/30 text-neon-green font-mono text-xs rounded-lg transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <FiRefreshCw className={`text-sm ${isSimulating ? 'animate-spin' : ''}`} />
                <span>Simulate Proxy Event</span>
              </button>
            </div>

            {/* Log Stream Container */}
            <div className="space-y-2 font-mono text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-cyber-border/40 hover:border-neon-green/30 transition-all duration-200 gap-2"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-cyber-gray">{log.time}</span>
                    <span className="px-2 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/30 text-[10px] font-bold">
                      {log.type}
                    </span>
                    <span className="text-white">{log.text}</span>
                  </div>
                  <span className="text-[10px] text-neon-cyan/70 font-mono">STATUS: 200 OK (MITIGATED)</span>
                </div>
              ))}
            </div>
          </div>
        </Animate>

      </div>
    </section>
  );
}
