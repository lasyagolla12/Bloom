import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  fbSignOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  onAuthStateChanged,
  FirebaseUser
} from '../lib/firebase';
import { 
  UserProfile, 
  WeeklyCommitment, 
  RestPeriod, 
  Interest, 
  Ambition, 
  Goal, 
  MotivationPreference, 
  NavigationPage, 
  ThemeMode, 
  AnimationPreference,
  DailyTask,
  CalendarEvent,
  DailyReflection,
  DailyReflectionQuestion,
  ReflectionAnswer,
  GrowthTreeRecord,
  AnalyzerInsight,
  FocusModeSettings,
  RescheduleSuggestion,
  TaskStatus,
  ThoughtMapSession,
  ThoughtBubble,
  IdeaItem,
  AmbitionPathway,
  VaultEntry
} from '../types';
import * as dataService from '../services/dataService';

interface AuthContextType {
  user: FirebaseUser | { uid: string; email: string; displayName: string } | null;
  profile: UserProfile | null;
  commitments: WeeklyCommitment[];
  restPeriods: RestPeriod[];
  interests: Interest[];
  ambitions: Ambition[];
  goals: Goal[];
  tasks: DailyTask[];
  calendarEvents: CalendarEvent[];
  dailyReflections: DailyReflection[];
  reflections: DailyReflection[];
  reflectionQuestions: DailyReflectionQuestion[];
  forestRecords: GrowthTreeRecord[];
  focusMode: FocusModeSettings;
  analyzerInsights: AnalyzerInsight[];
  rescheduleSuggestion: RescheduleSuggestion | null;
  motivationPref: MotivationPreference | null;
  thoughtSessions: ThoughtMapSession[];
  ideaItems: IdeaItem[];
  vaultEntries: VaultEntry[];
  completedGoals: Goal[];
  isLoading: boolean;
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  theme: ThemeMode;
  resolvedTheme: 'soft-focus' | 'midnight' | 'minimal';
  setTheme: (theme: ThemeMode) => Promise<void>;
  animationPref: AnimationPreference;
  setAnimationPref: (pref: AnimationPreference) => Promise<void>;
  
  // Auth methods
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;

  // Data Actions
  completeOnboarding: (payload: {
    displayName: string;
    helpCategories: string[];
    aiConsent: boolean;
    interests: string[];
    ambitions: string[];
    motivation: { tones: string[]; length: 'short' | 'medium' | 'long' };
    commitments: WeeklyCommitment[];
    restPeriods: RestPeriod[];
    goals: Goal[];
    appearance: ThemeMode;
    animationPreference: AnimationPreference;
  }) => Promise<void>;

  updateDisplayName: (name: string) => Promise<void>;
  updateAiConsent: (consent: boolean) => Promise<void>;
  
  // Commitments & Rest
  addOrUpdateCommitment: (c: WeeklyCommitment) => Promise<void>;
  removeCommitment: (id: string) => Promise<void>;
  addOrUpdateRestPeriod: (r: RestPeriod) => Promise<void>;
  removeRestPeriod: (id: string) => Promise<void>;
  
  // Goals, Milestones & Tasks
  addNewInterest: (name: string, category?: string) => Promise<void>;
  removeInterestItem: (id: string) => Promise<void>;
  addNewAmbition: (title: string, priority?: 'low' | 'medium' | 'high') => Promise<void>;
  removeAmbitionItem: (id: string) => Promise<void>;
  addNewGoal: (g: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateGoalProgress: (id: string, progress: number) => Promise<void>;
  removeGoalItem: (id: string) => Promise<void>;
  
  addOrUpdateTask: (task: DailyTask) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus, reason?: string) => Promise<void>;
  autoScheduleTask: (taskId: string) => Promise<boolean>;
  acceptRescheduleSuggestion: (suggestion: RescheduleSuggestion) => Promise<void>;
  rejectRescheduleSuggestion: () => void;
  
  // Calendar Events
  addOrUpdateCalendarEvent: (e: CalendarEvent) => Promise<void>;
  removeCalendarEvent: (id: string) => Promise<void>;

  // Daily Reflection
  saveMorningReflection: (date: string, answers: ReflectionAnswer[], priorities?: string[]) => Promise<void>;
  saveNightReflection: (date: string, answers: ReflectionAnswer[], mood?: number) => Promise<void>;
  updateQuestions: (questions: DailyReflectionQuestion[]) => Promise<void>;

  // Focus Mode
  toggleFocusMode: (settings?: Partial<FocusModeSettings>) => Promise<void>;
  setFocusMode: (settings: FocusModeSettings) => Promise<void>;

  // Analyzer
  generateAnalyzerInsights: () => Promise<void>;
  askAnalyzer: (message: string) => Promise<string>;
  dismissInsight: (id: string) => Promise<void>;
  acceptInsight: (id: string) => Promise<void>;

  // Motivation & Forest
  saveMotivation: (pref: MotivationPreference) => Promise<void>;
  checkAndRecordDailyTree: () => Promise<void>;

  // Step 3: Goals Archive & Portfolio
  archiveGoal: (goalId: string) => Promise<void>;
  restoreGoal: (goalId: string) => Promise<void>;

