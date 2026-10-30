import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on server side with required aistudio-build user agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. AI Analyzer Insights Generation API (Simplified, Friendly, 3 Sections)
app.post('/api/analyzer/generate', async (req, res) => {
  try {
    const { permittedData } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        fallback: true,
        biggestPattern: {
          title: "Late morning focus is your sweet spot",
          observation: "You seem to get the most done between 10:00 AM and 1:00 PM before your afternoon commitments start. Planning your hardest study sessions during this window gives you great momentum.",
          whySeeingThis: "Your completed tasks consistently cluster before 1:00 PM, while afternoon sessions show more frequent rescheduling."
        },
        recurringObstacle: {
          title: "Fatigue after back-to-back classes",
          obstacle: "Tasks scheduled right after long school or tuition blocks often get delayed. Your brain is asking for recovery time before diving back into work.",
          whySeeingThis: "Postponed tasks occur 2x more often within 45 minutes of a scheduled class ending."
        },
        practicalSuggestions: [
          {
            id: "sug_1",
            title: "Add a 30-minute decompression buffer",
            suggestion: "Take a real break after your classes—grab a snack or stretch before starting your evening study session.",
            whySeeingThis: "Giving yourself recovery time prevents decision fatigue and protects your evening focus.",
            actionType: "buffer_rest"
          },
          {
            id: "sug_2",
            title: "Split larger tasks into 25-minute bites",
            suggestion: "When tackling a big chapter or project, break it into smaller milestones so it feels less daunting to begin.",
            whySeeingThis: "Tasks estimated over 60 minutes are postponed more frequently than 30-minute blocks.",
            actionType: "break_down"
          }
        ]
      });
    }

    const systemPrompt = `You are Bloom's friendly, approachable personal growth guide for a student.
Your task is to analyze real student activity data (daily tasks, commitments, rest periods, morning and night reflections) and generate clear, natural, and encouraging insights.

Tone and style rules:
- Speak like a thoughtful, warm friend who wants to help, NOT a formal productivity auditor.
- Avoid stiff academic headings like "Protective Behaviour" or "Environmental Distractions Affecting Focus".
- Use everyday conversational English.
- Keep each insight concise: approximately 2–3 sentences.
- Never shame the student or sound judgmental about postponed tasks.
- Always distinguish an observation from a possible explanation.
- Provide a brief "whySeeingThis" evidence string that can be revealed on demand.

Output MUST be valid JSON with this exact schema:
{
  "biggestPattern": {
    "title": "short friendly summary",
    "observation": "2-3 natural sentences",
    "whySeeingThis": "1 sentence describing the factual data pattern"
  },
  "recurringObstacle": {
    "title": "short friendly summary",
    "obstacle": "2-3 natural sentences",
    "whySeeingThis": "1 sentence describing the factual data pattern"
  },
  "practicalSuggestions": [
    {
      "id": "sug_1",
      "title": "short actionable title",
      "suggestion": "2 practical sentences",
      "whySeeingThis": "brief supporting reasoning",
      "actionType": "buffer_rest | break_down | reschedule | adjust_duration"
    }
  ]
}`;

    const userPrompt = `Here is the student's permitted activity context:
${JSON.stringify(permittedData || {}, null, 2)}

Synthesize the 3 main sections based strictly on the factual evidence above.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.warn('Gemini Analyzer generation notice:', err?.message);
    return res.status(200).json({
      fallback: true,
      biggestPattern: {
        title: "Building steady daily momentum",
        observation: "You are actively building balanced study habits and protecting your personal rest hours.",
        whySeeingThis: "Based on your active schedule anchors and recorded tasks."
      },
      recurringObstacle: {
        title: "Pacing your afternoon energy",
        obstacle: "Heavy afternoons can lead to evening fatigue. Remember that breaks are part of productive growth.",
        whySeeingThis: "Observed through your daily timeline."
      },
      practicalSuggestions: [
        {
          id: "sug_1",
          title: "Schedule your priority task earlier",
          suggestion: "Try tackling your most important assignment during your first study block of the day.",
          whySeeingThis: "Early task completion builds confidence.",
          actionType: "reschedule"
        }
      ]
    });
  }
});

// 2. Ask the Analyzer Interactive Chat API (Warm, Approachable AI Guide)
app.post('/api/analyzer/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        reply: `I looked at your schedule and reflections. You're balancing ${context?.commitmentsCount || 0} commitments and ${context?.tasksCount || 0} tasks right now! What part of your week feels easiest to get work done, and where do you feel the most friction?`,
      });
    }

    const systemPrompt = `You are Bloom, a warm, friendly, and thoughtful personal growth guide for students.
Your personality:
- You speak like an encouraging, approachable mentor and trusted friend.
- Never sound robotic, bureaucratic, or critical.
- Keep responses concise (2-4 sentences max), conversational, and focused on one clear point at a time.
- Ask a caring, relevant follow-up question.
- Emphasize sustainable well-being and rest (UN SDG 3).
- User context: ${JSON.stringify(context || {}, null, 2)}`;

    const chat = ai.chats.create({
      model: 'gemini-3.8-flash',
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const response = await chat.sendMessage({ message: message || 'Hello' });
    const replyText = response.text || "I'm right here with you. What's on your mind today?";

    return res.json({ reply: replyText });
  } catch (err: any) {
    console.warn('Gemini Chat error:', err?.message);
    return res.json({
      reply: "I'm listening and thinking about your schedule. What feels most important to focus on today?",
    });
  }
});

