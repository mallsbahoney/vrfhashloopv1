import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@pooflabs/web';
import { toast } from 'sonner';
import { Ticket, Trophy, Zap, RefreshCw, Clock, ChevronRight, Star } from 'lucide-react';
import { useRealtimeData } from '@/hooks/use-realtime-data';
import {
  subscribeLotteryPot,
  runGetPotBalanceQueryForLotteryPot,
  LotteryPotResponse,
} from '@/lib/collections/lotteryPot';
import {
  subscribeLotteryState,
  subscribeManyLotteryState,
  setLotteryState,
  LotteryStateResponse,
  subscribeManyLotteryStateTickets,
  LotteryStateTicketsResponse,
} from '@/lib/collections/lotteryState';
import { Address } from '@/lib/db-client';
import { POT_ID } from '@/lib/constants';
import { buyTicketWithError, isInsufficientFundsError } from '@/utils/buyTicket';
import WalletButton from '@/components/WalletButton';

// ── Constants ──────────────────────────────────────────────────────────────
// 2^53 — max safe JS integer, used as VRF upper bound
const MAX_NUM_BIGINT = 9007199254740992n;
const MAX_NUM_DISPLAY = '9 quadrillion';

// ── Round resolution helper ─────────────────────────────────────────────────
// Given all rounds, find the current one: prefer the active round, otherwise
// fall back to the most recently created round.
function resolveCurrentRound(allRounds: LotteryStateResponse[] | null): LotteryStateResponse | null {
  if (!allRounds || allRounds.length === 0) return null;
  const active = allRounds.find((r) => r.isActive);
  if (active) return active;
  // No active round — pick the most recently created one (admin closed it / VRF completed)
  return [...allRounds].sort((a, b) => (b.tarobase_created_at ?? 0) - (a.tarobase_created_at ?? 0))[0];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function truncateAddress(addr: string) {
  if (!addr) return '';
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatSol(lamports: number) {
  return (lamports / 1e9).toFixed(3);
}

// Format large u64 numbers in compact, readable notation
function formatNumber(n: number | bigint | null | undefined): string {
  if (n == null) return '—';
  const big = typeof n === 'bigint' ? n : BigInt(Math.round(n));
  if (big === 0n) return '0';
  const Q = 1_000_000_000_000_000_000n; // quintillion
  const T = 1_000_000_000_000n;          // trillion
  const B = 1_000_000_000n;              // billion
  const M = 1_000_000n;                  // million
  if (big >= Q) {
    const val = Number(big * 1000n / Q) / 1000;
    return `${val.toFixed(2)}Q`;
  }
  if (big >= T) {
    const val = Number(big * 1000n / T) / 1000;
    return `${val.toFixed(2)}T`;
  }
  if (big >= B) {
    const val = Number(big * 1000n / B) / 1000;
    return `${val.toFixed(2)}B`;
  }
  if (big >= M) {
    const val = Number(big * 1000n / M) / 1000;
    return `${val.toFixed(2)}M`;
  }
  return Number(big).toLocaleString();
}

function winPercent(mainNumber: number): string {
  // Use BigInt to avoid precision loss with u64-range numbers
  const main = BigInt(Math.round(mainNumber));
  if (main >= MAX_NUM_BIGINT) return '0.00';
  // pct = (max - main) / max * 100, computed with 6 decimal digits of precision
  const precision = 1_000_000n;
  const pct = Number((MAX_NUM_BIGINT - main) * precision * 100n / MAX_NUM_BIGINT) / Number(precision);
  return Math.max(0, Math.min(100, pct)).toFixed(2);
}

// ── Confetti ───────────────────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#fbbf24', '#10b981', '#6366f1', '#f59e0b', '#34d399', '#a78bfa'];
  const pieces = Array.from({ length: 180 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 4 + 2,
    r: Math.random() * 7 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    rSpeed: (Math.random() - 0.5) * 0.2,
  }));

  let frame = 0;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.rot += p.rSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / 180);
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
      ctx.restore();
    });
    frame++;
    if (frame < 200) requestAnimationFrame(animate);
    else canvas.remove();
  };
  requestAnimationFrame(animate);
}

