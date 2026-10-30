import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  Send, 
  Sparkles, 
  Target, 
  Lightbulb, 
  Compass, 
  ShieldAlert, 
  CheckCircle2, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowRight, 
  RotateCcw,
  History,
  Check,
  X,
  Share2,
  Sliders,
  Move
} from 'lucide-react';
import { BloomOrb, BloomOrbState } from '../common/BloomOrb';
import { ThoughtBubble, ThoughtConnection, ThoughtMapSession } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AmbitionSimulatorModal } from './AmbitionSimulatorModal';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  ambition: { bg: 'rgba(124, 58, 237, 0.12)', text: '#7c3aed', border: 'rgba(124, 58, 237, 0.4)', label: 'Ambition' },
  goal: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.4)', label: 'Goal' },
  task: { bg: 'rgba(14, 165, 233, 0.12)', text: '#0284c7', border: 'rgba(14, 165, 233, 0.4)', label: 'Task' },
  concern: { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706', border: 'rgba(245, 158, 11, 0.4)', label: 'Concern' },
  idea: { bg: 'rgba(244, 63, 94, 0.12)', text: '#e11d48', border: 'rgba(244, 63, 94, 0.4)', label: 'Idea' },
  interest: { bg: 'rgba(20, 184, 166, 0.12)', text: '#0d9488', border: 'rgba(20, 184, 166, 0.4)', label: 'Interest' }
};

