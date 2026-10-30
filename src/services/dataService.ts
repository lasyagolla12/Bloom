import { 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  OperationType, 
  handleFirestoreError 
} from '../lib/firebase';
import { 
  UserProfile, 
  WeeklyCommitment, 
  RestPeriod, 
  Interest, 
  Ambition, 
  Goal, 
  MotivationPreference,
  DailyTask,
  CalendarEvent,
  DailyReflection,
  DailyReflectionQuestion,
  GrowthTreeRecord,
  AnalyzerInsight,
  FocusModeSettings,
  RescheduleSuggestion,
  DayOfWeek,
  ThoughtMapSession,
  ThoughtBubble,
  IdeaItem,
  VaultEntry
} from '../types';

const LOCAL_STORAGE_PREFIX = 'bloom_app_';

// Helper for local storage resilience
function getLocalItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage write skipped:', err);
  }
}

// User Profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      setLocalItem(`profile_${userId}`, data);
      return data;
    }
    return getLocalItem<UserProfile>(`profile_${userId}`);
  } catch (error) {
    return getLocalItem<UserProfile>(`profile_${userId}`);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  setLocalItem(`profile_${profile.userId}`, profile);
  try {
    await setDoc(doc(db, 'users', profile.userId), {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore saveUserProfile fallback:', error);
  }
}

// Weekly Commitments
export async function getWeeklyCommitments(userId: string): Promise<WeeklyCommitment[]> {
  try {
    const colRef = collection(db, 'users', userId, 'commitments');
    const snap = await getDocs(colRef);
    const list: WeeklyCommitment[] = [];
    snap.forEach((d) => list.push(d.data() as WeeklyCommitment));
    setLocalItem(`commitments_${userId}`, list);
    return list;
  } catch (error) {
    return getLocalItem<WeeklyCommitment[]>(`commitments_${userId}`) || [];
  }
}

export async function saveWeeklyCommitment(commitment: WeeklyCommitment): Promise<void> {
  const userId = commitment.userId;
  const current = getLocalItem<WeeklyCommitment[]>(`commitments_${userId}`) || [];
  const idx = current.findIndex(c => c.id === commitment.id);
  if (idx >= 0) {
    current[idx] = commitment;
  } else {
    current.push(commitment);
  }
  setLocalItem(`commitments_${userId}`, current);

  try {
    await setDoc(doc(db, 'users', userId, 'commitments', commitment.id), commitment, { merge: true });
  } catch (error) {
    console.warn('Firestore saveWeeklyCommitment fallback:', error);
  }
}

export async function deleteWeeklyCommitment(userId: string, commitmentId: string): Promise<void> {
  const current = getLocalItem<WeeklyCommitment[]>(`commitments_${userId}`) || [];
  setLocalItem(`commitments_${userId}`, current.filter(c => c.id !== commitmentId));

  try {
    await deleteDoc(doc(db, 'users', userId, 'commitments', commitmentId));
  } catch (error) {
    console.warn('Firestore deleteWeeklyCommitment fallback:', error);
  }
}

// Protected Rest Periods
export async function getRestPeriods(userId: string): Promise<RestPeriod[]> {
  try {
    const colRef = collection(db, 'users', userId, 'restPeriods');
    const snap = await getDocs(colRef);
    const list: RestPeriod[] = [];
    snap.forEach((d) => list.push(d.data() as RestPeriod));
    setLocalItem(`rest_${userId}`, list);
    return list;
  } catch (error) {
    return getLocalItem<RestPeriod[]>(`rest_${userId}`) || [];
  }
}

export async function saveRestPeriod(restPeriod: RestPeriod): Promise<void> {
  const userId = restPeriod.userId;
  const current = getLocalItem<RestPeriod[]>(`rest_${userId}`) || [];
  const idx = current.findIndex(r => r.id === restPeriod.id);
  if (idx >= 0) {
    current[idx] = restPeriod;
  } else {
    current.push(restPeriod);
  }
  setLocalItem(`rest_${userId}`, current);

  try {
    await setDoc(doc(db, 'users', userId, 'restPeriods', restPeriod.id), restPeriod, { merge: true });
  } catch (error) {
    console.warn('Firestore saveRestPeriod fallback:', error);
  }
}

export async function deleteRestPeriod(userId: string, id: string): Promise<void> {
  const current = getLocalItem<RestPeriod[]>(`rest_${userId}`) || [];
  setLocalItem(`rest_${userId}`, current.filter(r => r.id !== id));

  try {
    await deleteDoc(doc(db, 'users', userId, 'restPeriods', id));
  } catch (error) {
    console.warn('Firestore deleteRestPeriod fallback:', error);
  }
}

// Goals
export async function getGoals(userId: string): Promise<Goal[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'goals'));
    const list: Goal[] = [];
    snap.forEach(d => list.push(d.data() as Goal));
    setLocalItem(`goals_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<Goal[]>(`goals_${userId}`) || [];
  }
}

export async function saveGoal(goal: Goal): Promise<void> {
  const current = getLocalItem<Goal[]>(`goals_${goal.userId}`) || [];
  const idx = current.findIndex(g => g.id === goal.id);
  if (idx >= 0) current[idx] = goal;
  else current.push(goal);
  setLocalItem(`goals_${goal.userId}`, current);

  try {
    await setDoc(doc(db, 'users', goal.userId, 'goals', goal.id), goal, { merge: true });
  } catch (error) {
    console.warn('Firestore saveGoal fallback:', error);
  }
}

export async function deleteGoal(userId: string, id: string): Promise<void> {
  const current = getLocalItem<Goal[]>(`goals_${userId}`) || [];
  setLocalItem(`goals_${userId}`, current.filter(g => g.id !== id));

  try {
    await deleteDoc(doc(db, 'users', userId, 'goals', id));
  } catch (error) {
    console.warn('Firestore deleteGoal fallback:', error);
  }
}

// Daily Tasks
export async function getDailyTasks(userId: string): Promise<DailyTask[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'tasks'));
    const list: DailyTask[] = [];
    snap.forEach(d => list.push(d.data() as DailyTask));
    setLocalItem(`tasks_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<DailyTask[]>(`tasks_${userId}`) || [];
  }
}

