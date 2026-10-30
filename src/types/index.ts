/**
 * Core type definitions for Bloom personal growth & well-being application
 * Extended for Step 2: Intelligent Goal Tracking, Daily Reflection, AI Analyzer & Growth Tree
 */

export type NavigationPage = 
  | 'home' 
  | 'goals' 
  | 'blurt' 
  | 'explore' 
  | 'portfolio' 
  | 'insights' 
  | 'reflection' 
  | 'analyzer' 
  | 'progress' 
  | 'settings';

export type ThemeMode = 'soft-focus' | 'midnight' | 'minimal' | 'system';
export type AnimationPreference = 'full' | 'reduced' | 'off';

export type DayOfWeek = 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday' 
  | 'saturday' 
  | 'sunday';

export type CommitmentCategory = 
  | 'school' 
  | 'tuition' 
  | 'extracurricular' 
  | 'hobby' 
  | 'personal' 
  | 'other';

export type RestType = 'sleep' | 'meal' | 'break' | 'personal';

export type TaskStatus = 'not_started' | 'completed' | 'partial' | 'postponed' | 'not_completed';
export type PriorityLevel = 'low' | 'medium' | 'high';
export type DifficultyLevel = 'easy' | 'moderate' | 'challenging';

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  onboardingCompleted: boolean;
  timezone: string;
  appearance: ThemeMode;
  animationPreference: AnimationPreference;
  helpCategories?: string[];
  aiConsent: boolean;
  aiConsentTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyCommitment {
  id: string;
  userId: string;
  title: string;
  category: CommitmentCategory;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  days: DayOfWeek[];
  isFixed: boolean;  // fixed vs flexible
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestPeriod {
  id: string;
  userId: string;
  restType: RestType;
  label: string;
  startTime: string;
  endTime: string;
  days: DayOfWeek[];
  isProtected: boolean;
}

export interface Interest {
  id: string;
  userId: string;
  name: string;
  category?: string;
  source?: string;
  createdAt: string;
}

export interface Ambition {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: PriorityLevel;
  status: 'active' | 'exploring' | 'achieved' | 'paused';
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  priority: PriorityLevel;
  difficulty: DifficultyLevel;
  targetDate?: string;
  estimatedEffort?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progress: number; // 0 - 100
  milestones?: Milestone[];
  completedAt?: string;
  archived?: boolean;
  archivedAt?: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  completionDate?: string;
}

export interface DailyTask {
  id: string;
  userId: string;
  goalId?: string;
  title: string;
  description?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:MM
  estimatedDurationMinutes: number; // e.g. 30, 45, 60
  priority: PriorityLevel;
  difficulty: DifficultyLevel;
  status: TaskStatus;
  completedAt?: string;
  postponedCount: number;
  postponedReasons?: string[];
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  category: CommitmentCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isFixed: boolean;
  linkedTaskId?: string;
  linkedGoalId?: string;
  isRecurringInstance?: boolean;
  notes?: string;
  color?: string;
}

export interface RescheduleSuggestion {
  taskId: string;
  taskTitle: string;
  originalDate: string;
  suggestedDate: string;
  suggestedStartTime: string;
  suggestedEndTime: string;
  reason: string;
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
}

export interface FocusModeSettings {
  enabled: boolean;
  examOrGoalTitle: string;
  targetGoalOrExam?: string;
  startDate?: string;
  endDate?: string;
  targetDate?: string;
  linkedGoalId?: string;
  prioritizeAcademicsOnly?: boolean;
  academicPrioritization?: boolean;
  distractionReduction?: boolean;
  aiScheduleAssistance?: boolean;
  notes?: string;
}

export interface DailyReflectionQuestion {
  id: string;
  type: 'morning' | 'night';
  questionText: string;
  order: number;
}

export interface ReflectionAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
}

export interface DailyReflection {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  morningAnswers?: ReflectionAnswer[];
  morningSubmittedAt?: string;
  morningPriorities?: string[];
  nightAnswers?: ReflectionAnswer[];
  nightSubmittedAt?: string;
  nightMood?: number;
  updatedAt: string;
}

export interface GrowthTreeRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  stage: 'seed' | 'sprout' | 'sapling' | 'young_tree' | 'fully_grown';
  completedTaskCount: number;
  totalTasksCount: number;
  percentage: number;
  treeTitle: string;
  taskSummaries: string[];
  savedAt: string;
}

export type AnalyzerInsightType = 
  | 'friction_trigger' 
  | 'productive_time' 
  | 'incomplete_goals' 
  | 'recurring_obstacle' 
  | 'intention_vs_reality' 
  | 'schedule_compatibility' 
  | 'protective_behavior' 
  | 'improvement_opportunity';

export interface AnalyzerInsight {
  id: string;
  userId: string;
  type: AnalyzerInsightType;
  title: string;
  observation: string;
  supportingEvidence: string;
  possibleExplanation: string;
  recommendedAction: string;
  suggestedChange?: {
    type: 'reschedule' | 'adjust_duration' | 'break_down' | 'buffer_rest';
    targetTaskId?: string;
    details?: string;
  };
  dismissed?: boolean;
  accepted?: boolean;
  createdAt: string;
}

export interface MotivationPreference {
  userId: string;
  preferredTones: string[];
  preferredLength: 'short' | 'medium' | 'long';
  likedCards: string[];
  dismissedCards: string[];
  savedFavorites: string[];
}

export interface MotivationCardItem {
  id: string;
  quote: string;
  author: string;
  tone: string;
  theme: string;
}

// ----------------------------------------------------
// Step 3: Blurt, Thought Mapping, Idea Bin & Vault
// ----------------------------------------------------

export type ThoughtCategory = 'goal' | 'ambition' | 'idea' | 'concern' | 'interest' | 'task';

export interface ThoughtBubble {
  id: string;
  userId: string;
  sessionId?: string;
  text: string;
  category: ThoughtCategory;
  parentId?: string;
  x?: number;
  y?: number;
  approvedToShare?: boolean;
  transferredTo?: 'goal' | 'ideabin' | 'analyzer' | 'interest' | null;
  createdAt: string;
}

export interface ThoughtConnection {
  fromId: string;
  toId: string;
  label?: string;
}

export interface ThoughtMapSession {
  id: string;
  userId: string;
  rawText: string;
  audioDurationSeconds?: number;
  nodes: ThoughtBubble[];
  connections: ThoughtConnection[];
  createdAt: string;
}

export type IdeaStage = 'spark' | 'exploring' | 'planning' | 'in_progress' | 'on_hold' | 'completed';

export interface IdeaItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  notes?: string;
  stage: IdeaStage;
  linkedThoughtId?: string;
  convertedGoalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PathwayStep {
  title: string;
  durationWeeks: number;
  milestoneTitle: string;
  description?: string;
}

export interface AmbitionPathway {
  id: string;
  ambitionTitle: string;
  pathwayName: string;
  summary: string;
  steps: PathwayStep[];
  requiredSkills: string[];
  estimatedWeeklyHours: number;
  potentialChallenges: string[];
  scheduleCompatibility: 'high' | 'moderate' | 'tight';
  compatibilityNotes: string;
}

export interface VaultEntry {
  id: string;
  userId: string;
  title: string;
  encryptedData: string; // Base64 ciphertext
  iv: string;            // Base64 AES initialization vector
  salt: string;          // Base64 PBKDF2 salt
  createdAt: string;
  updatedAt: string;
}

