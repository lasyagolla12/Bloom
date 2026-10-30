import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Smile, 
  BatteryCharging, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const InsightsPage: React.FC = () => {
  const { commitments, restPeriods, goals } = useAuth();

  // Interactive Check-in state
  const [mood, setMood] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(4);
  const [checkedInToday, setCheckedInToday] = useState(false);

  const handleSaveCheckIn = () => {
    setCheckedInToday(true);
  };

  return (
    <div className="space-y-8 select-none">
      {/* Header & Stage 4 Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Insights &amp; Well-being Analytics
            </h1>
            <span 
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
              style={{
                backgroundColor: 'var(--bg-accent-soft)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-primary)'
              }}
            >
              Stage 1 Foundation
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Sustainable personal growth awareness aligned with UN SDG 3 Target 3.4.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[var(--accent-secondary)] font-semibold">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>Burnout Prevention Enabled</span>
        </div>
      </div>

      {/* Daily Mood & Energy Check-in Widget */}
      <div 
        className="rounded-3xl p-6 sm:p-8 border space-y-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center space-x-2">
            <Smile className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Today's Well-being Check-In
            </h2>
          </div>
          {checkedInToday ? (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Logged for Today</span>
            </span>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)]">Daily Pulse</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Mood Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text-secondary)]">Mood Level (1 to 5)</span>
              <span className="font-bold text-sm text-[var(--accent-primary)]">
                {mood === 1 ? 'Overwhelmed' : mood === 2 ? 'Tired' : mood === 3 ? 'Steady' : mood === 4 ? 'Good' : 'Flourishing'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={mood}
              disabled={checkedInToday}
              onChange={(e) => setMood(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--accent-primary)] cursor-pointer"
            />
          </div>

          {/* Energy Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text-secondary)]">Energy Level (1 to 5)</span>
              <span className="font-bold text-sm text-[var(--accent-primary)]">
                {energy === 1 ? 'Depleted' : energy === 2 ? 'Low' : energy === 3 ? 'Moderate' : energy === 4 ? 'Energized' : 'Peak'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={energy}
              disabled={checkedInToday}
              onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--accent-primary)] cursor-pointer"
            />
          </div>
        </div>

        {!checkedInToday && (
          <button
            onClick={handleSaveCheckIn}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-sm"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Record Check-In
          </button>
        )}
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Workload Pacing & Trends */}
        <div 
          className="p-5 rounded-3xl border space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Workload Pacing
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Balanced schedule monitoring. Identifies weeks where academic commitments surge.
          </p>
          <div className="p-3 rounded-2xl border text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
            Current recurring load: <strong>{commitments.length} anchors</strong> across 7 days.
          </div>
        </div>

        {/* Goal Completion Velocity */}
        <div 
          className="p-5 rounded-3xl border space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Goal Progress Velocity
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Tracking milestone completions against planned target dates without guilt-inducing streaks.
          </p>
          <div className="p-3 rounded-2xl border text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
            Active goals tracked: <strong>{goals.length}</strong>.
          </div>
        </div>

        {/* Friction Detector (Pillar 1 Feature) */}
        <div 
          className="p-5 rounded-3xl border space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Friction Detector
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Identifies repeatedly postponed study sessions or tasks colliding with rest periods.
          </p>
          <div className="p-3 rounded-2xl border text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
            Stage 4 Analytics Engine: Evaluates pattern bottlenecks and suggests realistic micro-adjustments.
          </div>
        </div>
      </div>
    </div>
  );
};