export async function saveDailyTask(task: DailyTask): Promise<void> {
  const current = getLocalItem<DailyTask[]>(`tasks_${task.userId}`) || [];
  const idx = current.findIndex(t => t.id === task.id);
  if (idx >= 0) current[idx] = task;
  else current.push(task);
  setLocalItem(`tasks_${task.userId}`, current);

  try {
    await setDoc(doc(db, 'users', task.userId, 'tasks', task.id), task, { merge: true });
  } catch (error) {
    console.warn('Firestore saveDailyTask fallback:', error);
  }
}

export async function deleteDailyTask(userId: string, id: string): Promise<void> {
  const current = getLocalItem<DailyTask[]>(`tasks_${userId}`) || [];
  setLocalItem(`tasks_${userId}`, current.filter(t => t.id !== id));

  try {
    await deleteDoc(doc(db, 'users', userId, 'tasks', id));
  } catch (error) {
    console.warn('Firestore deleteDailyTask fallback:', error);
  }
}

// Calendar Events
export async function getCalendarEvents(userId: string): Promise<CalendarEvent[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'events'));
    const list: CalendarEvent[] = [];
    snap.forEach(d => list.push(d.data() as CalendarEvent));
    setLocalItem(`events_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<CalendarEvent[]>(`events_${userId}`) || [];
  }
}

export async function saveCalendarEvent(event: CalendarEvent): Promise<void> {
  const current = getLocalItem<CalendarEvent[]>(`events_${event.userId}`) || [];
  const idx = current.findIndex(e => e.id === event.id);
  if (idx >= 0) current[idx] = event;
  else current.push(event);
  setLocalItem(`events_${event.userId}`, current);

  try {
    await setDoc(doc(db, 'users', event.userId, 'events', event.id), event, { merge: true });
  } catch (error) {
    console.warn('Firestore saveCalendarEvent fallback:', error);
  }
}

export async function deleteCalendarEvent(userId: string, id: string): Promise<void> {
  const current = getLocalItem<CalendarEvent[]>(`events_${userId}`) || [];
  setLocalItem(`events_${userId}`, current.filter(e => e.id !== id));

  try {
    await deleteDoc(doc(db, 'users', userId, 'events', id));
  } catch (error) {
    console.warn('Firestore deleteCalendarEvent fallback:', error);
  }
}

// Daily Reflections
export async function getDailyReflections(userId: string): Promise<DailyReflection[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'reflections'));
    const list: DailyReflection[] = [];
    snap.forEach(d => list.push(d.data() as DailyReflection));
    setLocalItem(`reflections_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<DailyReflection[]>(`reflections_${userId}`) || [];
  }
}