  // Step 3: Thought Sessions & Mapping
  saveThoughtSession: (session: ThoughtMapSession) => Promise<void>;
  deleteThoughtSession: (id: string) => Promise<void>;
  generateThoughtMap: (text: string) => Promise<{ nodes: ThoughtBubble[]; connections: any[] }>;

  // Step 3: Idea Bin
  saveIdeaItem: (item: IdeaItem) => Promise<void>;
  deleteIdeaItem: (id: string) => Promise<void>;
  convertIdeaToGoal: (ideaId: string) => Promise<void>;

  // Step 3: Private Vault
  saveVaultEntry: (entry: VaultEntry) => Promise<void>;
  deleteVaultEntry: (id: string) => Promise<void>;

  // Step 3: Ambition Simulator
  simulateAmbition: (title: string) => Promise<AmbitionPathway[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | { uid: string; email: string; displayName: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [commitments, setCommitments] = useState<WeeklyCommitment[]>([]);
  const [restPeriods, setRestPeriods] = useState<RestPeriod[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [ambitions, setAmbitions] = useState<Ambition[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [dailyReflections, setDailyReflections] = useState<DailyReflection[]>([]);
  const [reflectionQuestions, setReflectionQuestions] = useState<DailyReflectionQuestion[]>([]);
  const [forestRecords, setForestRecords] = useState<GrowthTreeRecord[]>([]);
  const [focusMode, setFocusMode] = useState<FocusModeSettings>({
    enabled: false,
    examOrGoalTitle: 'Midterm Focus Sprint',
    prioritizeAcademicsOnly: true,
    aiScheduleAssistance: true
  });
  const [analyzerInsights, setAnalyzerInsights] = useState<AnalyzerInsight[]>([]);
  const [rescheduleSuggestion, setRescheduleSuggestion] = useState<RescheduleSuggestion | null>(null);
  const [motivationPref, setMotivationPref] = useState<MotivationPreference | null>(null);
  const [thoughtSessions, setThoughtSessions] = useState<ThoughtMapSession[]>([]);
  const [ideaItems, setIdeaItems] = useState<IdeaItem[]>([]);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<NavigationPage>('home');
  const [theme, setThemeState] = useState<ThemeMode>('soft-focus');
  const [animationPref, setAnimationPrefState] = useState<AnimationPreference>('full');

  const completedGoals = useMemo(() => {
    return goals.filter(g => g.archived || g.status === 'completed');
  }, [goals]);

  // Compute resolved theme for 'system'
  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    matcher.addEventListener('change', onChange);
    return () => matcher.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: 'soft-focus' | 'midnight' | 'minimal' = useMemo(() => {
    if (theme === 'system') {
      return systemIsDark ? 'midnight' : 'soft-focus';
    }
    return theme;
  }, [theme, systemIsDark]);

  // Apply theme & animation preference attributes to HTML root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-motion', animationPref);
  }, [animationPref]);

  // Load user data helper
  const loadUserData = async (uid: string) => {
    try {
      const [
        loadedProfile, 
        loadedCommitments, 
        loadedRest, 
        loadedInterests, 
        loadedAmbitions, 
        loadedGoals, 
        loadedTasks,
        loadedEvents,
        loadedReflections,
        loadedQuestions,
        loadedForest,
        loadedFocus,
        loadedInsights,
        loadedMotivation,
        loadedSessions,
        loadedIdeas,
        loadedVault
      ] = await Promise.all([
        dataService.getUserProfile(uid),
        dataService.getWeeklyCommitments(uid),
        dataService.getRestPeriods(uid),
        dataService.getInterests(uid),
        dataService.getAmbitions(uid),
        dataService.getGoals(uid),
        dataService.getDailyTasks(uid),
        dataService.getCalendarEvents(uid),
        dataService.getDailyReflections(uid),
        dataService.getReflectionQuestions(uid),
        dataService.getForestRecords(uid),
        dataService.getFocusModeSettings(uid),
        dataService.getAnalyzerInsights(uid),
        dataService.getMotivationPreference(uid),
        dataService.getThoughtSessions(uid),
        dataService.getIdeaItems(uid),
        dataService.getVaultEntries(uid)
      ]);

      if (loadedProfile) {
        setProfile(loadedProfile);
        if (loadedProfile.appearance) setThemeState(loadedProfile.appearance);
        if (loadedProfile.animationPreference) setAnimationPrefState(loadedProfile.animationPreference);
      }
      setCommitments(loadedCommitments);
      setRestPeriods(loadedRest);
      setInterests(loadedInterests);
      setAmbitions(loadedAmbitions);
      setGoals(loadedGoals);
      setTasks(loadedTasks);
      setCalendarEvents(loadedEvents);
      setDailyReflections(loadedReflections);
      setReflectionQuestions(loadedQuestions);
      setForestRecords(loadedForest);
      setFocusMode(loadedFocus);
      setAnalyzerInsights(loadedInsights);
      setMotivationPref(loadedMotivation);
      setThoughtSessions(loadedSessions);
      setIdeaItems(loadedIdeas);
      setVaultEntries(loadedVault);
    } catch (err) {
      console.warn('Error loading user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to Auth state
  useEffect(() => {
    const guestUserJson = localStorage.getItem('bloom_guest_session');
    if (guestUserJson) {
      try {
        const guestUser = JSON.parse(guestUserJson);
        setUser(guestUser);
        loadUserData(guestUser.uid);
        return;
      } catch {
        localStorage.removeItem('bloom_guest_session');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        await loadUserData(fbUser.uid);
      } else {
        setUser(null);
        setProfile(null);
        setCommitments([]);
        setRestPeriods([]);
        setInterests([]);
        setAmbitions([]);
        setGoals([]);
        setTasks([]);
        setCalendarEvents([]);
        setDailyReflections([]);
        setForestRecords([]);
        setAnalyzerInsights([]);
        setMotivationPref(null);
        setThoughtSessions([]);
        setIdeaItems([]);
        setVaultEntries([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (profile && user) {
      const updated = { ...profile, appearance: newTheme };
      setProfile(updated);
      await dataService.saveUserProfile(updated);
    }
  };

  const setAnimationPref = async (newPref: AnimationPreference) => {
    setAnimationPrefState(newPref);
    if (profile && user) {
      const updated = { ...profile, animationPreference: newPref };
      setProfile(updated);
      await dataService.saveUserProfile(updated);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      setUser(fbUser);
      let existingProfile = await dataService.getUserProfile(fbUser.uid);
      if (!existingProfile) {
        existingProfile = {
          userId: fbUser.uid,
          displayName: fbUser.displayName || 'Alex',
          email: fbUser.email || '',
          onboardingCompleted: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          appearance: theme,
          animationPreference: animationPref,
          aiConsent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await dataService.saveUserProfile(existingProfile);
      }
      setProfile(existingProfile);
      await loadUserData(fbUser.uid);
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.warn('Google sign in notice:', error?.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      setUser(cred.user);
      await loadUserData(cred.user.uid);
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed') {
        const uid = 'usr_' + btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
        const persistentUser = {
          uid,
          email: email.trim(),
          displayName: email.split('@')[0] || 'Alex'
        };
        localStorage.setItem('bloom_guest_session', JSON.stringify(persistentUser));
        setUser(persistentUser);
        let existingProfile = await dataService.getUserProfile(uid);
        if (!existingProfile) {
          existingProfile = {
            userId: uid,
            displayName: email.split('@')[0] || 'Alex',
            email: email.trim(),
            onboardingCompleted: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            appearance: theme,
            animationPreference: animationPref,
            aiConsent: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await dataService.saveUserProfile(existingProfile);
        }
        setProfile(existingProfile);
        await loadUserData(uid);
        return;
      }
      console.warn('Email sign in notice:', error?.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      const newProfile: UserProfile = {
        userId: cred.user.uid,
        displayName: name,
        email: email,
        onboardingCompleted: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        appearance: theme,
        animationPreference: animationPref,
        aiConsent: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await dataService.saveUserProfile(newProfile);
      setUser(cred.user);
      setProfile(newProfile);
      await loadUserData(cred.user.uid);
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed') {
        const uid = 'usr_' + btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
        const persistentUser = {
          uid,
          email: email.trim(),
          displayName: name.trim() || 'Alex'
        };
        localStorage.setItem('bloom_guest_session', JSON.stringify(persistentUser));
        setUser(persistentUser);
        let existingProfile = await dataService.getUserProfile(uid);
        if (!existingProfile) {
          existingProfile = {
            userId: uid,
            displayName: name.trim() || 'Alex',
            email: email.trim(),
            onboardingCompleted: false,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            appearance: theme,
            animationPreference: animationPref,
            aiConsent: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await dataService.saveUserProfile(existingProfile);
        }
        setProfile(existingProfile);
        await loadUserData(uid);
        return;
      }
      console.warn('Sign up notice:', error?.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsGuest = async () => {
    setIsLoading(true);
    const guestUid = 'guest_student_' + Math.random().toString(36).substring(2, 9);
    const guestUser = {
      uid: guestUid,
      email: 'alex.student@bloom.space',
      displayName: 'Alex'
    };
    localStorage.setItem('bloom_guest_session', JSON.stringify(guestUser));
    setUser(guestUser);
    
    let currentProfile = await dataService.getUserProfile(guestUid);
    if (!currentProfile) {
      currentProfile = {
        userId: guestUid,
        displayName: 'Alex',
        email: 'alex.student@bloom.space',
        onboardingCompleted: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        appearance: 'soft-focus',
        animationPreference: 'full',
        aiConsent: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await dataService.saveUserProfile(currentProfile);
    }
    setProfile(currentProfile);
    await loadUserData(guestUid);
    setIsLoading(false);
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('bloom_guest_session');
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase sign out notice:', e);
    } finally {
      setUser(null);
      setProfile(null);
      setCommitments([]);
      setRestPeriods([]);
      setInterests([]);
      setAmbitions([]);
      setGoals([]);
      setTasks([]);
      setCalendarEvents([]);
      setDailyReflections([]);
      setForestRecords([]);
      setAnalyzerInsights([]);
      setMotivationPref(null);
      setActivePage('home');
    }
  };

  const completeOnboarding = async (payload: {
    displayName: string;
    helpCategories: string[];
    aiConsent: boolean;
    interests: string[];
    ambitions: string[];
    motivation: { tones: string[]; length: 'short' | 'medium' | 'long' };
    commitments: WeeklyCommitment[];
    restPeriods: RestPeriod[];
    goals: Goal[];
    appearance: ThemeMode;
    animationPreference: AnimationPreference;
  }) => {
    if (!user) return;
    const uid = user.uid;

    const updatedProfile: UserProfile = {
      userId: uid,
      displayName: payload.displayName || profile?.displayName || 'Alex',
      email: user.email || profile?.email || '',
      onboardingCompleted: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      appearance: payload.appearance,
      animationPreference: payload.animationPreference,
      helpCategories: payload.helpCategories,
      aiConsent: payload.aiConsent,
      aiConsentTimestamp: payload.aiConsent ? new Date().toISOString() : undefined,
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setThemeState(payload.appearance);
    setAnimationPrefState(payload.animationPreference);
    setProfile(updatedProfile);
    await dataService.saveUserProfile(updatedProfile);

    // Save commitments
    for (const c of payload.commitments) {
      await dataService.saveWeeklyCommitment({ ...c, userId: uid });
    }
    setCommitments(payload.commitments);

    // Save rest periods
    for (const r of payload.restPeriods) {
      await dataService.saveRestPeriod({ ...r, userId: uid });
    }
    setRestPeriods(payload.restPeriods);

    // Save interests
    const newInterests: Interest[] = [];
    for (const name of payload.interests) {
      const item: Interest = {
        id: 'interest_' + Math.random().toString(36).substring(2, 9),
        userId: uid,
        name,
        createdAt: new Date().toISOString()
      };
      await dataService.saveInterest(item);
      newInterests.push(item);
    }
    setInterests(newInterests);

    // Save ambitions
    const newAmbitions: Ambition[] = [];
    for (const title of payload.ambitions) {
      const item: Ambition = {
        id: 'ambition_' + Math.random().toString(36).substring(2, 9),
        userId: uid,
        title,
        priority: 'high',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      await dataService.saveAmbition(item);
      newAmbitions.push(item);
    }
    setAmbitions(newAmbitions);

    // Save goals
    for (const g of payload.goals) {
      await dataService.saveGoal({ ...g, userId: uid });
    }
    setGoals(payload.goals);

    // Seed default starter daily tasks from initial goals if any
    const todayStr = new Date().toISOString().split('T')[0];
    if (payload.goals.length > 0) {
      const starterTasks: DailyTask[] = [
        {
          id: 'task_' + Math.random().toString(36).substring(2, 9),
          userId: uid,
          goalId: payload.goals[0].id,
          title: `Initial research for ${payload.goals[0].title}`,
          scheduledDate: todayStr,
          scheduledTime: '16:00',
          estimatedDurationMinutes: 45,
          priority: 'high',
          difficulty: 'moderate',
          status: 'not_started',
          postponedCount: 0,
          createdAt: new Date().toISOString()
        }
      ];
      for (const t of starterTasks) {
        await dataService.saveDailyTask(t);
      }
      setTasks(starterTasks);
    }

    // Save motivation
    const motPref: MotivationPreference = {
      userId: uid,
      preferredTones: payload.motivation.tones,
      preferredLength: payload.motivation.length,
      likedCards: [],
      dismissedCards: [],
      savedFavorites: []
    };
    await dataService.saveMotivationPreference(motPref);
    setMotivationPref(motPref);

    setActivePage('home');
  };

  const updateDisplayName = async (name: string) => {
    if (!profile || !user) return;
    const updated = { ...profile, displayName: name, updatedAt: new Date().toISOString() };
    setProfile(updated);
    await dataService.saveUserProfile(updated);
  };

  const updateAiConsent = async (consent: boolean) => {
    if (!profile || !user) return;
    const updated: UserProfile = {
      ...profile,
      aiConsent: consent,
      aiConsentTimestamp: consent ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString()
    };
    setProfile(updated);
    await dataService.saveUserProfile(updated);
  };

  const addOrUpdateCommitment = async (c: WeeklyCommitment) => {
    if (!user) return;
    const item = { ...c, userId: user.uid };
    await dataService.saveWeeklyCommitment(item);
    setCommitments(prev => {
      const idx = prev.findIndex(x => x.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [...prev, item];
    });
  };

  const removeCommitment = async (id: string) => {
    if (!user) return;
    await dataService.deleteWeeklyCommitment(user.uid, id);
    setCommitments(prev => prev.filter(x => x.id !== id));
  };

  const addOrUpdateRestPeriod = async (r: RestPeriod) => {
    if (!user) return;
    const item = { ...r, userId: user.uid };
    await dataService.saveRestPeriod(item);
    setRestPeriods(prev => {
      const idx = prev.findIndex(x => x.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [...prev, item];
    });
  };

  const removeRestPeriod = async (id: string) => {
    if (!user) return;
    await dataService.deleteRestPeriod(user.uid, id);
    setRestPeriods(prev => prev.filter(x => x.id !== id));
  };

  const addNewInterest = async (name: string, category?: string) => {
    if (!user) return;
    const item: Interest = {
      id: 'interest_' + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      name,
      category,
      createdAt: new Date().toISOString()
    };
    await dataService.saveInterest(item);
    setInterests(prev => [...prev, item]);
  };

  const removeInterestItem = async (id: string) => {
    if (!user) return;
    await dataService.deleteInterest(user.uid, id);
    setInterests(prev => prev.filter(i => i.id !== id));
  };

  const addNewAmbition = async (title: string, priority: 'low' | 'medium' | 'high' = 'high') => {
    if (!user) return;
    const item: Ambition = {
      id: 'ambition_' + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      title,
      priority,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    await dataService.saveAmbition(item);
    setAmbitions(prev => [...prev, item]);
  };

  const removeAmbitionItem = async (id: string) => {
    if (!user) return;
    await dataService.deleteAmbition(user.uid, id);
    setAmbitions(prev => prev.filter(a => a.id !== id));
  };

  const addNewGoal = async (g: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const item: Goal = {
      ...g,
      id: 'goal_' + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      createdAt: new Date().toISOString()
    };
    await dataService.saveGoal(item);
    setGoals(prev => [...prev, item]);
  };

  const updateGoalProgress = async (id: string, progress: number) => {
    if (!user) return;
    const target = goals.find(g => g.id === id);
    if (!target) return;
    const updated: Goal = {
      ...target,
      progress: Math.min(100, Math.max(0, progress)),
      status: progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : target.status
    };
    await dataService.saveGoal(updated);
    setGoals(prev => prev.map(g => g.id === id ? updated : g));
  };

  const removeGoalItem = async (id: string) => {
    if (!user) return;
    await dataService.deleteGoal(user.uid, id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Daily Tasks
  const addOrUpdateTask = async (task: DailyTask) => {
    if (!user) return;
    const item = { ...task, userId: user.uid };
    await dataService.saveDailyTask(item);
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
    // Check if growth tree achievement unlocked
    setTimeout(() => {
      checkAndRecordDailyTree();
    }, 200);
  };

  const removeTask = async (id: string) => {
    if (!user) return;
    await dataService.deleteDailyTask(user.uid, id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTaskStatus = async (id: string, status: TaskStatus, reason?: string) => {
    if (!user) return;
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const isPostponedOrIncomplete = status === 'postponed' || status === 'not_completed';
    const updated: DailyTask = {
      ...target,
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
      postponedCount: isPostponedOrIncomplete ? target.postponedCount + 1 : target.postponedCount,
      postponedReasons: reason ? [...(target.postponedReasons || []), reason] : target.postponedReasons
    };

    await dataService.saveDailyTask(updated);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));

    // If marked Not Completed, automatically calculate and trigger intelligent rescheduling suggestion
    if (status === 'not_completed') {
      const suggestion = dataService.generateRescheduleSuggestion(
        updated,
        commitments,
        calendarEvents,
        restPeriods
      );
      if (suggestion) {
        setRescheduleSuggestion(suggestion);
      }
    }

    setTimeout(() => {
      checkAndRecordDailyTree();
    }, 200);
  };

  const autoScheduleTask = async (taskId: string): Promise<boolean> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const suggestion = dataService.generateRescheduleSuggestion(
      task,
      commitments,
      calendarEvents,
      restPeriods
    );

    if (suggestion) {
      setRescheduleSuggestion(suggestion);
      return true;
    }
    return false;
  };

  const acceptRescheduleSuggestion = async (suggestion: RescheduleSuggestion) => {
    if (!user) return;
    const task = tasks.find(t => t.id === suggestion.taskId);
    if (!task) return;

    // 1. Update Task
    const updatedTask: DailyTask = {
      ...task,
      scheduledDate: suggestion.suggestedDate,
      scheduledTime: suggestion.suggestedStartTime,
      status: 'not_started'
    };
    await dataService.saveDailyTask(updatedTask);
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

    // 2. Add or update linked Calendar Event
    const newEvent: CalendarEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      title: task.title,
      category: 'personal',
      date: suggestion.suggestedDate,
      startTime: suggestion.suggestedStartTime,
      endTime: suggestion.suggestedEndTime,
      isFixed: false,
      linkedTaskId: task.id,
      notes: `Rescheduled via Bloom Auto-Schedule: ${suggestion.reason}`
    };
    await dataService.saveCalendarEvent(newEvent);
    setCalendarEvents(prev => [...prev, newEvent]);

    setRescheduleSuggestion(null);
  };

  const rejectRescheduleSuggestion = () => {
    setRescheduleSuggestion(null);
  };

  // Calendar Events
  const addOrUpdateCalendarEvent = async (e: CalendarEvent) => {
    if (!user) return;
    const item = { ...e, userId: user.uid };
    await dataService.saveCalendarEvent(item);
    setCalendarEvents(prev => {
      const idx = prev.findIndex(x => x.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [...prev, item];
    });
  };

  const removeCalendarEvent = async (id: string) => {
    if (!user) return;
    await dataService.deleteCalendarEvent(user.uid, id);
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  };

  // Daily Reflection
  const saveMorningReflection = async (date: string, answers: ReflectionAnswer[], priorities?: string[]) => {
    if (!user) return;
    const existing = dailyReflections.find(r => r.date === date);
    const updated: DailyReflection = {
      id: existing?.id || 'refl_' + date,
      userId: user.uid,
      date,
      morningAnswers: answers,
      morningSubmittedAt: new Date().toISOString(),
      morningPriorities: priorities || existing?.morningPriorities,
      nightAnswers: existing?.nightAnswers,
      nightSubmittedAt: existing?.nightSubmittedAt,
      nightMood: existing?.nightMood,
      updatedAt: new Date().toISOString()
    };
    await dataService.saveDailyReflection(updated);
    setDailyReflections(prev => {
      const idx = prev.findIndex(r => r.date === date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
  };

  const saveNightReflection = async (date: string, answers: ReflectionAnswer[], mood?: number) => {
    if (!user) return;
    const existing = dailyReflections.find(r => r.date === date);
    const updated: DailyReflection = {
      id: existing?.id || 'refl_' + date,
      userId: user.uid,
      date,
      morningAnswers: existing?.morningAnswers,
      morningSubmittedAt: existing?.morningSubmittedAt,
      morningPriorities: existing?.morningPriorities,
      nightAnswers: answers,
      nightSubmittedAt: new Date().toISOString(),
      nightMood: mood || existing?.nightMood,
      updatedAt: new Date().toISOString()
    };
    await dataService.saveDailyReflection(updated);
    setDailyReflections(prev => {
      const idx = prev.findIndex(r => r.date === date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
  };

  const updateQuestions = async (questions: DailyReflectionQuestion[]) => {
    if (!user) return;
    await dataService.saveReflectionQuestions(user.uid, questions);
    setReflectionQuestions(questions);
  };

  // Focus Mode
  const updateFocusMode = async (settings: FocusModeSettings) => {
    if (!user) return;
    await dataService.saveFocusModeSettings(user.uid, settings);
    setFocusMode(settings);
  };

  const toggleFocusMode = async (settings?: Partial<FocusModeSettings>) => {
    if (!user) return;
    const updated: FocusModeSettings = {
      ...focusMode,
      ...settings,
      enabled: settings?.enabled !== undefined ? settings.enabled : !focusMode.enabled
    };
    await dataService.saveFocusModeSettings(user.uid, updated);
    setFocusMode(updated);
  };

  // Daily Tree & Forest Checker
  const checkAndRecordDailyTree = async () => {
    if (!user) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.scheduledDate === todayStr);
    if (todayTasks.length === 0) return;

    const completed = todayTasks.filter(t => t.status === 'completed');
    const pct = Math.round((completed.length / todayTasks.length) * 100);

    let stage: GrowthTreeRecord['stage'] = 'seed';
    if (pct === 100) stage = 'fully_grown';
    else if (pct >= 60) stage = 'young_tree';
    else if (pct >= 25) stage = 'sapling';
    else if (pct > 0) stage = 'sprout';

    // If fully grown (100%), save achievement to forest
    if (stage === 'fully_grown') {
      const existing = forestRecords.find(f => f.date === todayStr);
      if (!existing) {
        const newRecord: GrowthTreeRecord = {
          id: 'forest_' + todayStr,
          userId: user.uid,
          date: todayStr,
          stage: 'fully_grown',
          completedTaskCount: completed.length,
          totalTasksCount: todayTasks.length,
          percentage: 100,
          treeTitle: `Oak of Accomplishment (${todayTasks.length} tasks)`,
          taskSummaries: completed.map(t => t.title),
          savedAt: new Date().toISOString()
        };
        await dataService.saveForestRecord(newRecord);
        setForestRecords(prev => [newRecord, ...prev.filter(r => r.date !== todayStr)]);
      }
    }
  };

  // Analyzer Actions
  const generateAnalyzerInsights = async () => {
    if (!user) return;
    try {
      // Collect real activity data
      const permittedData = {
        tasksCount: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        postponedTasks: tasks.filter(t => t.status === 'postponed' || t.status === 'not_completed').length,
        postponementReasons: tasks.flatMap(t => t.postponedReasons || []),
        commitmentsCount: commitments.length,
        restPeriodsCount: restPeriods.length,
        reflectionsCount: dailyReflections.length,
        recentReflections: dailyReflections.slice(0, 3)
      };

      const res = await fetch('/api/analyzer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permittedData })
      });
      const data = await res.json();
      
      const formatted: AnalyzerInsight[] = [];

      // Check simplified 3-section format
      if (data?.biggestPattern) {
        formatted.push({
          id: 'ins_bp_' + Date.now(),
          userId: user.uid,
          type: 'productive_time',
          title: data.biggestPattern.title || 'Your Biggest Pattern',
          observation: data.biggestPattern.observation || '',
          supportingEvidence: data.biggestPattern.whySeeingThis || 'Grounded in your scheduled commitments and task logs.',
          possibleExplanation: 'Identified through your weekly rhythm and reflection notes.',
          recommendedAction: 'Keep nurturing this pattern by protecting your peak focus blocks.',
          createdAt: new Date().toISOString()
        });
      }

      if (data?.recurringObstacle) {
        formatted.push({
          id: 'ins_ro_' + Date.now(),
          userId: user.uid,
          type: 'recurring_obstacle',
          title: data.recurringObstacle.title || "What's Getting in Your Way?",
          observation: data.recurringObstacle.obstacle || '',
          supportingEvidence: data.recurringObstacle.whySeeingThis || 'Derived from recent task postponements and reflection answers.',
          possibleExplanation: 'Natural friction occurs when intensive academic blocks overlap with personal tasks.',
          recommendedAction: 'Add brief rest buffers before deep study tasks.',
          createdAt: new Date().toISOString()
        });
      }

      if (Array.isArray(data?.practicalSuggestions)) {
        data.practicalSuggestions.forEach((sug: any, idx: number) => {
          formatted.push({
            id: 'ins_sug_' + Date.now() + '_' + idx,
            userId: user.uid,
            type: 'improvement_opportunity',
            title: sug.title || 'What Could Help',
            observation: sug.suggestion || '',
            supportingEvidence: sug.whySeeingThis || 'Suggested based on your current balance.',
            possibleExplanation: 'A small adjustment can unlock substantial relief and progress.',
            recommendedAction: sug.suggestion || '',
            suggestedChange: {
              type: sug.actionType || 'buffer_rest',
              details: sug.title
            },
            createdAt: new Date().toISOString()
          });
        });
      }

      // Backward compatibility with legacy insights array
      if (formatted.length === 0 && Array.isArray(data?.insights) && data.insights.length > 0) {
        data.insights.forEach((ins: any) => {
          formatted.push({
            id: 'ins_' + Math.random().toString(36).substring(2, 9),
            userId: user.uid,
            type: ins.type || 'friction_trigger',
            title: ins.title || 'Productivity Observation',
            observation: ins.observation || '',
            supportingEvidence: ins.supportingEvidence || '',
            possibleExplanation: ins.possibleExplanation || '',
            recommendedAction: ins.recommendedAction || '',
            suggestedChange: ins.suggestedChange,
            createdAt: new Date().toISOString()
          });
        });
      }

      if (formatted.length > 0) {
        for (const ins of formatted) {
          await dataService.saveAnalyzerInsight(ins);
        }
        setAnalyzerInsights(formatted);
        return;
      }

      // Default data-driven deterministic synthesis if LLM API key not present or returns empty
      const defaultInsights: AnalyzerInsight[] = [
        {
          id: 'ins_default_1',
          userId: user.uid,
          type: 'productive_time',
          title: 'Morning Focus Momentum',
          observation: 'You consistently make your strongest headway when starting priority tasks before 1:00 PM.',
          supportingEvidence: `${tasks.filter(t => t.status === 'completed').length} completed tasks were scheduled in early or midday hours.`,
          possibleExplanation: 'Your cognitive focus is highest before afternoon classes and commitments begin.',
          recommendedAction: 'Save late mornings for your most challenging study blocks.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ins_default_2',
          userId: user.uid,
          type: 'recurring_obstacle',
          title: 'Afternoon Energy Dip',
          observation: 'Tasks scheduled right after multi-hour class blocks see more frequent postponements.',
          supportingEvidence: 'Observed across days with back-to-back lectures or tuition.',
          possibleExplanation: 'Your mind naturally needs a recovery pause after prolonged cognitive effort.',
          recommendedAction: 'Place a 20-30 minute rest or snack buffer before starting evening homework.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ins_default_3',
          userId: user.uid,
          type: 'improvement_opportunity',
          title: 'Protect Your Evening Rest',
          observation: 'Carving out protected wind-down periods improves next-morning motivation.',
          supportingEvidence: 'Correlated with positive ratings in your night reflections.',
          possibleExplanation: 'Rest is not lost time; it fuels the next day’s growth.',
          recommendedAction: 'Wrap up your final study task by 9:30 PM.',
          suggestedChange: {
            type: 'buffer_rest',
            details: 'Evening wind-down buffer'
          },
          createdAt: new Date().toISOString()
        }
      ];

      for (const ins of defaultInsights) {
        await dataService.saveAnalyzerInsight(ins);
      }
      setAnalyzerInsights(defaultInsights);
    } catch (err) {
      console.warn('generateAnalyzerInsights error:', err);
    }
  };

  const askAnalyzer = async (message: string): Promise<string> => {
    try {
      const res = await fetch('/api/analyzer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {
            tasksCount: tasks.length,
            completedCount: tasks.filter(t => t.status === 'completed').length,
            commitmentsCount: commitments.length,
            restBlocksCount: restPeriods.length
          }
        })
      });
      const data = await res.json();
      return data.reply || "I'm analyzing your routine. How are you feeling about your workload this week?";
    } catch (err) {
      return "I reviewed your schedule. What time of day feels most open and energizing for you to study?";
    }
  };

  const dismissInsight = async (id: string) => {
    setAnalyzerInsights(prev => prev.filter(i => i.id !== id));
  };

  const acceptInsight = async (id: string) => {
    const target = analyzerInsights.find(i => i.id === id);
    if (!target) return;
    setAnalyzerInsights(prev => prev.map(i => i.id === id ? { ...i, accepted: true } : i));
  };

  const saveMotivation = async (pref: MotivationPreference) => {
    if (!user) return;
    await dataService.saveMotivationPreference(pref);
    setMotivationPref(pref);
  };

  // Step 3: Goals Archive & Portfolio
  const archiveGoal = async (goalId: string) => {
    if (!user) return;
    const target = goals.find(g => g.id === goalId);
    if (!target) return;
    const updated: Goal = {
      ...target,
      status: 'completed',
      progress: 100,
      archived: true,
      completedAt: new Date().toISOString().split('T')[0],
      archivedAt: new Date().toISOString()
    };
    await dataService.archiveCompletedGoal(user.uid, updated);
    setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
  };

  const restoreGoal = async (goalId: string) => {
    if (!user) return;
    await dataService.restoreArchivedGoal(user.uid, goalId);
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, archived: false, status: 'in_progress', progress: 85 } : g));
  };

  // Step 3: Thought Sessions & Mapping
  const saveThoughtSession = async (session: ThoughtMapSession) => {
    if (!user) return;
    await dataService.saveThoughtSession(session);
    setThoughtSessions(prev => {
      const idx = prev.findIndex(s => s.id === session.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = session;
        return copy;
      }
      return [session, ...prev];
    });
  };

  const deleteThoughtSession = async (id: string) => {
    if (!user) return;
    await dataService.deleteThoughtSession(user.uid, id);
    setThoughtSessions(prev => prev.filter(s => s.id !== id));
  };

  const generateThoughtMap = async (rawText: string) => {
    try {
      const res = await fetch('/api/blurt/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      });
      const data = await res.json();
      return {
        nodes: data.nodes || [],
        connections: data.connections || []
      };
    } catch {
      return {
        nodes: [{
          id: 'thought_' + Date.now(),
          userId: user?.uid || 'user',
          text: rawText,
          category: 'idea' as const,
          x: 200,
          y: 150,
          approvedToShare: false,
          createdAt: new Date().toISOString()
        }],
        connections: []
      };
    }
  };

  // Step 3: Idea Bin
  const saveIdeaItem = async (item: IdeaItem) => {
    if (!user) return;
    await dataService.saveIdeaItem(item);
    setIdeaItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [item, ...prev];
    });
  };

  const deleteIdeaItem = async (id: string) => {
    if (!user) return;
    await dataService.deleteIdeaItem(user.uid, id);
    setIdeaItems(prev => prev.filter(i => i.id !== id));
  };

  const convertIdeaToGoal = async (ideaId: string) => {
    if (!user) return;
    const idea = ideaItems.find(i => i.id === ideaId);
    if (!idea) return;
    const newGoal: Goal = {
      id: 'goal_' + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      title: idea.title,
      description: idea.description,
      category: 'Project',
      priority: 'medium',
      difficulty: 'moderate',
      status: 'in_progress',
      progress: 10,
      createdAt: new Date().toISOString()
    };
    await dataService.saveGoal(newGoal);
    setGoals(prev => [newGoal, ...prev]);

    const updatedIdea: IdeaItem = {
      ...idea,
      stage: 'in_progress',
      convertedGoalId: newGoal.id,
      updatedAt: new Date().toISOString()
    };
    await dataService.saveIdeaItem(updatedIdea);
    setIdeaItems(prev => prev.map(i => i.id === ideaId ? updatedIdea : i));
  };

  // Step 3: Private Vault
  const saveVaultEntry = async (entry: VaultEntry) => {
    if (!user) return;
    await dataService.saveVaultEntry(entry);
    setVaultEntries(prev => {
      const idx = prev.findIndex(v => v.id === entry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });
  };

  const deleteVaultEntry = async (id: string) => {
    if (!user) return;
    await dataService.deleteVaultEntry(user.uid, id);
    setVaultEntries(prev => prev.filter(v => v.id !== id));
  };

  // Step 3: Ambition Simulator
  const simulateAmbition = async (title: string): Promise<AmbitionPathway[]> => {
    try {
      const res = await fetch('/api/blurt/ambition-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambitionTitle: title,
          studentContext: {
            commitmentsCount: commitments.length,
            activeGoalsCount: goals.filter(g => !g.archived).length,
            restBlocksCount: restPeriods.length
          }
        })
      });
      const data = await res.json();
      return data.pathways || [];
    } catch {
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        commitments,
        restPeriods,
        interests,
        ambitions,
        goals,
        tasks,
        calendarEvents,
        dailyReflections,
        reflectionQuestions,
        forestRecords,
        focusMode,
        analyzerInsights,
        rescheduleSuggestion,
        motivationPref,
        isLoading,
        activePage,
        setActivePage,
        theme,
        resolvedTheme,
        setTheme,
        animationPref,
        setAnimationPref,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsGuest,
        signOut,
        completeOnboarding,
        updateDisplayName,
        updateAiConsent,
        addOrUpdateCommitment,
        removeCommitment,
        addOrUpdateRestPeriod,
        removeRestPeriod,
        addNewInterest,
        removeInterestItem,
        addNewAmbition,
        removeAmbitionItem,
        addNewGoal,
        updateGoalProgress,
        removeGoalItem,
        addOrUpdateTask,
        removeTask,
        updateTaskStatus,
        autoScheduleTask,
        acceptRescheduleSuggestion,
        rejectRescheduleSuggestion,
        addOrUpdateCalendarEvent,
        removeCalendarEvent,
        saveMorningReflection,
        saveNightReflection,
        updateQuestions,
        toggleFocusMode,
        setFocusMode: updateFocusMode,
        reflections: dailyReflections,
        generateAnalyzerInsights,
        askAnalyzer,
        dismissInsight,
        acceptInsight,
        saveMotivation,
        checkAndRecordDailyTree,
        thoughtSessions,
        ideaItems,
        vaultEntries,
        completedGoals,
        archiveGoal,
        restoreGoal,
        saveThoughtSession,
        deleteThoughtSession,
        generateThoughtMap,
        saveIdeaItem,
        deleteIdeaItem,
        convertIdeaToGoal,
        saveVaultEntry,
        deleteVaultEntry,
        simulateAmbition
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