// ── Prize Pot ──────────────────────────────────────────────────────────────
const PrizePot: React.FC<{ balanceLamports: number | null }> = ({ balanceLamports }) => {
  const sol = balanceLamports != null ? parseFloat(formatSol(balanceLamports)) : null;
  return (
    <div className="prize-pot-wrapper">
      <div className="prize-pot-glow" />
      <div className="prize-pot-card">
        <p className="prize-label">PRIZE POT</p>
        <div className="prize-amount">
          <span className={`prize-number ${sol == null ? 'prize-loading' : ''}`}>
            {sol !== null ? sol.toFixed(3) : '—.———'}
          </span>
          <span className="prize-sol">SOL</span>
        </div>
        <p className="prize-usd-note">Verifiable on-chain prize pool</p>
      </div>
    </div>
  );
};

// ── Main Number Display ────────────────────────────────────────────────────
const MainNumberDisplay: React.FC<{ lotteryState: LotteryStateResponse | null }> = ({ lotteryState }) => {
  const isActive = lotteryState?.isActive ?? false;
  const mainNumber = lotteryState?.mainNumber ?? null;

  return (
    <div className="main-number-section">
      <div className="main-number-header">
        <span className="main-number-label">NUMBER TO BEAT</span>
        <span className={`status-badge ${isActive ? 'status-active' : 'status-closed'}`}>
          {isActive ? 'ACTIVE' : 'CLOSED'}
        </span>
      </div>
      <div className="main-number-display">
        {mainNumber !== null && isActive ? (
          <span className="main-number-value">{formatNumber(mainNumber)}</span>
        ) : (
          <span className="main-number-pending">
            {lotteryState ? 'Waiting for VRF...' : 'No active round'}
          </span>
        )}
      </div>
      {mainNumber !== null && isActive && (
        <div className="win-chance-bar-wrapper">
          <div className="win-chance-label">
            <Zap size={13} />
            <span>{winPercent(mainNumber)}% of numbers beat this</span>
          </div>
          <div className="win-chance-bar-bg">
            <div className="win-chance-bar-fill" style={{ width: `${winPercent(mainNumber)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Buy Ticket Button ──────────────────────────────────────────────────────
const BuyTicketButton: React.FC<{
  lotteryState: LotteryStateResponse | null;
  userAddress: string | undefined;
  onBuy: () => Promise<void>;
  buying: boolean;
}> = ({ lotteryState, userAddress, onBuy, buying }) => {
  const isActive = lotteryState?.isActive ?? false;
  const canBuy = isActive && !!userAddress && !buying;

  return (
    <div className="buy-ticket-section">
      <button
        className={`buy-ticket-btn ${canBuy ? 'buy-ticket-btn--active' : 'buy-ticket-btn--disabled'}`}
        onClick={canBuy ? onBuy : undefined}
        disabled={!canBuy}
      >
        {buying ? (
          <><RefreshCw size={18} className="spin-icon" /><span>Submitting...</span></>
        ) : (
          <><Ticket size={18} /><span>Buy Ticket — 0.01 SOL</span></>
        )}
      </button>
      {!userAddress && <p className="buy-ticket-hint">Connect your wallet to buy tickets</p>}
      {userAddress && !isActive && (
        <p className="buy-ticket-hint">Lottery is not active — wait for a new round</p>
      )}
      {userAddress && isActive && (
        <p className="buy-ticket-hint buy-ticket-cost-note">
          Each ticket costs 0.01 test SOL &mdash; playing on Poofnet
        </p>
      )}
    </div>
  );
};

// ── Ticket Row ─────────────────────────────────────────────────────────────
const TicketRow: React.FC<{
  ticket: LotteryStateTicketsResponse;
  isOwn: boolean;
  isPending: boolean;
}> = ({ ticket, isOwn, isPending }) => {
  const won = ticket.won;
  const lost = won === false;

  return (
    <div
      className={`ticket-row ${won ? 'ticket-row--won' : lost ? 'ticket-row--lost' : 'ticket-row--pending'} ${isOwn ? 'ticket-row--own' : ''}`}
    >
      <div className="ticket-row-left">
        {won ? (
          <Trophy size={13} className="ticket-icon ticket-icon--won" />
        ) : lost ? (
          <Star size={13} className="ticket-icon ticket-icon--lost" />
        ) : (
          <Clock size={13} className="ticket-icon ticket-icon--pending spin-icon-slow" />
        )}
        <span className="ticket-buyer">{truncateAddress(ticket.buyer)}</span>
        {isOwn && <span className="ticket-you-badge">YOU</span>}
      </div>
      <div className="ticket-row-right">
        {isPending || ticket.winNumber == null ? (
          <span className="ticket-vrf-pending">VRF pending…</span>
        ) : (
          <span className="ticket-number">{formatNumber(ticket.winNumber)}</span>
        )}
        <span className={`ticket-result ticket-result--${won ? 'won' : lost ? 'lost' : 'pending'}`}>
          {won ? 'WON' : lost ? 'LOST' : '—'}
        </span>
      </div>
    </div>
  );
};

// ── Start Round Panel ─────────────────────────────────────────────────────
const StartRoundPanel: React.FC<{
  lotteryState: LotteryStateResponse | null;
  onStart: () => Promise<void>;
  starting: boolean;
}> = ({ lotteryState, onStart, starting }) => {
  if (lotteryState?.isActive) return null;
  return (
    <div className="admin-panel">
      <Zap size={14} className="admin-crown" />
      <button
        className={`admin-start-btn ${starting ? 'admin-start-btn--disabled' : ''}`}
        onClick={starting ? undefined : onStart}
        disabled={starting}
      >
        {starting ? (
          <><RefreshCw size={13} className="spin-icon" />Starting...</>
        ) : (
          <><ChevronRight size={13} />Start New Round</>
        )}
      </button>
    </div>
  );
};

// ── Winner Banner ──────────────────────────────────────────────────────────
const WinnerBanner: React.FC<{ lotteryState: LotteryStateResponse | null }> = ({ lotteryState }) => {
  if (!lotteryState?.lastWinner) return null;
  return (
    <div className="winner-banner">
      <Trophy size={18} className="winner-trophy" />
      <div className="winner-info">
        <span className="winner-label">LAST WINNER</span>
        <span className="winner-address">{truncateAddress(lotteryState.lastWinner)}</span>
      </div>
      <div className="winner-divider" />
      <div className="winner-number-wrap">
        <span className="winner-number-label">Winning Number</span>
        <span className="winner-number">{formatNumber(lotteryState.lastWinNumber ?? 0)}</span>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const { user } = useAuth();
  const userAddress = user?.address;


  const [potBalance, setPotBalance] = useState<number | null>(null);
  const [buying, setBuying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [pendingTicketIds, setPendingTicketIds] = useState<Set<string>>(new Set());
  const prevWonRef = useRef<Set<string>>(new Set());

  // ── Subscribe to all rounds so we can find the current one dynamically ──
  const { data: allRounds } = useRealtimeData<LotteryStateResponse[]>(
    subscribeManyLotteryState,
    true
  );

  const currentRound = resolveCurrentRound(allRounds ?? null);
  const currentRoundId = currentRound?.id ?? null;

  // ── Subscribe to specific round state (only when we have an ID) ─────────
  const { data: lotteryState } = useRealtimeData<LotteryStateResponse | null>(
    subscribeLotteryState,
    !!currentRoundId,
    currentRoundId ?? ''
  );

  // ── Subscribe to tickets for the current round ───────────────────────────
  const { data: tickets } = useRealtimeData<LotteryStateTicketsResponse[]>(
    subscribeManyLotteryStateTickets,
    !!currentRoundId,
    currentRoundId ?? ''
  );

  // ── Real-time subscriptions ──────────────────────────────────────────────
  const { data: lotteryPot } = useRealtimeData<LotteryPotResponse | null>(
    subscribeLotteryPot,
    true,
    POT_ID
  );

  // Poll pot balance on an interval and whenever tickets change
  useEffect(() => {
    let cancelled = false;
    const fetchBalance = () => {
      runGetPotBalanceQueryForLotteryPot(POT_ID)
        .then((b) => { if (!cancelled) setPotBalance(b); })
        .catch(() => {});
    };

    fetchBalance(); // Fetch immediately
    const interval = setInterval(fetchBalance, 5000); // Poll every 5s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tickets]); // Re-fetch when tickets change (new ticket = SOL added to pot)

  // Detect winning ticket — fire confetti
  useEffect(() => {
    const safeTickets = tickets ?? [];
    safeTickets.forEach((t) => {
      if (t.won && !prevWonRef.current.has(t.id)) {
        if (t.buyer === userAddress) {
          launchConfetti();
          toast.success('YOU WON! 99% of the prize pot is yours!', { duration: 8000 });
        }
        prevWonRef.current.add(t.id);
      }
    });
  }, [tickets, userAddress]);

  // Clear pending state once ticket resolves
  useEffect(() => {
    const safeTickets = tickets ?? [];
    safeTickets.forEach((t) => {
      if (t.won !== undefined && t.won !== null) {
        setPendingTicketIds((prev) => {
          const next = new Set(prev);
          next.delete(t.id);
          return next;
        });
      }
    });
  }, [tickets]);

  const handleBuyTicket = useCallback(async () => {
    if (!userAddress || !lotteryState?.isActive || !currentRoundId) return;
    setBuying(true);
    try {
      const ticketId = crypto.randomUUID();
      await buyTicketWithError(currentRoundId, ticketId, {
        buyer: Address.publicKey(userAddress),
        lotteryId: currentRoundId,
      });
      setPendingTicketIds((prev) => new Set(prev).add(ticketId));
      toast.success('Ticket purchased! Waiting for VRF reveal...');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isInsufficientFundsError(msg)) {
        toast.error('Not enough test SOL. Use the faucet to get free test SOL!', { duration: 6000 });
      } else {
        toast.error(msg || 'Transaction failed. Check your wallet and try again.');
      }
    } finally {
      setBuying(false);
    }
  }, [userAddress, lotteryState, currentRoundId]);

  const handleStartRound = useCallback(async () => {
    setStarting(true);
    try {
      // Generate a new unique round ID using timestamp — avoids updating existing docs
      const newRoundId = `round-${Date.now()}`;
      const success = await setLotteryState(newRoundId, {
        isActive: false,
        mainNumber: 0,
        totalTickets: 0,
      });
      if (success) {
        toast.success('Round created — waiting for VRF to set main number...');
      } else {
        toast.error('Failed to start round.');
      }
    } catch {
      toast.error('Error starting round.');
    } finally {
      setStarting(false);
    }
  }, []);

  const safeTickets = tickets ?? [];
  const myTickets = safeTickets.filter((t) => t.buyer === userAddress);
  const recentTickets = [...safeTickets]
    .sort((a, b) => (b.tarobase_created_at ?? 0) - (a.tarobase_created_at ?? 0))
    .slice(0, 20);

  return (
    <>
      <style>{LOTTERY_CSS}</style>
      <div className="lottery-root">
        {/* Background layers */}
        <div className="lottery-bg">
          <div className="lottery-bg-grid" />
          <div className="lottery-bg-radial" />
        </div>

        {/* Header */}
        <header className="lottery-header">
          <div className="lottery-header-inner">
            <div className="lottery-logo">
              <Zap size={20} className="lottery-logo-icon" />
              <span className="lottery-logo-text">VRF LOTTERY</span>
            </div>
            <div className="lottery-header-right">
              {userAddress && (
                <StartRoundPanel
                  lotteryState={lotteryState}
                  onStart={handleStartRound}
                  starting={starting}
                />
              )}
              <WalletButton />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="lottery-main">
          <div className="lottery-container">
            {/* Hero */}
            <div className="lottery-hero">
              <h1 className="lottery-title">Beat the Number.<br />Win the Pot.</h1>
              <p className="lottery-subtitle">
                Verifiable on-chain randomness. No house edge. Pure provable fairness.
              </p>
            </div>

            {/* Round info bar */}
            <div className="round-info-bar">
              <div className="round-info-item">
                <span className="round-info-key">Round</span>
                <span className="round-info-val">{currentRoundId ?? '—'}</span>
              </div>
              <span className="round-info-divider" />
              <div className="round-info-item">
                <span className="round-info-key">Tickets Sold</span>
                <span className="round-info-val">{lotteryState?.totalTickets ?? 0}</span>
              </div>
              <span className="round-info-divider" />
              <div className="round-info-item">
                <span className="round-info-key">Max Range</span>
                <span className="round-info-val">{MAX_NUM_DISPLAY}</span>
              </div>
            </div>

            {/* Winner banner */}
            <WinnerBanner lotteryState={lotteryState} />

            {/* Core grid */}
            <div className="lottery-core-grid">
              {/* Left panel */}
              <div className="lottery-left-panel">
                <PrizePot balanceLamports={potBalance} />
                <MainNumberDisplay lotteryState={lotteryState} />
                <BuyTicketButton
                  lotteryState={lotteryState}
                  userAddress={userAddress}
                  onBuy={handleBuyTicket}
                  buying={buying}
                />
              </div>

              {/* Right panel */}
              <div className="lottery-right-panel">
                {userAddress && (
                  <div className="ticket-feed-card">
                    <div className="ticket-feed-header">
                      <Ticket size={13} />
                      <span>Your Tickets</span>
                      <span className="ticket-feed-count">{myTickets.length}</span>
                    </div>
                    <div className="ticket-feed-list">
                      {myTickets.length === 0 ? (
                        <div className="ticket-feed-empty">No tickets yet this round.</div>
                      ) : (
                        [...myTickets]
                          .sort((a, b) => (b.tarobase_created_at ?? 0) - (a.tarobase_created_at ?? 0))
                          .map((t) => (
                            <TicketRow
                              key={t.id}
                              ticket={t}
                              isOwn={true}
                              isPending={pendingTicketIds.has(t.id) || t.won == null}
                            />
                          ))
                      )}
                    </div>
                  </div>
                )}

                <div className="ticket-feed-card">
                  <div className="ticket-feed-header">
                    <Star size={13} />
                    <span>Recent Tickets</span>
                    <span className="ticket-feed-count">{safeTickets.length}</span>
                  </div>
                  <div className="ticket-feed-list">
                    {recentTickets.length === 0 ? (
                      <div className="ticket-feed-empty">No tickets this round yet.</div>
                    ) : (
                      recentTickets.map((t) => (
                        <TicketRow
                          key={t.id}
                          ticket={t}
                          isOwn={t.buyer === userAddress}
                          isPending={pendingTicketIds.has(t.id) || t.won == null}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="how-it-works">
              <h2 className="how-title">How It Works</h2>
              <div className="how-steps">
                {[
                  { n: '01', title: 'Admin starts a round', desc: 'VRF generates a random "main number" between 0 and 9 quadrillion.' },
                  { n: '02', title: 'Buy a ticket for 0.01 SOL', desc: 'Each ticket generates its own VRF random number across the full u64 range on-chain.' },
                  { n: '03', title: 'Beat the number', desc: 'If your number is HIGHER than the main number, you win 99% of the prize pot.' },
                  { n: '04', title: 'Pot grows until someone wins', desc: 'Every losing ticket adds to the prize pool. 1% stays in the pot to seed the next round.' },
                ].map((step) => (
                  <div key={step.n} className="how-step">
                    <span className="how-step-number">{step.n}</span>
                    <div>
                      <p className="how-step-title">{step.title}</p>
                      <p className="how-step-desc">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const LOTTERY_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

  .lottery-root {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    font-family: 'Outfit', sans-serif;
    color: #f5e6b8;
    background: #070b12;
  }

  .lottery-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
  .lottery-bg-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(251,191,36,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(251,191,36,0.035) 1px, transparent 1px);
    background-size: 52px 52px;
  }
  .lottery-bg-radial {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 90% 55% at 50% -5%, rgba(251,191,36,0.13) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 85% 85%, rgba(16,185,129,0.07) 0%, transparent 50%),
      radial-gradient(ellipse 55% 60% at 15% 100%, rgba(99,102,241,0.06) 0%, transparent 50%);
  }

  .lottery-header {
    position: relative;
    z-index: 10;
    border-bottom: 1px solid rgba(251,191,36,0.11);
    background: rgba(7,11,18,0.88);
    backdrop-filter: blur(14px);
  }
  .lottery-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 14px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .lottery-logo {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .lottery-logo-icon {
    color: #fbbf24;
    filter: drop-shadow(0 0 8px rgba(251,191,36,0.75));
  }
  .lottery-logo-text {
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.22rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #fbbf24;
    text-shadow: 0 0 18px rgba(251,191,36,0.45);
  }
  .lottery-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .lottery-main {
    position: relative;
    z-index: 1;
    padding: 48px 0 100px;
  }
  .lottery-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 28px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .lottery-hero {
    text-align: center;
    padding: 16px 0 4px;
  }
  .lottery-title {
    font-family: 'Rajdhani', sans-serif;
    font-size: clamp(2.6rem, 6vw, 4.6rem);
    font-weight: 700;
    line-height: 1.04;
    letter-spacing: -0.01em;
    background: linear-gradient(140deg, #fbbf24 0%, #f59e0b 45%, #34d399 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 14px;
  }
  .lottery-subtitle {
    font-size: 1.05rem;
    color: rgba(245,230,184,0.45);
    font-weight: 400;
    letter-spacing: 0.02em;
  }

  .round-info-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    background: rgba(251,191,36,0.04);
    border: 1px solid rgba(251,191,36,0.13);
    border-radius: 12px;
    padding: 12px 0;
    flex-wrap: wrap;
  }
  .round-info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 0 32px;
  }
  .round-info-key {
    font-size: 0.67rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(245,230,184,0.35);
    font-weight: 600;
  }
  .round-info-val {
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: #fbbf24;
    letter-spacing: 0.04em;
  }
  .round-info-divider {
    width: 1px;
    height: 34px;
    background: rgba(251,191,36,0.13);
    flex-shrink: 0;
  }

  .winner-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(16,185,129,0.07) 100%);
    border: 1px solid rgba(251,191,36,0.32);
    border-radius: 13px;
    padding: 16px 22px;
    animation: glow-pulse 3s ease-in-out infinite alternate;
  }
  @keyframes glow-pulse {
    0% { box-shadow: 0 0 10px rgba(251,191,36,0.12); }
    100% { box-shadow: 0 0 28px rgba(251,191,36,0.32), 0 0 56px rgba(16,185,129,0.09); }
  }
  .winner-trophy { color: #fbbf24; filter: drop-shadow(0 0 7px rgba(251,191,36,0.75)); flex-shrink: 0; }
  .winner-info { display: flex; flex-direction: column; gap: 2px; }
  .winner-label { font-size: 0.63rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(245,230,184,0.4); font-weight: 600; }
  .winner-address { font-family: 'Rajdhani', sans-serif; font-size: 1.1rem; font-weight: 700; color: #fbbf24; }
  .winner-divider { width: 1px; height: 36px; background: rgba(251,191,36,0.18); margin: 0 6px; }
  .winner-number-wrap { display: flex; flex-direction: column; gap: 2px; }
  .winner-number-label { font-size: 0.63rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(245,230,184,0.4); font-weight: 600; }
  .winner-number { font-family: 'Rajdhani', sans-serif; font-size: 1.1rem; font-weight: 700; color: #34d399; }

  .lottery-core-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 22px;
    align-items: start;
  }
  @media (max-width: 800px) {
    .lottery-core-grid { grid-template-columns: 1fr; }
  }

  .lottery-left-panel { display: flex; flex-direction: column; gap: 14px; }
  .lottery-right-panel { display: flex; flex-direction: column; gap: 14px; }

  /* Prize Pot */
  .prize-pot-wrapper { position: relative; }
  .prize-pot-glow {
    position: absolute;
    inset: -24px;
    background: radial-gradient(ellipse 65% 65% at 50% 50%, rgba(251,191,36,0.16) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
    animation: pot-glow-pulse 2.8s ease-in-out infinite alternate;
  }
  @keyframes pot-glow-pulse {
    0% { opacity: 0.55; transform: scale(0.93); }
    100% { opacity: 1; transform: scale(1.06); }
  }
  .prize-pot-card {
    position: relative;
    z-index: 1;
    background: linear-gradient(135deg, rgba(251,191,36,0.09) 0%, rgba(245,158,11,0.04) 100%);
    border: 1.5px solid rgba(251,191,36,0.38);
    border-radius: 18px;
    padding: 34px 28px;
    text-align: center;
    backdrop-filter: blur(10px);
  }
  .prize-label {
    font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(245,230,184,0.45); font-weight: 600; margin-bottom: 14px;
    display: block;
  }
  .prize-amount {
    display: flex; align-items: baseline; justify-content: center;
    gap: 10px; margin-bottom: 10px;
  }
  .prize-number {
    font-family: 'Rajdhani', sans-serif;
    font-size: clamp(2.8rem, 5vw, 4.2rem);
    font-weight: 700;
    color: #fbbf24;
    text-shadow: 0 0 28px rgba(251,191,36,0.55), 0 0 56px rgba(251,191,36,0.28);
    letter-spacing: -0.02em;
    animation: number-shimmer 3.2s ease-in-out infinite alternate;
  }
  @keyframes number-shimmer {
    0% { text-shadow: 0 0 18px rgba(251,191,36,0.45), 0 0 36px rgba(251,191,36,0.2); }
    100% { text-shadow: 0 0 38px rgba(251,191,36,0.88), 0 0 76px rgba(251,191,36,0.48); }
  }
  .prize-loading { opacity: 0.28; }
  .prize-sol {
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.75rem; font-weight: 600;
    color: rgba(251,191,36,0.65); letter-spacing: 0.1em;
  }
  .prize-usd-note { font-size: 0.7rem; color: rgba(245,230,184,0.28); letter-spacing: 0.05em; }

  /* Main Number */
  .main-number-section {
    background: rgba(7,11,18,0.75);
    border: 1px solid rgba(251,191,36,0.13);
    border-radius: 14px;
    padding: 20px 22px;
    backdrop-filter: blur(8px);
  }
  .main-number-header {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
  }
  .main-number-label {
    font-size: 0.66rem; letter-spacing: 0.15em; text-transform: uppercase;
    color: rgba(245,230,184,0.42); font-weight: 600;
  }
  .status-badge {
    font-size: 0.62rem; font-weight: 700; letter-spacing: 0.11em;
    padding: 3px 10px; border-radius: 4px; text-transform: uppercase;
  }
  .status-active {
    background: rgba(16,185,129,0.14); color: #34d399;
    border: 1px solid rgba(16,185,129,0.38);
  }
  .status-closed {
    background: rgba(239,68,68,0.11); color: #f87171;
    border: 1px solid rgba(239,68,68,0.28);
  }
  .main-number-display { margin-bottom: 14px; }
  .main-number-value {
    font-family: 'Rajdhani', sans-serif;
    font-size: clamp(1.9rem, 3.5vw, 2.7rem);
    font-weight: 700; color: #f5e6b8; letter-spacing: 0.04em;
  }
  .main-number-pending {
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.35rem; color: rgba(245,230,184,0.3); font-style: italic;
  }
  .win-chance-bar-wrapper { display: flex; flex-direction: column; gap: 6px; }
  .win-chance-label {
    display: flex; align-items: center; gap: 5px;
    font-size: 0.7rem; color: rgba(245,230,184,0.42);
  }
  .win-chance-label svg { color: #fbbf24; }
  .win-chance-bar-bg {
    height: 4px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;
  }
  .win-chance-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #fbbf24, #34d399);
    border-radius: 4px; transition: width 1.2s ease;
  }

  /* Buy ticket */
  .buy-ticket-section { display: flex; flex-direction: column; gap: 8px; }
  .buy-ticket-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 17px 24px; border-radius: 12px;
    font-family: 'Rajdhani', sans-serif; font-size: 1.18rem; font-weight: 700;
    letter-spacing: 0.07em; text-transform: uppercase;
    transition: all 0.2s ease; border: none; cursor: pointer;
  }
  .buy-ticket-btn--active {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #070b12;
    box-shadow: 0 0 28px rgba(251,191,36,0.38), 0 4px 18px rgba(0,0,0,0.38);
  }
  .buy-ticket-btn--active:hover {
    background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%);
    box-shadow: 0 0 48px rgba(251,191,36,0.58), 0 4px 22px rgba(0,0,0,0.48);
    transform: translateY(-2px);
  }
  .buy-ticket-btn--active:active { transform: translateY(0); }
  .buy-ticket-btn--disabled {
    background: rgba(255,255,255,0.055); color: rgba(245,230,184,0.28);
    cursor: not-allowed; box-shadow: none;
    border: 1px solid rgba(255,255,255,0.07);
  }
  .buy-ticket-hint {
    text-align: center; font-size: 0.73rem; color: rgba(245,230,184,0.32); letter-spacing: 0.03em;
  }
  .buy-ticket-cost-note {
    color: rgba(251,191,36,0.45);
    font-size: 0.71rem;
  }

  /* Ticket feeds */
  .ticket-feed-card {
    background: rgba(7,11,18,0.82);
    border: 1px solid rgba(251,191,36,0.11);
    border-radius: 14px; overflow: hidden; backdrop-filter: blur(8px);
  }
  .ticket-feed-header {
    display: flex; align-items: center; gap: 7px;
    padding: 13px 17px;
    border-bottom: 1px solid rgba(251,191,36,0.09);
    font-size: 0.77rem; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; color: rgba(245,230,184,0.48);
  }
  .ticket-feed-header svg { color: #fbbf24; flex-shrink: 0; }
  .ticket-feed-count {
    margin-left: auto;
    background: rgba(251,191,36,0.1); color: #fbbf24;
    font-size: 0.68rem; font-weight: 700;
    padding: 2px 8px; border-radius: 20px;
    border: 1px solid rgba(251,191,36,0.2);
  }
  .ticket-feed-list {
    max-height: 268px; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: rgba(251,191,36,0.18) transparent;
  }
  .ticket-feed-empty {
    padding: 24px; text-align: center;
    font-size: 0.8rem; color: rgba(245,230,184,0.22); letter-spacing: 0.03em;
  }

  /* Ticket rows */
  .ticket-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 17px;
    border-bottom: 1px solid rgba(255,255,255,0.035);
    transition: background 0.14s; gap: 8px;
  }
  .ticket-row:last-child { border-bottom: none; }
  .ticket-row:hover { background: rgba(255,255,255,0.018); }
  .ticket-row--won { background: rgba(16,185,129,0.065); border-left: 3px solid #34d399; padding-left: 14px; }
  .ticket-row--won:hover { background: rgba(16,185,129,0.095); }
  .ticket-row--lost { border-left: 3px solid transparent; padding-left: 14px; }
  .ticket-row--pending { border-left: 3px solid transparent; padding-left: 14px; }
  .ticket-row--own { background: rgba(251,191,36,0.03); }
  .ticket-row-left { display: flex; align-items: center; gap: 7px; min-width: 0; }
  .ticket-icon { flex-shrink: 0; }
  .ticket-icon--won { color: #34d399; filter: drop-shadow(0 0 4px rgba(52,211,153,0.55)); }
  .ticket-icon--lost { color: rgba(245,230,184,0.18); }
  .ticket-icon--pending { color: rgba(245,230,184,0.35); }
  .ticket-buyer {
    font-family: 'Rajdhani', sans-serif; font-size: 0.86rem; font-weight: 600;
    color: rgba(245,230,184,0.65); letter-spacing: 0.04em;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ticket-you-badge {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em;
    background: rgba(251,191,36,0.13); color: #fbbf24;
    padding: 1px 6px; border-radius: 3px; border: 1px solid rgba(251,191,36,0.28);
    flex-shrink: 0;
  }
  .ticket-row-right { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
  .ticket-number {
    font-family: 'Rajdhani', sans-serif; font-size: 0.86rem;
    font-weight: 600; color: rgba(245,230,184,0.55);
  }
  .ticket-vrf-pending { font-size: 0.7rem; color: rgba(245,230,184,0.22); font-style: italic; }
  .ticket-result {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em;
    padding: 2px 7px; border-radius: 3px; min-width: 34px; text-align: center;
  }
  .ticket-result--won { background: rgba(16,185,129,0.13); color: #34d399; border: 1px solid rgba(16,185,129,0.36); }
  .ticket-result--lost { background: rgba(239,68,68,0.07); color: rgba(248,113,113,0.65); border: 1px solid rgba(239,68,68,0.18); }
  .ticket-result--pending { background: rgba(255,255,255,0.04); color: rgba(245,230,184,0.28); border: 1px solid rgba(255,255,255,0.07); }

  /* Admin */
  .admin-panel {
    display: flex; align-items: center; gap: 9px;
    background: rgba(251,191,36,0.06);
    border: 1px solid rgba(251,191,36,0.18);
    border-radius: 9px; padding: 7px 13px;
  }
  .admin-crown { color: #fbbf24; flex-shrink: 0; }
  .admin-label {
    font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: rgba(251,191,36,0.55); white-space: nowrap;
  }
  .admin-start-btn {
    display: flex; align-items: center; gap: 4px;
    background: rgba(251,191,36,0.13); color: #fbbf24;
    border: 1px solid rgba(251,191,36,0.32);
    border-radius: 6px; padding: 5px 11px;
    font-size: 0.76rem; font-weight: 600; letter-spacing: 0.04em;
    cursor: pointer; transition: all 0.18s; font-family: inherit; white-space: nowrap;
  }
  .admin-start-btn:hover:not(.admin-start-btn--disabled) {
    background: rgba(251,191,36,0.22); border-color: rgba(251,191,36,0.48);
  }
  .admin-start-btn--disabled { opacity: 0.48; cursor: not-allowed; }

  /* How it works */
  .how-it-works { padding: 20px 0 0; }
  .how-title {
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.3rem; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: rgba(245,230,184,0.5);
    margin-bottom: 18px; text-align: center;
  }
  .how-steps {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px;
  }
  .how-step {
    display: flex; gap: 13px;
    background: rgba(7,11,18,0.65); border: 1px solid rgba(251,191,36,0.08);
    border-radius: 12px; padding: 18px;
  }
  .how-step-number {
    font-family: 'Rajdhani', sans-serif; font-size: 1.75rem; font-weight: 700;
    color: rgba(251,191,36,0.18); line-height: 1; flex-shrink: 0;
  }
  .how-step-title { font-weight: 600; font-size: 0.88rem; color: #f5e6b8; margin-bottom: 5px; }
  .how-step-desc { font-size: 0.78rem; color: rgba(245,230,184,0.38); line-height: 1.55; }

  /* Animations */
  .spin-icon { animation: spin 0.9s linear infinite; }
  .spin-icon-slow { animation: spin 2.6s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default HomePage;