export async function saveDailyReflection(reflection: DailyReflection): Promise<void> {
  const current = getLocalItem<DailyReflection[]>(`reflections_${reflection.userId}`) || [];
  const idx = current.findIndex(r => r.date === reflection.date);
  if (idx >= 0) current[idx] = reflection;
  else current.push(reflection);
  setLocalItem(`reflections_${reflection.userId}`, current);

  try {
    await setDoc(doc(db, 'users', reflection.userId, 'reflections', reflection.date), reflection, { merge: true });
  } catch (error) {
    console.warn('Firestore saveDailyReflection fallback:', error);
  }
}

// Customizable Reflection Questions
export const DEFAULT_MORNING_QUESTIONS: DailyReflectionQuestion[] = [
  { id: 'q_m_1', type: 'morning', questionText: 'What kind of a day do I aim to have?', order: 0 },
  { id: 'q_m_2', type: 'morning', questionText: 'What goals do I want to finish today?', order: 1 }
];

export const DEFAULT_NIGHT_QUESTIONS: DailyReflectionQuestion[] = [
  { id: 'q_n_1', type: 'night', questionText: 'What went well today that I want to repeat?', order: 0 },
  { id: 'q_n_2', type: 'night', questionText: 'Where did I notice friction today? What was I trying to protect?', order: 1 },
  { id: 'q_n_3', type: 'night', questionText: "How can I avoid today's mistakes from repeating tomorrow?", order: 2 }
];

export async function getReflectionQuestions(userId: string): Promise<DailyReflectionQuestion[]> {
  const cached = getLocalItem<DailyReflectionQuestion[]>(`questions_${userId}`);
  if (cached && cached.length > 0) return cached;
  const initial = [...DEFAULT_MORNING_QUESTIONS, ...DEFAULT_NIGHT_QUESTIONS];
  setLocalItem(`questions_${userId}`, initial);
  return initial;
}

export async function saveReflectionQuestions(userId: string, questions: DailyReflectionQuestion[]): Promise<void> {
  setLocalItem(`questions_${userId}`, questions);
  try {
    await setDoc(doc(db, 'users', userId, 'settings', 'reflection_questions'), { questions }, { merge: true });
  } catch (error) {
    console.warn('Firestore saveReflectionQuestions fallback:', error);
  }
}

// Growth Forest Gallery Records
export async function getForestRecords(userId: string): Promise<GrowthTreeRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'forest'));
    const list: GrowthTreeRecord[] = [];
    snap.forEach(d => list.push(d.data() as GrowthTreeRecord));
    setLocalItem(`forest_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<GrowthTreeRecord[]>(`forest_${userId}`) || [];
  }
}

export async function saveForestRecord(record: GrowthTreeRecord): Promise<void> {
  const current = getLocalItem<GrowthTreeRecord[]>(`forest_${record.userId}`) || [];
  const idx = current.findIndex(f => f.date === record.date);
  if (idx >= 0) current[idx] = record;
  else current.unshift(record);
  setLocalItem(`forest_${record.userId}`, current);

  try {
    await setDoc(doc(db, 'users', record.userId, 'forest', record.date), record, { merge: true });
  } catch (error) {
    console.warn('Firestore saveForestRecord fallback:', error);
  }
}

// Focus Mode Settings
export async function getFocusModeSettings(userId: string): Promise<FocusModeSettings> {
  const cached = getLocalItem<FocusModeSettings>(`focus_${userId}`);
  if (cached) return cached;
  const defaultSettings: FocusModeSettings = {
    enabled: false,
    examOrGoalTitle: 'Midterm Focus Sprint',
    prioritizeAcademicsOnly: true,
    aiScheduleAssistance: true
  };
  setLocalItem(`focus_${userId}`, defaultSettings);
  return defaultSettings;
}

export async function saveFocusModeSettings(userId: string, settings: FocusModeSettings): Promise<void> {
  setLocalItem(`focus_${userId}`, settings);
  try {
    await setDoc(doc(db, 'users', userId, 'settings', 'focus_mode'), settings, { merge: true });
  } catch (error) {
    console.warn('Firestore saveFocusModeSettings fallback:', error);
  }
}

// Analyzer Insights
export async function getAnalyzerInsights(userId: string): Promise<AnalyzerInsight[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'insights'));
    const list: AnalyzerInsight[] = [];
    snap.forEach(d => list.push(d.data() as AnalyzerInsight));
    setLocalItem(`analyzer_insights_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<AnalyzerInsight[]>(`analyzer_insights_${userId}`) || [];
  }
}

