import type { PracticeSession, CumulativeMetrics } from '../types';
import { REGION_BY_KEY } from '../components/brain/regions';
import { ATLAS } from '../data/brainAtlas';

export type Confidence = 'finding' | 'heuristic';

export interface EngagedSystem {
  key: string;
  regionId: number;
  name: string;
  color: string;
  why: string;
}

export interface Tip {
  title: string;
  body: string;
  confidence: Confidence;
  source: string;
}

const SESSION_SYSTEMS: Record<PracticeSession['sessionType'], { key: string; why: string }[]> = {
  new_piece: [
    { key: 'frontal',      why: 'You held the new notes in mind and planned each move, which is hard, conscious work early on.' },
    { key: 'hippocampus',  why: 'You filed the piece into memory, note by note, to recall later.' },
    { key: 'temporal',     why: 'You listened closely, checking each sound against what you intended to play.' },
    { key: 'motor',        why: 'You sent fresh, deliberate commands to your fingers.' },
  ],
  technique: [
    { key: 'motor',          why: 'Repeating the movement sharpened and expanded its map in your motor cortex.' },
    { key: 'cerebellum',     why: 'You gave your cerebellum clean repetitions to smooth out the timing.' },
    { key: 'somatosensory',  why: 'You built a sharper feel for the keys, strings, or reed under your fingers.' },
  ],
  improvisation: [
    { key: 'frontal',        why: 'You generated new material on the fly, which is a heavy load for your planning cortex.' },
    { key: 'temporal',       why: 'You judged each idea by ear in real time and reacted.' },
    { key: 'basal-ganglia',  why: 'You used already-automatic patterns so your hands could keep up with your ideas.' },
  ],
  memory_recall: [
    { key: 'hippocampus',    why: 'Recalling the piece from memory, rather than reading it, strengthened the memory itself.' },
    { key: 'basal-ganglia',  why: 'You ran the automatic version of the piece, built by earlier repetitions.' },
    { key: 'temporal',       why: 'You checked the recalled sound against your internal model of the piece.' },
  ],
  performance: [
    { key: 'basal-ganglia',  why: 'You ran the piece on automatic, the way a performance requires.' },
    { key: 'motor',          why: 'Your motor cortex executed the well-drilled movements.' },
    { key: 'cerebellum',     why: 'Your cerebellum kept the timing tight under pressure.' },
    { key: 'amygdala',       why: 'Performing raised the emotional stakes, which is the source of both expression and nerves.' },
  ],
};

export function systemsForSession(session: Pick<PracticeSession, 'sessionType'>): EngagedSystem[] {
  const list = SESSION_SYSTEMS[session.sessionType] ?? [];
  return list.map(({ key, why }) => {
    const region = REGION_BY_KEY[key];
    const entry = ATLAS[key];
    return {
      key,
      regionId: region?.id ?? 0,
      name: entry?.name ?? key,
      color: region?.color ?? '#94A3B8',
      why,
    };
  });
}

export interface DeepInsight {
  title: string;
  body: string;
  system: string;
  color: string;
  source: string;
  evidence: Confidence;
}

export function deepInsights(
  session: PracticeSession,
  metrics: CumulativeMetrics,
  allSessions: PracticeSession[],
): DeepInsight[] {
  const out: DeepInsight[] = [];
  const col = (k: string) => REGION_BY_KEY[k]?.color ?? '#94A3B8';
  const sameType = allSessions.filter(s => s.sessionType === session.sessionType).length;
  const familiar = Math.min(1, sameType / 12);
  const hard = session.complexity >= 4;
  const struggled = session.hadFrustration || (session.perceivedProgress ?? 5) <= 2;

  if (session.sessionType === 'technique' || session.sessionType === 'new_piece') {
    out.push(familiar < 0.5 ? {
      title: 'You are still steering by feedback',
      body: 'Early on, each movement is corrected after the fact using what you hear and feel, which is a slow loop that always lags. Every clean repetition trains your cerebellum to build a forward model that predicts the outcome and corrects it before it happens. That predictive control, rather than raw finger speed, is what fluent playing actually is.',
      system: 'cerebellum', color: col('cerebellum'),
      source: 'Wolpert, Miall & Kawato (1998), Trends Cogn Sci.', evidence: 'finding',
    } : {
      title: 'Control is becoming predictive',
      body: 'You have done this enough that your cerebellum can now anticipate the feel of each move and correct it in advance, so you are starting to play ahead of the feedback instead of reacting to it. This is why it feels smoother and less effortful than it did at the start.',
      system: 'cerebellum', color: col('cerebellum'),
      source: 'Wolpert, Miall & Kawato (1998); Shadmehr & Krakauer (2008).', evidence: 'finding',
    });
  }

  if (['technique', 'memory_recall', 'performance'].includes(session.sessionType) && sameType >= 3) {
    out.push({
      title: 'Separate notes are combining into one chunk',
      body: 'With repetition, your basal ganglia binds a run of notes into a single stored chunk, marked at its start and end. Soon you will not trigger the notes one by one. Instead you will launch the whole phrase with one intention, which frees your attention for musicality.',
      system: 'basal-ganglia', color: col('basal-ganglia'),
      source: 'Graybiel (1998); Jin & Costa (2010), Nature.', evidence: 'finding',
    });
  }

  if (hard || struggled) {
    out.push({
      title: 'Why the hard win taught you more',
      body: 'Dopamine signals reward that was better than expected. Playing a passage that felt uncertain and getting it right fires a large prediction-error burst that strengthens the exact movements you just made. An easy, expected success produces little of this signal. This is why difficulty drives learning.',
      system: 'basal-ganglia', color: col('basal-ganglia'),
      source: 'Schultz, Dayan & Montague (1997), Science.', evidence: 'finding',
    });
  }

  if (session.sessionType === 'new_piece' || session.sessionType === 'improvisation') {
    out.push({
      title: 'Your prefrontal cortex is doing the heavy lifting for now',
      body: 'New or improvised material is held in prefrontal working memory, which holds only a handful of items. That is the real bottleneck early on, rather than your fingers. As patterns become familiar, you will group them into chunks and move them to automatic circuits, which frees that scarce attention for phrasing and dynamics.',
      system: 'frontal', color: col('frontal'),
      source: 'Cowan (2001); Chase & Simon (1973) on chunking.', evidence: 'finding',
    });
  }

  if (familiar > 0.4) {
    out.push({
      title: 'The work is moving to a different part of your brain',
      body: 'As this becomes automatic, the work physically shifts from the effortful prefrontal-cortex-and-hippocampus network you started with to the basal ganglia and cerebellum, which run skills without conscious attention. You can watch that shift play out in "Watch your brain learn."',
      system: 'basal-ganglia', color: col('basal-ganglia'),
      source: 'Doyon & Benali (2005); Floyer-Lea & Matthews (2005).', evidence: 'finding',
    });
  }

  return out.slice(0, 3);
}