// 3. Blurt AI Thought Mapping API
app.post('/api/blurt/map', async (req, res) => {
  try {
    const { rawText, existingBubbles } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Deterministic thought extraction fallback
      const sentences = (rawText || '')
        .split(/[.!?\n]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 5);

      const mockNodes = sentences.slice(0, 5).map((sentence: string, idx: number) => {
        let cat: 'goal' | 'ambition' | 'idea' | 'concern' | 'interest' | 'task' = 'idea';
        const lower = sentence.toLowerCase();
        if (lower.includes('want to') || lower.includes('dream') || lower.includes('someday')) cat = 'ambition';
        else if (lower.includes('finish') || lower.includes('due') || lower.includes('need to') || lower.includes('homework')) cat = 'task';
        else if (lower.includes('worried') || lower.includes('stressed') || lower.includes('nervous') || lower.includes('hard')) cat = 'concern';
        else if (lower.includes('aim') || lower.includes('goal') || lower.includes('master')) cat = 'goal';
        else if (lower.includes('love') || lower.includes('passion') || lower.includes('into')) cat = 'interest';

        return {
          id: 'thought_' + Math.random().toString(36).substring(2, 9),
          text: sentence,
          category: cat,
          x: 100 + (idx % 3) * 220,
          y: 80 + Math.floor(idx / 3) * 180,
          approvedToShare: false
        };
      });

      return res.json({
        nodes: mockNodes,
        connections: mockNodes.length > 1 ? [{ fromId: mockNodes[0].id, toId: mockNodes[1].id, label: 'relates to' }] : []
      });
    }

    const systemPrompt = `You are Bloom's Thought Mapping Intelligence.
The student has poured out an unstructured "blurt" (raw stream-of-consciousness, voice brain-dump, or text note).
Your job is to deconstruct this stream into 3 to 6 distinct, structured thought nodes.
Categories for each node MUST be one of:
- "ambition" (long-term aspiration, dream, future project)
- "goal" (specific achievement target or milestone)
- "task" (immediate actionable to-do or chore)
- "concern" (anxiety, stressor, time-pressure, friction)
- "idea" (creative concept, curiosity, experiment)
- "interest" (field of study, hobby, topic)

Rules:
1. Extract concise, human summaries for each node (5-12 words max per node text).
2. Connect related nodes using connections with short labels (e.g. "triggers", "supports", "competes with", "inspired by").
3. Assign rough x, y coordinate positions (between x: 60-600, y: 60-400) so bubbles don't heavily overlap.
4. Output valid JSON:
{
  "nodes": [
    { "text": "...", "category": "ambition|goal|task|concern|idea|interest", "x": 120, "y": 140 }
  ],
  "connections": [
    { "fromIndex": 0, "toIndex": 1, "label": "relates to" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Raw blurt from student:\n"${rawText}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const nodes = (parsed.nodes || []).map((n: any, idx: number) => ({
      id: 'thought_' + Date.now() + '_' + idx,
      text: n.text,
      category: n.category || 'idea',
      x: n.x || (100 + (idx % 3) * 200),
      y: n.y || (80 + Math.floor(idx / 3) * 160),
      approvedToShare: false
    }));

    const connections = (parsed.connections || [])
      .filter((c: any) => nodes[c.fromIndex] && nodes[c.toIndex])
      .map((c: any) => ({
        fromId: nodes[c.fromIndex].id,
        toId: nodes[c.toIndex].id,
        label: c.label || 'connected to'
      }));

    return res.json({ nodes, connections });
  } catch (err: any) {
    console.warn('Blurt mapping error:', err?.message);
    return res.json({
      nodes: [
        {
          id: 'thought_' + Date.now(),
          text: req.body.rawText || 'Spontaneous thought',
          category: 'idea',
          x: 200,
          y: 150,
          approvedToShare: false
        }
      ],
      connections: []
    });
  }
});

// 4. Ambition Simulator API (Generates 2-3 realistic pathways)
app.post('/api/blurt/ambition-simulator', async (req, res) => {
  try {
    const { ambitionTitle, studentContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        pathways: [
          {
            id: 'path_steady',
            ambitionTitle: ambitionTitle || 'Personal Ambition',
            pathwayName: 'Steady Step-by-Step Pathway',
            summary: 'A sustainable approach designed to fit neatly around existing weekly classes and rest periods without causing burnout.',
            steps: [
              { title: 'Foundation & Research', durationWeeks: 3, milestoneTitle: 'Complete initial landscape review & outline' },
              { title: 'Core Skill Development', durationWeeks: 4, milestoneTitle: 'Build foundational project draft or portfolio entry' },
              { title: 'Review & Refinement', durationWeeks: 2, milestoneTitle: 'Share with mentor or peer for feedback' }
            ],
            requiredSkills: ['Self-directed pacing', 'Core subject fundamentals', 'Weekly consistency'],
            estimatedWeeklyHours: 3.5,
            potentialChallenges: ['Midterm exam clashes', 'Initial momentum dip in Week 3'],
            scheduleCompatibility: 'high',
            compatibilityNotes: 'Fits into your existing weekend and free weekday afternoons with 0 impact on protected rest.'
          },
          {
            id: 'path_intensive',
            ambitionTitle: ambitionTitle || 'Personal Ambition',
            pathwayName: 'Focused Sprint Pathway',
            summary: 'An accelerated pathway for holiday breaks or light academic weeks to achieve high results rapidly.',
            steps: [
              { title: 'Intensive Immersion', durationWeeks: 2, milestoneTitle: 'Deep dive into core material' },
              { title: 'Rapid Prototyping', durationWeeks: 2, milestoneTitle: 'Complete MVP or final draft' },
              { title: 'Polish & Launch', durationWeeks: 1, milestoneTitle: 'Publish or present final outcome' }
            ],
            requiredSkills: ['Deep focus blocks', 'Rapid iteration', 'Prioritization'],
            estimatedWeeklyHours: 7,
            potentialChallenges: ['Requires adjusting flexible evening activities', 'Needs disciplined recovery breaks'],
            scheduleCompatibility: 'moderate',
            compatibilityNotes: 'Recommended during school holidays or reading weeks rather than during peak exam schedules.'
          }
        ]
      });
    }

    const systemPrompt = `You are Bloom's Ambition Simulator.
A student wants to explore turning an ambition or dream into reality.
Generate 2 to 3 realistic, well-balanced pathways:
1. "Steady Balanced Pathway" (low weekly stress, fits alongside student commitments)
2. "Focused Sprint Pathway" (faster timeline, higher weekly commitment)
3. "Light Exploratory Pathway" (low-pressure exploratory trial)

For each pathway, provide:
- pathwayName (string)
- summary (2 sentences)
- steps (array of 3-4 steps with title, durationWeeks, milestoneTitle)
- requiredSkills (array of 3 skills)
- estimatedWeeklyHours (number)
- potentialChallenges (array of 2 common obstacles)
- scheduleCompatibility ("high" | "moderate" | "tight")
- compatibilityNotes (1 sentence explaining why this fits or where it might compete)

Output MUST be valid JSON:
{
  "pathways": [
    ...
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Student Ambition: "${ambitionTitle}"\nStudent weekly context:\n${JSON.stringify(studentContext || {}, null, 2)}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const pathways = (parsed.pathways || []).map((p: any, idx: number) => ({
      id: 'path_' + Date.now() + '_' + idx,
      ambitionTitle: ambitionTitle || 'Ambition',
      pathwayName: p.pathwayName || `Pathway ${idx + 1}`,
      summary: p.summary || '',
      steps: p.steps || [],
      requiredSkills: p.requiredSkills || [],
      estimatedWeeklyHours: p.estimatedWeeklyHours || 4,
      potentialChallenges: p.potentialChallenges || [],
      scheduleCompatibility: p.scheduleCompatibility || 'high',
      compatibilityNotes: p.compatibilityNotes || 'Compatible with your schedule.'
    }));

    return res.json({ pathways });
  } catch (err: any) {
    console.warn('Ambition simulator error:', err?.message);
    return res.json({
      pathways: [
        {
          id: 'path_fallback',
          ambitionTitle: req.body.ambitionTitle || 'Ambition',
          pathwayName: 'Practical Discovery Pathway',
          summary: 'A step-by-step pathway crafted to balance academic responsibilities with personal aspiration.',
          steps: [
            { title: 'Initial Exploration', durationWeeks: 2, milestoneTitle: 'Define core project scope' },
            { title: 'Milestone Execution', durationWeeks: 4, milestoneTitle: 'Produce primary deliverable' },
            { title: 'Review & Celebrate', durationWeeks: 1, milestoneTitle: 'Add achievement to Portfolio' }
          ],
          requiredSkills: ['Consistency', 'Curiosity', 'Time management'],
          estimatedWeeklyHours: 3,
          potentialChallenges: ['Balancing with homework', 'Maintaining momentum'],
          scheduleCompatibility: 'high',
          compatibilityNotes: 'Safely protects your sleep and rest hours.'
        }
      ]
    });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bloom Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
