import React, { useState } from 'react';
import { TelegramAlert } from '../types';
import { Send, Terminal, Zap, ShieldAlert, Brain, CheckCircle2, Copy } from 'lucide-react';

interface TelegramBotTerminalProps {
  alerts: TelegramAlert[];
  onTriggerTestAlert: () => Promise<any>;
  onInspectTokenAddress: (address: string) => void;
}

export const TelegramBotTerminal: React.FC<TelegramBotTerminalProps> = ({
  alerts,
  onTriggerTestAlert,
  onInspectTokenAddress,
}) => {
  const [commandInput, setCommandInput] = useState('/trending');
  const [commandHistory, setCommandHistory] = useState<
    { command: string; response: string; timestamp: number }[]
  >([
    {
      command: '/start',
      response: `🤖 Robinhood Chain Meme Coin Intelligence Bot\n\nActive on Robinhood Chain Mainnet (Chain ID: 4663).\nConnected to hood.fun, LaunchHood & Bags.fm bonding curves.\n\nType /new, /trending, /movers, /whales, /graduating or /help`,
      timestamp: Date.now() - 30000,
    },
  ]);
  const [executing, setExecuting] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commandInput.trim() || executing) return;

    const cmd = commandInput.trim();
    setExecuting(true);
    try {
      const res = await fetch('/api/telegram/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      setCommandHistory((prev) => [
        {
          command: cmd,
          response: data.reply || 'No response from bot.',
          timestamp: Date.now(),
        },
        ...prev,
      ]);
      setCommandInput('');
    } catch (err: any) {
      setCommandHistory((prev) => [
        {
          command: cmd,
          response: `Error: ${err.message}`,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    } finally {
      setExecuting(false);
    }
  };

  const handleSendTest = async () => {
    setSendingAlert(true);
    try {
      await onTriggerTestAlert();
    } finally {
      setSendingAlert(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'P0':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">P0 CRITICAL</span>;
      case 'P1':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">P1 HIGH</span>;
      case 'P2':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">P2 DISCOVERY</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-white/[0.08]">P3 UPDATE</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Column: Telegram Live Alert Feed */}
      <div className="space-y-3">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-400" /> Telegram Outgoing Alert Feed
            </h3>
            <p className="text-xs text-slate-400">
              Two-stage pipeline: Instant deterministic alert &lt;2s, followed by AI diagnosis
            </p>
          </div>
          <button
            onClick={handleSendTest}
            disabled={sendingAlert}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-950/40 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{sendingAlert ? 'Sending...' : 'Trigger Test Alert'}</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30">
              No alerts in current session buffer. Use "Trigger Test Alert" or simulation dropdown above!
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] space-y-2.5 shadow-xl shadow-slate-950/30 hover:border-indigo-400/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(alert.priority)}
                    <span className="text-[11px] font-mono text-slate-400">
                      Stage {alert.stage || 1} • {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{alert.eventId.slice(0, 18)}...</span>
                </div>

                <div className="font-bold text-white text-sm">{alert.title}</div>

                <pre className="text-xs font-mono text-slate-300 bg-slate-900/60 p-3.5 rounded-xl whitespace-pre-wrap border border-white/[0.06] leading-relaxed overflow-x-auto">
                  {alert.textMarkdown}
                </pre>

                {/* Inline Action Buttons Simulator */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <button
                    onClick={() => onInspectTokenAddress(alert.tokenAddress)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-indigo-600 hover:text-white text-slate-200 border border-white/[0.08] hover:border-indigo-400/30 font-medium transition-all"
                  >
                    🔍 Inspect ${alert.tokenSymbol}
                  </button>
                  <a
                    href={`https://explorer.robinhood.com/token/${alert.tokenAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-indigo-600 hover:text-white text-indigo-400 hover:text-white border border-white/[0.08] hover:border-indigo-400/30 font-medium transition-all"
                  >
                    Explorer ↗
                  </a>
                  <button
                    onClick={() => onInspectTokenAddress(alert.tokenAddress)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-medium transition-all"
                  >
                    🧠 AI Diagnosis
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Interactive Telegram Bot Command Terminal */}
      <div className="p-5 rounded-2xl bg-slate-800/70 backdrop-blur-md border border-white/[0.08] shadow-xl shadow-slate-950/30 flex flex-col h-full min-h-[500px]">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Terminal className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Interactive Bot Command Terminal</h3>
              <p className="text-[11px] text-slate-400">Simulates real chat with @RobinhoodMemeBot</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {['/new', '/trending', '/movers', '/whales', '/graduating'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => {
                  setCommandInput(cmd);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-700/60 text-[11px] font-mono text-slate-300 border border-white/[0.08] transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* Command Output Feed */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono">
          {commandHistory.map((item, idx) => (
            <div key={idx} className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06]">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span className="text-indigo-400 font-bold">&gt; {item.command}</span>
                <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
              <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed text-[11px]">
                {item.response}
              </pre>
            </div>
          ))}
        </div>

        {/* Terminal Input Bar */}
        <form onSubmit={handleSendCommand} className="pt-3.5 border-t border-white/[0.08] flex gap-2">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type a bot command (e.g. /new, /trending, /movers, /token 0x...)"
            className="flex-1 bg-slate-900/80 border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 font-mono"
          />
          <button
            type="submit"
            disabled={executing || !commandInput.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-950/40 disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