function daysSinceLast(session: PracticeSession, allSessions: PracticeSession[]): number | null {
  const prior = allSessions
    .filter(s => s.id !== session.id)
    .map(s => new Date(s.date).getTime())
    .filter(t => t <= new Date(session.date).getTime())
    .sort((a, b) => b - a);
  if (prior.length === 0) return null;
  return Math.round((new Date(session.date).getTime() - prior[0]) / 86400000);
}

export function tipsForSession(
  session: PracticeSession,
  metrics: CumulativeMetrics,
  allSessions: PracticeSession[],
): Tip[] {
  const tips: Tip[] = [];
  const gap = daysSinceLast(session, allSessions);

  if ((session.sleepQuality ?? 3) <= 2) {
    tips.push({
      title: 'Get a good night’s sleep before you practice again',
      body: 'You rated your sleep low. A large part of the work of turning today\'s practice into lasting skill happens while you sleep, when your hippocampus replays what you did. A good night can matter as much as the practice itself.',
      confidence: 'finding',
      source: 'Walker et al. (2002), Neuron.',
    });
  } else {
    tips.push({
      title: 'Sleep on it before your next session',
      body: 'Overnight, your brain replays today\'s sequences and moves them toward automatic storage. Skill keeps building during rest, not only during practice, so a night\'s gap is working for you rather than against you.',
      confidence: 'finding',
      source: 'Walker et al. (2002), Neuron; Stickgold (2005), Nature.',
    });
  }

  if (gap === 0 && (metrics.weeklyFrequency ?? 0) >= 6) {
    tips.push({
      title: 'Spread your practice out instead of piling it on',
      body: 'You are practicing very heavily. The same total time spread across more days lasts better than long sessions, because each night of rest secures the gains before the next session builds on them.',
      confidence: 'finding',
      source: 'Cepeda et al. (2006), Psychol Bull.',
    });
  } else if (gap !== null && gap >= 4) {
    tips.push({
      title: `It had been ${gap} days: shorter gaps hold more`,
      body: 'Skill fades a little each day you do not play, so long gaps mean re-covering old ground. A few shorter sessions a week work better than one long one after a break.',
      confidence: 'heuristic',
      source: 'Distributed practice, Cepeda et al. (2006).',
    });
  }

  if (session.complexity >= 4 || session.hadFrustration || (session.perceivedProgress ?? 5) <= 2) {
    tips.push({
      title: 'Slow down until it is right, then let the speed come',
      body: 'When something is hard, play it slowly and correctly. Your basal ganglia strengthens whatever you actually did, so fast-and-wrong only makes the mistake more automatic. Build it correctly, and your cerebellum will speed it up for you.',
      confidence: 'finding',
      source: 'Ericsson et al. (1993); Reynolds & Wickens (2002).',
    });
  }

  if ((session.sessionFocus ?? 5) <= 2) {
    tips.push({
      title: 'Trade some minutes for more focus',
      body: 'You said your focus was low. When you are distracted, the neuromodulators that mark a moment as important stay weak, so less of it lasts. Ten focused minutes usually beat an hour on autopilot.',
      confidence: 'finding',
      source: 'Roelfsema, van Ooyen & Watanabe (2010), Trends Cogn Sci.',
    });
  }

  if (session.complexity <= 2 && metrics.totalSessions >= 8) {
    tips.push({
      title: 'Increase the difficulty a little',
      body: 'Easy material is comfortable, but it is predictable, so it produces little of the error signal that drives new learning. A slightly faster tempo or a harder variation re-engages the system that builds skill.',
      confidence: 'finding',
      source: 'Deliberate practice, Ericsson et al. (1993).',
    });
  }

  if (tips.length < 3) {
    tips.push({
      title: 'Mix it up instead of drilling one thing',
      body: 'Rotating between a few pieces or skills in a session feels harder and looks messier in the moment, but it lasts better, because your brain has to rebuild the plan each time instead of coasting.',
      confidence: 'finding',
      source: 'Contextual interference, Shea & Morgan (1979).',
    });
  }

  return tips.slice(0, 4);
}