export async function saveAnalyzerInsight(insight: AnalyzerInsight): Promise<void> {
  const current = getLocalItem<AnalyzerInsight[]>(`analyzer_insights_${insight.userId}`) || [];
  const idx = current.findIndex(i => i.id === insight.id);
  if (idx >= 0) current[idx] = insight;
  else current.unshift(insight);
  setLocalItem(`analyzer_insights_${insight.userId}`, current);

  try {
    await setDoc(doc(db, 'users', insight.userId, 'insights', insight.id), insight, { merge: true });
  } catch (error) {
    console.warn('Firestore saveAnalyzerInsight fallback:', error);
  }
}

// Intelligent Scheduling Algorithm (Section 6)
export function findRealisticGap(
  targetDate: string,
  durationMinutes: number,
  commitments: WeeklyCommitment[],
  events: CalendarEvent[],
  restPeriods: RestPeriod[]
): { startTime: string; endTime: string } | null {
  const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dateObj = new Date(targetDate + 'T00:00:00');
  const dayOfWeek = dayNames[dateObj.getDay()];

  // Candidate start hours from 08:00 to 20:00 in 30-min increments
  const candidateStarts: string[] = [];
  for (let h = 8; h <= 20; h++) {
    candidateStarts.push(`${String(h).padStart(2, '0')}:00`);
    candidateStarts.push(`${String(h).padStart(2, '0')}:30`);
  }

  // Busy ranges
  const busyRanges: { start: string; end: string }[] = [];

  // Add recurring commitments for this day
  commitments.filter(c => c.days.includes(dayOfWeek)).forEach(c => {
    busyRanges.push({ start: c.startTime, end: c.endTime });
  });

  // Add existing events on this date
  events.filter(e => e.date === targetDate).forEach(e => {
    busyRanges.push({ start: e.startTime, end: e.endTime });
  });

  // Add protected rest blocks for this day
  restPeriods.filter(r => r.days.includes(dayOfWeek) && r.isProtected).forEach(r => {
    busyRanges.push({ start: r.startTime, end: r.endTime });
  });

  // Helper to convert HH:MM to minutes from midnight
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const toTimeString = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  for (const startStr of candidateStarts) {
    const startM = toMinutes(startStr);
    const endM = startM + durationMinutes;
    if (endM > 22 * 60) continue; // Do not schedule past 22:00

    const endStr = toTimeString(endM);

    // Check collision with busy ranges
    const collides = busyRanges.some(range => {
      const rStart = toMinutes(range.start);
      const rEnd = toMinutes(range.end);
      return (startM < rEnd && endM > rStart);
    });

    if (!collides) {
      return { startTime: startStr, endTime: endStr };
    }
  }

  return null;
}

// Generate Reschedule Suggestion for a Not Completed task
export function generateRescheduleSuggestion(
  task: DailyTask,
  commitments: WeeklyCommitment[],
  events: CalendarEvent[],
  restPeriods: RestPeriod[]
): RescheduleSuggestion | null {
  // Try tomorrow, day after tomorrow, etc. (up to 4 days ahead)
  const baseDate = new Date();
  for (let offset = 1; offset <= 4; offset++) {
    const candidateDate = new Date(baseDate);
    candidateDate.setDate(baseDate.getDate() + offset);
    const dateStr = candidateDate.toISOString().split('T')[0];

    const gap = findRealisticGap(
      dateStr,
      task.estimatedDurationMinutes || 45,
      commitments,
      events,
      restPeriods
    );

    if (gap) {
      return {
        taskId: task.id,
        taskTitle: task.title,
        originalDate: task.scheduledDate,
        suggestedDate: dateStr,
        suggestedStartTime: gap.startTime,
        suggestedEndTime: gap.endTime,
        reason: `Open gap identified between protected rest and fixed commitments on ${dateStr} (${gap.startTime}–${gap.endTime}).`,
        status: 'pending'
      };
    }
  }

  return null;
}

