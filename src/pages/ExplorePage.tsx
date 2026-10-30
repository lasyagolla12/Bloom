import React from 'react';
import { 
  Compass, 
  Map, 
  Target, 
  Radar, 
  BookOpen, 
  Sparkles, 
  Rocket, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ExplorePage: React.FC = () => {
  const { interests, ambitions, goals } = useAuth();

  return (
    <div className="space-y-8 select-none">
      {/* Header & Stage 5 Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Explore
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
            Personalized learning pathways, opportunity discovery, and ambition maps.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" />
          <span>Grounded in {interests.length} Saved Interests</span>
        </div>
      </div>

      {/* 1. Personal Growth Map Canvas Area */}
      <div 
        className="rounded-3xl p-6 sm:p-8 border relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center space-x-2">
            <Map className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Personal Growth Map
            </h2>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            Stage 5 Visualization Target
          </span>
        </div>

        {/* Visual node map preview */}
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg mb-4">
            {interests.map((interest) => (
              <div
                key={interest.id}
                className="px-4 py-2 rounded-2xl border text-xs font-semibold shadow-sm flex items-center space-x-2"
                style={{
                  backgroundColor: 'var(--bg-accent-soft)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-primary)'
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                <span>{interest.name}</span>
              </div>
            ))}
          </div>

          <p className="text-xs max-w-md" style={{ color: 'var(--text-secondary)' }}>
            Your saved interests will form an interactive topological map connecting courses, competitions, and portfolio projects.
          </p>
        </div>
      </div>

      {/* 2. Exploration Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Skill Pathways */}
        <div 
          className="p-5 rounded-3xl border space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Skill Pathway Generator
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Step-by-step milestones to transition from beginner to advanced competence.
          </p>
          <div className="p-3 rounded-2xl border text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
            Scheduled for Stage 5: Powered by Gemini with Goal Tracker schedule integration.
          </div>
        </div>

        {/* Opportunity Radar */}
        <div 
          className="p-5 rounded-3xl border space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center space-x-2">
            <Radar className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Opportunity Radar
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Curated student hackathons, Olympiads, scholarships, and academic journals.
          </p>
          <div className="p-3 rounded-2xl border text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
            Stage 1 foundation ready: Will display verified opportunities matching your interests.
          </div>
        </div>

        {/* Resource Discovery */}
        <div 
          className="p-5 rounded-3xl border space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Resource Discovery
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            High-yield lectures, textbooks, open datasets, and research papers.
          </p>
          <div className="p-3 rounded-2xl border text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
            Curated student resource library connecting to active ambitions.
          </div>
        </div>

        {/* Skill Gap Detector */}
        <div 
          className="p-5 rounded-3xl border space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Skill Gap Detector
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Identifies prerequisites needed to achieve selected ambitions without burnout.
          </p>
          <div className="p-3 rounded-2xl border text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
            Stage 5 Feature: Evaluates current skills against future project goals.
          </div>
        </div>

        {/* Idea Launchpad */}
        <div 
          className="p-5 rounded-3xl border space-y-3 lg:col-span-2"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center space-x-2">
            <Rocket className="w-4 h-4 text-[var(--accent-primary)]" />
            <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Idea Launchpad
            </h3>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Turn ideas approved in Blurt into actionable project roadmaps.
          </p>
          <div className="p-3 rounded-2xl border text-[11px] text-[var(--text-muted)]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-card-subtle)' }}>
            Connects your thoughts seamlessly with Goal Tracker deadlines and Portfolio entries.
          </div>
        </div>
      </div>
    </div>
  );
};