export const BlurtCanvas: React.FC = () => {
  const { 
    thoughtSessions, 
    saveThoughtSession, 
    deleteThoughtSession, 
    generateThoughtMap,
    addNewGoal,
    saveIdeaItem,
    addNewInterest,
    setActivePage
  } = useAuth();

  const [rawText, setRawText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isMapping, setIsMapping] = useState(false);
  const [orbState, setOrbState] = useState<BloomOrbState>('idle');

  // Thought Map state
  const [currentSessionId, setCurrentSessionId] = useState<string>('session_' + Date.now());
  const [nodes, setNodes] = useState<ThoughtBubble[]>([]);
  const [connections, setConnections] = useState<ThoughtConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<ThoughtBubble | null>(null);

  // Ambition simulator modal
  const [simulatorAmbition, setSimulatorAmbition] = useState<string | null>(null);
  
  // Transfer notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // History panel
  const [showHistory, setShowHistory] = useState(false);

  // Speech recognition ref
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript + ' ';
      }
      setRawText(currentTranscript.trim());
      setOrbState('listening');
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event?.error);
      setIsRecording(false);
      setOrbState('idle');
    };

    recognition.onend = () => {
      if (isRecording && !isPaused) {
        try {
          recognition.start();
        } catch {}
      } else {
        setIsRecording(false);
        setOrbState('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, []);

  // Update orb state when typing
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawText(e.target.value);
    if (!isRecording && !isMapping) {
      setOrbState('typing');
      const timer = setTimeout(() => setOrbState('idle'), 1500);
      return () => clearTimeout(timer);
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setOrbState('listening');
    } catch (err) {
      console.warn('Start recording error:', err);
    }
  };

  const pauseRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsPaused(true);
      setOrbState('idle');
    } catch {}
  };

  const resumeRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsPaused(false);
      setOrbState('listening');
    } catch {}
  };

  const finishRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setOrbState('idle');
    } catch {}
  };

  const handleGenerateThoughtMap = async () => {
    if (!rawText.trim()) return;
    setIsMapping(true);
    setOrbState('thinking');

    try {
      const result = await generateThoughtMap(rawText);
      setNodes(result.nodes);
      setConnections(result.connections);
      
      const newSession: ThoughtMapSession = {
        id: currentSessionId,
        userId: 'current',
        rawText: rawText,
        nodes: result.nodes,
        connections: result.connections,
        createdAt: new Date().toISOString()
      };
      await saveThoughtSession(newSession);

      showToast(`AI mapped ${result.nodes.length} distinct thought branches.`);
    } catch (err) {
      console.warn('Map generation error:', err);
    } finally {
      setIsMapping(false);
      setOrbState('idle');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Node Actions
  const handleUpdateNode = (id: string, updates: Partial<ThoughtBubble>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    if (selectedNode?.id === id) {
      setSelectedNode(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.fromId !== id && c.toId !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  };

  const handleAddManualNode = () => {
    const newNode: ThoughtBubble = {
      id: 'node_' + Date.now(),
      userId: 'current',
      text: 'New thought bubble',
      category: 'idea',
      x: 180 + Math.random() * 200,
      y: 120 + Math.random() * 150,
      approvedToShare: false,
      createdAt: new Date().toISOString()
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode);
  };

  // User-Approved Transfers
  const handleTransferToGoal = async (node: ThoughtBubble) => {
    await addNewGoal({
      title: node.text,
      category: 'personal',
      priority: 'medium',
      difficulty: 'moderate',
      status: 'not_started',
      progress: 0,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestones: [
        { id: 'ms_' + Date.now(), goalId: '', title: 'Plan initial phase', status: 'pending' }
      ],
      description: 'Imported from Blurt Thought Map.'
    });
    handleUpdateNode(node.id, { approvedToShare: true });
    showToast(`Transferred "${node.text}" to Goal Tracker!`);
  };

  const handleTransferToIdeaBin = async (node: ThoughtBubble) => {
    await saveIdeaItem({
      id: 'idea_' + Date.now(),
      userId: 'current',
      title: node.text,
      description: 'Captured during Blurt session: ' + rawText.slice(0, 60),
      stage: 'spark',
      tags: [node.category],
      linkedThoughtId: currentSessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    handleUpdateNode(node.id, { approvedToShare: true });
    showToast(`Added "${node.text}" to Idea Bin (Spark stage)!`);
  };

  const handleTransferToInterests = async (node: ThoughtBubble) => {
    await addNewInterest(node.text);
    handleUpdateNode(node.id, { approvedToShare: true });
    showToast(`Added "${node.text}" to your Profile Interests!`);
  };

  const loadSession = (s: ThoughtMapSession) => {
    setCurrentSessionId(s.id);
    setRawText(s.rawText);
    setNodes(s.nodes || []);
    setConnections(s.connections || []);
    setShowHistory(false);
  };

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl border text-xs font-bold text-white bg-emerald-600 shadow-xl flex items-center space-x-2 animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Central Orb & Calming Brain-Dump Area */}
      <div 
        className="rounded-3xl p-6 sm:p-10 border flex flex-col items-center justify-center text-center relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        {/* Background Ambient Glow */}
        <div 
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 filter blur-3xl pointer-events-none"
          style={{ background: 'var(--accent-primary)' }}
        />
        <div 
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full opacity-20 filter blur-3xl pointer-events-none"
          style={{ background: 'var(--accent-secondary)' }}
        />

        {/* Top Mini Header inside card */}
        <div className="w-full flex items-center justify-between pb-4 mb-4 border-b text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--accent-secondary)]">
              Express Your Thoughts Freely
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center space-x-1 hover:bg-[var(--bg-card-subtle)] text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <History className="w-3.5 h-3.5" />
              <span>Past Sessions ({thoughtSessions.length})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Reactive Bloom Orb */}
        <div className="my-3">
          <BloomOrb 
            size="lg" 
            state={orbState}
            onClick={() => {
              if (isRecording) finishRecording();
              else startRecording();
            }}
          />
        </div>

        {/* Orb Status Subtext */}
        <div className="mt-3 mb-5 space-y-1">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isRecording 
              ? isPaused ? 'Recording paused' : 'Listening attentively... speak whatever comes to mind.' 
              : isMapping 
                ? 'Deconstructing your thoughts into structured branches...' 
                : 'Click the orb or microphone to speak, or type freely below.'}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Stream of consciousness, messy notes, voice dumps, questions, or random ambitions.
          </p>
        </div>

        {/* Editable Transcript / Text Area */}
        <div className="w-full max-w-2xl space-y-3">
          <div className="relative">
            <textarea
              rows={4}
              value={rawText}
              onChange={handleTextChange}
              placeholder="Dump your thoughts here... e.g. 'I want to build a biology quiz app for my study group, but I am worried about next Thursday's math test. Also need to ensure I don't skip my evening run.'"
              className="w-full p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none resize-none transition-all"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />

            {/* Clear Button */}
            {rawText && (
              <button
                onClick={() => setRawText('')}
                className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg"
                title="Clear text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Voice Controls & Map Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center space-x-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={!speechSupported}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 hover:bg-[var(--bg-card-subtle)] text-[var(--text-primary)] disabled:opacity-40"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <Mic className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>Start Voice Recording</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1.5">
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center space-x-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center space-x-1"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={finishRecording}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center space-x-1"
                  >
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Finish</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateThoughtMap}
              disabled={!rawText.trim() || isMapping}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 flex items-center space-x-2 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isMapping ? 'Mapping Thoughts...' : 'Map My Thoughts with AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sessions History Drawer / Popover */}
      {showHistory && (
        <div 
          className="p-5 rounded-3xl border space-y-3 animate-in fade-in duration-200"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
              Past Blurt Sessions ({thoughtSessions.length})
            </span>
            <button onClick={() => setShowHistory(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {thoughtSessions.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-4 text-center">
              No saved sessions yet. Generate your first thought map above!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {thoughtSessions.map(s => (
                <div 
                  key={s.id}
                  className="p-3 rounded-2xl border space-y-2 flex flex-col justify-between"
                  style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
                >
                  <div>
                    <div className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                      {s.rawText.slice(0, 36) || 'Blurt Session'}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-1">
                      {s.rawText}
                    </p>
                  </div>
                  <div className="pt-2 border-t flex items-center justify-between text-[10px]" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[var(--text-muted)]">{new Date(s.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => loadSession(s)}
                        className="text-[var(--accent-primary)] font-bold hover:underline"
                      >
                        Load Map
                      </button>
                      <button
                        onClick={() => deleteThoughtSession(s.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Branching Thought Map */}
      {nodes.length > 0 && (
        <div 
          className="p-5 sm:p-6 rounded-3xl border space-y-4"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {/* Thought Map Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                  Interactive Thought Map
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[var(--bg-accent-soft)] text-[var(--accent-primary)]" style={{ borderColor: 'var(--border-subtle)' }}>
                  {nodes.length} Bubbles
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Click any bubble to edit, convert to a Goal or Idea, or simulate an Ambition.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddManualNode}
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] flex items-center space-x-1"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Add Bubble</span>
              </button>
            </div>
          </div>

          {/* Thought Canvas: Bubbles Grid / Visual Map */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {nodes.map(node => {
              const theme = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.idea;
              const isSelected = selectedNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                    isSelected ? 'ring-2 ring-[var(--accent-primary)] shadow-md' : 'hover:shadow-xs'
                  }`}
                  style={{
                    backgroundColor: theme.bg,
                    borderColor: theme.border,
                  }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                        style={{
                          color: theme.text,
                          borderColor: theme.border,
                          backgroundColor: 'rgba(255, 255, 255, 0.4)'
                        }}
                      >
                        {theme.label}
                      </span>

                      <div className="flex items-center space-x-1">
                        {node.approvedToShare && (
                          <span className="text-[10px] text-emerald-600 flex items-center space-x-0.5">
                            <Check className="w-3 h-3" />
                            <span>Saved</span>
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-red-500"
                          title="Delete bubble"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {node.text}
                    </p>
                  </div>

                  {/* Transfer / Exploration Pills */}
                  <div className="pt-2 border-t flex flex-wrap items-center gap-1.5" style={{ borderColor: theme.border }}>
                    {node.category === 'ambition' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSimulatorAmbition(node.text);
                        }}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center space-x-1 shadow-xs"
                      >
                        <Compass className="w-3 h-3" />
                        <span>Simulate Ambition</span>
                      </button>
                    )}

                    {(node.category === 'goal' || node.category === 'task' || node.category === 'ambition') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransferToGoal(node);
                        }}
                        className="px-2 py-1 rounded-xl text-[10px] font-semibold border bg-white/60 dark:bg-black/30 hover:bg-white text-[var(--text-primary)] flex items-center space-x-1"
                        style={{ borderColor: theme.border }}
                      >
                        <Target className="w-3 h-3 text-emerald-600" />
                        <span>+ To Goals</span>
                      </button>
                    )}

                    {(node.category === 'idea' || node.category === 'ambition') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransferToIdeaBin(node);
                        }}
                        className="px-2 py-1 rounded-xl text-[10px] font-semibold border bg-white/60 dark:bg-black/30 hover:bg-white text-[var(--text-primary)] flex items-center space-x-1"
                        style={{ borderColor: theme.border }}
                      >
                        <Lightbulb className="w-3 h-3 text-rose-500" />
                        <span>+ To Idea Bin</span>
                      </button>
                    )}

                    {node.category === 'interest' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransferToInterests(node);
                        }}
                        className="px-2 py-1 rounded-xl text-[10px] font-semibold border bg-white/60 dark:bg-black/30 hover:bg-white text-[var(--text-primary)] flex items-center space-x-1"
                        style={{ borderColor: theme.border }}
                      >
                        <BookOpen className="w-3 h-3 text-teal-600" />
                        <span>+ To Profile</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Node Editor Card */}
          {selectedNode && (
            <div 
              className="p-4 rounded-2xl border space-y-3 mt-3 animate-in fade-in duration-200"
              style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                  Edit Bubble Details
                </span>
                <button onClick={() => setSelectedNode(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Bubble Text</label>
                  <input
                    type="text"
                    value={selectedNode.text}
                    onChange={e => handleUpdateNode(selectedNode.id, { text: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <select
                    value={selectedNode.category}
                    onChange={e => handleUpdateNode(selectedNode.id, { category: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] capitalize"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    {Object.keys(CATEGORY_COLORS).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ambition Simulator Modal */}
      {simulatorAmbition && (
        <AmbitionSimulatorModal
          ambitionTitle={simulatorAmbition}
          isOpen={!!simulatorAmbition}
          onClose={() => setSimulatorAmbition(null)}
          onAdopted={() => {
            showToast(`Adopted pathway for "${simulatorAmbition}"!`);
          }}
        />
      )}
    </div>
  );
};