// Interests, Ambitions, Motivation from Step 1 preserved
export async function getInterests(userId: string): Promise<Interest[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'interests'));
    const list: Interest[] = [];
    snap.forEach(d => list.push(d.data() as Interest));
    setLocalItem(`interests_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<Interest[]>(`interests_${userId}`) || [];
  }
}

export async function saveInterest(interest: Interest): Promise<void> {
  const current = getLocalItem<Interest[]>(`interests_${interest.userId}`) || [];
  if (!current.some(i => i.id === interest.id)) current.push(interest);
  setLocalItem(`interests_${interest.userId}`, current);
  try {
    await setDoc(doc(db, 'users', interest.userId, 'interests', interest.id), interest, { merge: true });
  } catch (error) {
    console.warn('saveInterest fallback:', error);
  }
}

export async function deleteInterest(userId: string, id: string): Promise<void> {
  const current = getLocalItem<Interest[]>(`interests_${userId}`) || [];
  setLocalItem(`interests_${userId}`, current.filter(i => i.id !== id));
  try {
    await deleteDoc(doc(db, 'users', userId, 'interests', id));
  } catch (error) {
    console.warn('deleteInterest fallback:', error);
  }
}

export async function getAmbitions(userId: string): Promise<Ambition[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'ambitions'));
    const list: Ambition[] = [];
    snap.forEach(d => list.push(d.data() as Ambition));
    setLocalItem(`ambitions_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<Ambition[]>(`ambitions_${userId}`) || [];
  }
}

export async function saveAmbition(ambition: Ambition): Promise<void> {
  const current = getLocalItem<Ambition[]>(`ambitions_${ambition.userId}`) || [];
  const idx = current.findIndex(a => a.id === ambition.id);
  if (idx >= 0) current[idx] = ambition;
  else current.push(ambition);
  setLocalItem(`ambitions_${ambition.userId}`, current);
  try {
    await setDoc(doc(db, 'users', ambition.userId, 'ambitions', ambition.id), ambition, { merge: true });
  } catch (error) {
    console.warn('saveAmbition fallback:', error);
  }
}

export async function deleteAmbition(userId: string, id: string): Promise<void> {
  const current = getLocalItem<Ambition[]>(`ambitions_${userId}`) || [];
  setLocalItem(`ambitions_${userId}`, current.filter(a => a.id !== id));
  try {
    await deleteDoc(doc(db, 'users', userId, 'ambitions', id));
  } catch (error) {
    console.warn('deleteAmbition fallback:', error);
  }
}

export async function getMotivationPreference(userId: string): Promise<MotivationPreference | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'settings', 'motivation'));
    if (snap.exists()) {
      const data = snap.data() as MotivationPreference;
      setLocalItem(`motivation_${userId}`, data);
      return data;
    }
    return getLocalItem<MotivationPreference>(`motivation_${userId}`);
  } catch {
    return getLocalItem<MotivationPreference>(`motivation_${userId}`);
  }
}

export async function saveMotivationPreference(pref: MotivationPreference): Promise<void> {
  setLocalItem(`motivation_${pref.userId}`, pref);
  try {
    await setDoc(doc(db, 'users', pref.userId, 'settings', 'motivation'), pref, { merge: true });
  } catch (error) {
    console.warn('saveMotivationPreference fallback:', error);
  }
}

// ----------------------------------------------------
// Step 3: Thought Sessions, Idea Items, Vault & Goal Archive
// ----------------------------------------------------

// 1. Thought Map Sessions
export async function getThoughtSessions(userId: string): Promise<ThoughtMapSession[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'thought_sessions'));
    const list: ThoughtMapSession[] = [];
    snap.forEach(d => list.push(d.data() as ThoughtMapSession));
    setLocalItem(`thought_sessions_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<ThoughtMapSession[]>(`thought_sessions_${userId}`) || [];
  }
}

export async function saveThoughtSession(session: ThoughtMapSession): Promise<void> {
  const current = getLocalItem<ThoughtMapSession[]>(`thought_sessions_${session.userId}`) || [];
  const idx = current.findIndex(s => s.id === session.id);
  if (idx >= 0) current[idx] = session;
  else current.unshift(session);
  setLocalItem(`thought_sessions_${session.userId}`, current);

  try {
    await setDoc(doc(db, 'users', session.userId, 'thought_sessions', session.id), session, { merge: true });
  } catch (error) {
    console.warn('saveThoughtSession fallback:', error);
  }
}

export async function deleteThoughtSession(userId: string, id: string): Promise<void> {
  const current = getLocalItem<ThoughtMapSession[]>(`thought_sessions_${userId}`) || [];
  setLocalItem(`thought_sessions_${userId}`, current.filter(s => s.id !== id));
  try {
    await deleteDoc(doc(db, 'users', userId, 'thought_sessions', id));
  } catch (error) {
    console.warn('deleteThoughtSession fallback:', error);
  }
}

// 2. Idea Bin Items
export async function getIdeaItems(userId: string): Promise<IdeaItem[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'idea_items'));
    const list: IdeaItem[] = [];
    snap.forEach(d => list.push(d.data() as IdeaItem));
    setLocalItem(`idea_items_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<IdeaItem[]>(`idea_items_${userId}`) || [];
  }
}

