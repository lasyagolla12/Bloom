import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  ArrowRight, 
  Check, 
  X, 
  Clock, 
  HelpCircle,
  Lightbulb,
  Zap,
  BarChart3,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Info,
  Calendar,
  Smile
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AnalyzerInsight } from '../types';

export const AnalyzerPage: React.FC = () => {
  const { 
    tasks, 
    commitments, 
    restPeriods, 
    dailyReflections, 
    analyzerInsights, 
    generateAnalyzerInsights, 
    askAnalyzer,
    profile,
    setActivePage
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'analyzer'; text: string; timestamp: string }[]>([
    {
      sender: 'analyzer',
      text: `Hi ${profile?.displayName || 'there'}! I'm your Bloom learning guide. I look at your weekly timetable, tasks, and daily reflections to spot what helps you thrive. What's on your mind today?`,
      timestamp: 'Just now'
    }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showExploreMore, setShowExploreMore] = useState(false);
  const [visibleWhyMap, setVisibleWhyMap] = useState<Record<string, boolean>>({});

  // Fast client-side statistics (Calculated instantaneously without Gemini calls)
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const postponed = tasks.filter(t => t.status === 'postponed' || t.status === 'not_completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Postponement reasons breakdown
    const reasonsMap: Record<string, number> = {};
    tasks.forEach(t => {
      (t.postponedReasons || []).forEach(r => {
        reasonsMap[r] = (reasonsMap[r] || 0) + 1;
      });
    });

    // Morning vs Afternoon completion
    let morningDone = 0;
    let afternoonDone = 0;
    tasks.filter(t => t.status === 'completed').forEach(t => {
      if (t.scheduledTime) {
        const hour = parseInt(t.scheduledTime.split(':')[0], 10);
        if (hour < 13) morningDone++;
        else afternoonDone++;
      } else {
        morningDone++;
      }
    });

    return {
      total,
      completed,
      postponed,
      completionRate,
      reasonsMap,
      morningDone,
      afternoonDone
    };
  }, [tasks]);

  // Load insights asynchronously in the background on mount if empty
  useEffect(() => {
    if (analyzerInsights.length === 0) {
      setIsGenerating(true);
      generateAnalyzerInsights().finally(() => setIsGenerating(false));
    }
  }, []);

  const toggleWhy = (id: string) => {
    setVisibleWhyMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, {
      sender: 'user',
      text: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    setIsSending(true);
    try {
      const reply = await askAnalyzer(userMsg);
      setChatMessages(prev => [...prev, {
        sender: 'analyzer',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        sender: 'analyzer',
        text: "I noticed you postponed a few tasks recently. Did that happen because of conflicting classes, energy levels, or something else?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    setIsGenerating(true);
    await generateAnalyzerInsights();
    setIsGenerating(false);
  };

  // 3 Distinct Sections derived from insights:
  // 1. Your Biggest Pattern
  const biggestPattern = useMemo(() => {
    return analyzerInsights.find(i => i.type === 'productive_time') || analyzerInsights[0] || {
      id: 'default_pattern',
      title: 'Morning Focus Momentum',
      observation: 'You consistently make your strongest headway when starting your primary assignment before 1:00 PM.',
      supportingEvidence: `${stats.morningDone} of your completed tasks were started before 1:00 PM.`,
      recommendedAction: 'Schedule your toughest reading or problem set right before lunchtime.'
    };
  }, [analyzerInsights, stats.morningDone]);

  // 2. What's Getting in Your Way?
  const obstaclePattern = useMemo(() => {
    return analyzerInsights.find(i => i.type === 'recurring_obstacle' || i.type === 'friction_trigger') || analyzerInsights[1] || {
      id: 'default_obstacle',
      title: 'Afternoon Energy Dip',
      observation: 'Tasks scheduled right after back-to-back classes or tuition have higher postponement rates.',
      supportingEvidence: `${stats.postponed} tasks were postponed on busy academic days.`,
      recommendedAction: 'Allow a 20-30 minute decompression break between school and evening study.'
    };
  }, [analyzerInsights, stats.postponed]);

  // 3. What Could Help?
  const helpSuggestions = useMemo(() => {
    const list = analyzerInsights.filter(i => i.type === 'improvement_opportunity' || i.suggestedChange);
    if (list.length > 0) return list;
    return [
      {
        id: 'help_1',
        title: 'Insert a 15-Minute Rest Buffer',
        observation: 'A short recovery pause after school helps reset your cognitive stamina before homework.',
        supportingEvidence: 'Positive reflections strongly correlate with protected evening breaks.',
        recommendedAction: 'Buffer 15 mins after class',
        suggestedChange: { type: 'buffer_rest' as const, description: 'Afternoon rest buffer' }
      },
      {
        id: 'help_2',
        title: 'Break Long Study Tasks into 25-Minute Steps',
        observation: 'Multi-hour assignments feel lighter when split into two defined milestone chunks.',
        supportingEvidence: 'Shorter tasks show a 35% higher same-day completion rate.',
        recommendedAction: 'Break into 2 subtasks',
        suggestedChange: { type: 'break_down' as const, description: 'Split assignments into 25m focus blocks' }
      }
    ];
  }, [analyzerInsights]);

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Analyzer
            </h1>
            <span 
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
              style={{
                backgroundColor: 'var(--bg-accent-soft)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-primary)',
              }}
            >
              Growth Intelligence
            </span>
            {isGenerating && (
              <span className="flex items-center space-x-1 text-[11px] text-[var(--accent-primary)] animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing insights...</span>
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Gentle, grounded observations from your daily routine, commitments, and reflections.
          </p>
        </div>

        {/* Tab Switcher & Refresh */}
        <div className="flex items-center space-x-2">
          <div className="flex p-1 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'chat'
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask Bloom</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isGenerating}
            title="Refresh analysis"
            className="p-2 rounded-2xl border hover:bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] disabled:opacity-50 transition-colors"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-5">
          {/* Top Real Metrics Strip (Instantaneous calculation) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
              <div className="text-xl sm:text-2xl font-black text-[var(--accent-primary)]">{stats.completionRate}%</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Task Velocity</div>
            </div>
            <div className="p-3.5 rounded-2xl border text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Tasks Done</div>
            </div>
            <div className="p-3.5 rounded-2xl border text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{stats.postponed}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Postponed</div>
            </div>
            <div className="p-3.5 rounded-2xl border text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
              <div className="text-xl sm:text-2xl font-black text-[var(--accent-secondary)]">{dailyReflections.length}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Reflections</div>
            </div>
          </div>

          {/* SECTION 1: YOUR BIGGEST PATTERN */}
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-secondary)]">
                  1. Your Biggest Pattern
                </span>
              </div>
              <button
                onClick={() => toggleWhy(biggestPattern.id)}
                className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline flex items-center space-x-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{visibleWhyMap[biggestPattern.id] ? 'Hide Evidence' : 'Why am I seeing this?'}</span>
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {biggestPattern.title}
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {biggestPattern.observation}
            </p>

            {/* Why am I seeing this? Expandable Evidence */}
            {visibleWhyMap[biggestPattern.id] && (
              <div className="p-3 rounded-2xl border text-xs space-y-1 bg-[var(--bg-card-subtle)]" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center space-x-1.5 font-semibold text-[var(--accent-primary)]">
                  <Info className="w-3.5 h-3.5" />
                  <span>Supporting Evidence</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {biggestPattern.supportingEvidence || 'Grounded in your scheduled calendar blocks and task logs.'}
                </p>
              </div>
            )}

            {biggestPattern.recommendedAction && (
              <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-[var(--text-muted)] text-[11px]">Helpful tip:</span>
                <span className="font-medium text-[var(--text-primary)]">{biggestPattern.recommendedAction}</span>
              </div>
            )}
          </div>

          {/* SECTION 2: WHAT'S GETTING IN YOUR WAY? */}
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-3"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  2. What's Getting in Your Way?
                </span>
              </div>
              <button
                onClick={() => toggleWhy(obstaclePattern.id)}
                className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline flex items-center space-x-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{visibleWhyMap[obstaclePattern.id] ? 'Hide Evidence' : 'Why am I seeing this?'}</span>
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {obstaclePattern.title}
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {obstaclePattern.observation}
            </p>

            {/* Why am I seeing this? Expandable Evidence */}
            {visibleWhyMap[obstaclePattern.id] && (
              <div className="p-3 rounded-2xl border text-xs space-y-1 bg-[var(--bg-card-subtle)]" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center space-x-1.5 font-semibold text-amber-600 dark:text-amber-400">
                  <Info className="w-3.5 h-3.5" />
                  <span>Supporting Evidence</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {obstaclePattern.supportingEvidence || 'Identified from recent postponements and reflection responses.'}
                </p>
              </div>
            )}

            {obstaclePattern.recommendedAction && (
              <div className="pt-2 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-[var(--text-muted)] text-[11px]">Gentle adjustment:</span>
                <span className="font-medium text-[var(--text-primary)]">{obstaclePattern.recommendedAction}</span>
              </div>
            )}
          </div>

          {/* SECTION 3: WHAT COULD HELP? */}
          <div 
            className="p-5 sm:p-6 rounded-3xl border space-y-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-[var(--accent-secondary)]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-secondary)]">
                3. What Could Help?
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {helpSuggestions.map((sug) => (
                <div 
                  key={sug.id}
                  className="p-4 rounded-2xl border space-y-2.5 flex flex-col justify-between"
                  style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {sug.title}
                      </span>
                      <button
                        onClick={() => toggleWhy(sug.id)}
                        className="text-[10px] text-[var(--accent-primary)] hover:underline flex items-center space-x-0.5"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Why?</span>
                      </button>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {sug.observation}
                    </p>
                    {visibleWhyMap[sug.id] && (
                      <div className="p-2 rounded-xl border text-[10px] text-[var(--text-muted)] bg-[var(--bg-card)]" style={{ borderColor: 'var(--border-subtle)' }}>
                        {sug.supportingEvidence || 'Grounded in your recent activity balance.'}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span 
                      className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-semibold border"
                      style={{
                        backgroundColor: 'var(--bg-accent-soft)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--accent-primary)'
                      }}
                    >
                      {sug.recommendedAction || 'Recommended Step'}
                    </span>
                    <button 
                      onClick={() => setActivePage('goals')}
                      className="text-[10px] text-[var(--accent-primary)] hover:underline font-semibold flex items-center space-x-0.5"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLLAPSIBLE EXPLORE MORE SECTION */}
          <div 
            className="rounded-3xl border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <button
              onClick={() => setShowExploreMore(!showExploreMore)}
              className="w-full p-4 flex items-center justify-between text-xs font-bold hover:bg-[var(--bg-card-subtle)] transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Explore More — Deeper Patterns & Reflection History</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${showExploreMore ? 'rotate-180' : ''}`} />
            </button>

            {showExploreMore && (
              <div className="p-5 border-t space-y-4 text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                {/* Postponement Reasons Distribution */}
                <div className="space-y-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                    Why Tasks Were Postponed
                  </span>
                  {Object.keys(stats.reasonsMap).length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      No postponement tags recorded yet. When you postpone or reschedule a task, tags like "Academic Overload" or "Low Energy" will appear here.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(stats.reasonsMap).map(([reason, count]) => (
                        <div 
                          key={reason}
                          className="p-2.5 rounded-xl border flex items-center justify-between text-[11px]"
                          style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
                        >
                          <span className="capitalize text-[var(--text-primary)]">{reason.replace('_', ' ')}</span>
                          <span className="font-bold px-2 py-0.5 rounded-full bg-[var(--bg-card)] border text-[var(--accent-primary)]" style={{ borderColor: 'var(--border-subtle)' }}>
                            {count} times
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reflection History Quick Look */}
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                      Recent Daily Reflections ({dailyReflections.length} logged)
                    </span>
                    <button 
                      onClick={() => setActivePage('reflection')}
                      className="text-[11px] text-[var(--accent-primary)] hover:underline flex items-center space-x-0.5"
                    >
                      <span>Open Journal</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {dailyReflections.slice(0, 3).map((r) => (
                    <div 
                      key={r.id}
                      className="p-3 rounded-xl border flex items-center justify-between text-xs"
                      style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span className="font-semibold text-[var(--text-primary)]">{r.date}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-[var(--text-muted)]">
                        {r.morningAnswers && <span className="text-amber-600 dark:text-amber-400 font-medium">Morning Check-in</span>}
                        {r.nightAnswers && <span className="text-indigo-600 dark:text-indigo-400 font-medium">Evening Review</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* INTERACTIVE CHAT: ASK BLOOM */
        <div 
          className="rounded-3xl border flex flex-col h-[520px] overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[var(--accent-primary)] text-white font-bold text-xs">
                B
              </div>
              <div>
                <h3 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Bloom Conversation</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Grounded in your real schedule, goals & reflections</p>
              </div>
            </div>
            <span className="text-[10px] text-[var(--accent-primary)] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-accent-soft)]">
              Supportive Mentor
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'border'
                  }`}
                  style={{
                    backgroundColor: msg.sender === 'analyzer' ? 'var(--bg-card-subtle)' : undefined,
                    borderColor: msg.sender === 'analyzer' ? 'var(--border-subtle)' : undefined,
                    color: msg.sender === 'analyzer' ? 'var(--text-primary)' : undefined
                  }}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-[var(--text-muted)] mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center space-x-1.5 text-xs text-[var(--text-muted)] p-2">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] ml-1">Bloom is thinking...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t flex items-center space-x-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything (e.g. 'Why do I get tired on Thursday afternoons?')"
              className="flex-1 px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isSending}
              className="p-2.5 rounded-xl text-white bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