export async function saveIdeaItem(item: IdeaItem): Promise<void> {
  const current = getLocalItem<IdeaItem[]>(`idea_items_${item.userId}`) || [];
  const idx = current.findIndex(i => i.id === item.id);
  if (idx >= 0) current[idx] = item;
  else current.unshift(item);
  setLocalItem(`idea_items_${item.userId}`, current);

  try {
    await setDoc(doc(db, 'users', item.userId, 'idea_items', item.id), item, { merge: true });
  } catch (error) {
    console.warn('saveIdeaItem fallback:', error);
  }
}

export async function deleteIdeaItem(userId: string, id: string): Promise<void> {
  const current = getLocalItem<IdeaItem[]>(`idea_items_${userId}`) || [];
  setLocalItem(`idea_items_${userId}`, current.filter(i => i.id !== id));
  try {
    await deleteDoc(doc(db, 'users', userId, 'idea_items', id));
  } catch (error) {
    console.warn('deleteIdeaItem fallback:', error);
  }
}

// 3. Encrypted Private Vault Entries
export async function getVaultEntries(userId: string): Promise<VaultEntry[]> {
  try {
    const snap = await getDocs(collection(db, 'users', userId, 'vault_entries'));
    const list: VaultEntry[] = [];
    snap.forEach(d => list.push(d.data() as VaultEntry));
    setLocalItem(`vault_entries_${userId}`, list);
    return list;
  } catch {
    return getLocalItem<VaultEntry[]>(`vault_entries_${userId}`) || [];
  }
}

export async function saveVaultEntry(entry: VaultEntry): Promise<void> {
  const current = getLocalItem<VaultEntry[]>(`vault_entries_${entry.userId}`) || [];
  const idx = current.findIndex(v => v.id === entry.id);
  if (idx >= 0) current[idx] = entry;
  else current.unshift(entry);
  setLocalItem(`vault_entries_${entry.userId}`, current);

  try {
    await setDoc(doc(db, 'users', entry.userId, 'vault_entries', entry.id), entry, { merge: true });
  } catch (error) {
    console.warn('saveVaultEntry fallback:', error);
  }
}

export async function deleteVaultEntry(userId: string, id: string): Promise<void> {
  const current = getLocalItem<VaultEntry[]>(`vault_entries_${userId}`) || [];
  setLocalItem(`vault_entries_${userId}`, current.filter(v => v.id !== id));
  try {
    await deleteDoc(doc(db, 'users', userId, 'vault_entries', id));
  } catch (error) {
    console.warn('deleteVaultEntry fallback:', error);
  }
}

// 4. Archive Goal to Completed Portfolio
export async function archiveCompletedGoal(userId: string, goal: Goal): Promise<void> {
  const updatedGoal: Goal = {
    ...goal,
    status: 'completed',
    progress: 100,
    archived: true,
    completedAt: goal.completedAt || new Date().toISOString().split('T')[0],
    archivedAt: new Date().toISOString()
  };

  // Update in local goals list
  const current = getLocalItem<Goal[]>(`goals_${userId}`) || [];
  const idx = current.findIndex(g => g.id === goal.id);
  if (idx >= 0) current[idx] = updatedGoal;
  else current.push(updatedGoal);
  setLocalItem(`goals_${userId}`, current);

  try {
    await setDoc(doc(db, 'users', userId, 'goals', goal.id), updatedGoal, { merge: true });
  } catch (error) {
    console.warn('archiveCompletedGoal fallback:', error);
  }
}

export async function restoreArchivedGoal(userId: string, goalId: string): Promise<void> {
  const current = getLocalItem<Goal[]>(`goals_${userId}`) || [];
  const idx = current.findIndex(g => g.id === goalId);
  if (idx >= 0) {
    current[idx].archived = false;
    current[idx].status = 'in_progress';
    current[idx].progress = 90; // restore to active status
    setLocalItem(`goals_${userId}`, current);

    try {
      await setDoc(doc(db, 'users', userId, 'goals', goalId), current[idx], { merge: true });
    } catch (error) {
      console.warn('restoreArchivedGoal fallback:', error);
    }
  }
}

