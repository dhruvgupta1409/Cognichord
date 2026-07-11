export interface AtlasEntry {
  key: string;
  name: string;
  oneLiner: string;
  location: string;
  whatItDoes: string;
  neurobiology: string;
  forMusic: string;
  facts: string[];
  sources: string[];
}

export const ATLAS: Record<string, AtlasEntry> = {
  frontal: {
    key: 'frontal',
    name: 'Frontal Lobe',
    oneLiner: 'This is where you decide what to play next, and where you stop yourself from playing the wrong note.',
    location:
      'The front third of your brain, directly behind your forehead. It is the largest lobe and the last part of the brain to fully mature, which does not happen until your mid-20s.',
    whatItDoes:
      'It plans, holds a few things in mind at once, and keeps you on task. When you sight-read, it holds the next bar in working memory while your hands play the current one. When you stop yourself from rushing, that is your frontal lobe applying the brakes.',
    neurobiology:
      'Its prefrontal region runs on dense loops with the rest of the brain and depends heavily on dopamine to keep working memory stable. Neurons here can fire in steady, sustained patterns that hold a piece of information for a few seconds, which is the physical basis of keeping a phrase in your head.',
    forMusic:
      'Early in learning a piece, your frontal lobe works hardest, because every note is a conscious decision. As the piece becomes automatic, it quiets down and hands control to deeper circuits. That handoff is why a well-learned piece feels effortless.',
    facts: [
      'Working memory here holds only about four items at once, which is one reason you learn music in small chunks.',
      'It is the last brain region to finish developing, well into your 20s.',
    ],
    sources: [
      'Miller & Cohen (2001), Annu Rev Neurosci: prefrontal cortex and cognitive control.',
      'Goldman-Rakic (1995), Neuron: working memory in prefrontal cortex.',
      'Cowan (2001), Behav Brain Sci: working-memory capacity of about four items.',
    ],
  },

  motor: {
    key: 'motor',
    name: 'Primary Motor Cortex',
    oneLiner: 'This is where the command to move each finger is actually sent.',
    location:
      'A strip running over the top of your brain from ear to ear, just in front of a deep groove called the central sulcus. Your whole body is mapped along it, an arrangement called the motor homunculus, with a large area given to the hands.',
    whatItDoes:
      'It sends the final movement commands down your spinal cord to your muscles. The more finely you can control a body part, the more cortex is devoted to it, which is why your hands and lips take up so much room on the map.',
    neurobiology:
      'Large pyramidal cells (Betz cells) send long fibers down the corticospinal tract to the spinal cord, some connecting directly onto the motor neurons that drive your muscles (especially for the hands), the rest working through spinal interneurons. Practice reshapes the map: the territory for a trained hand grows larger and more sharply defined.',
    forMusic:
      'In string players, the map for the fingering hand is measurably larger than in non-musicians, and the earlier they started, the larger the difference. Your practice is redrawing this map, one repetition at a time.',
    facts: [
      'A few days of focused practice can already expand the finger area here.',
      'String players show an enlarged left-hand map compared with non-musicians (Elbert, 1995).',
    ],
    sources: [
      'Elbert et al. (1995), Science: increased finger representation in string players.',
      'Penfield & Boldrey (1937): mapping the motor homunculus.',
    ],
  },

  somatosensory: {
    key: 'somatosensory',
    name: 'Somatosensory Cortex',
    oneLiner: 'This is how you feel the keys, strings, or reed without looking.',
    location:
      'A strip just behind the central sulcus, mirroring the motor strip. It uses the same body map, but for touch instead of movement.',
    whatItDoes:
      'It receives touch, pressure, and position sense from your skin and joints. It is how you feel a key\'s edge or a string\'s tension and adjust, often before you even hear a mistake.',
    neurobiology:
      'Neurons here are arranged in columns, each tuned to a small patch of skin. Like the motor map, it is plastic: the fingertip areas of skilled musicians are enlarged and more finely separated than a non-musician\'s.',
    forMusic:
      'Touch closes the feedback loop faster than sound does. Clean technique depends on this map being sharp, which is part of what slow, attentive practice builds.',
    facts: [
      'Braille readers and musicians both show enlarged fingertip maps here.',
      'Degraded, blurred fingertip maps are associated with musician\'s focal dystonia (which is multifactorial, with genetic and other contributors) — one reason attentive, unrushed practice is thought to matter.',
    ],
    sources: [
      'Pascual-Leone (2001), Ann NY Acad Sci: the plastic sensorimotor map.',
      'Byl, Merzenich & Jenkins (1996), Neurology: sensory maps and focal dystonia.',
    ],
  },

  parietal: {
    key: 'parietal',
    name: 'Parietal Lobe',
    oneLiner: 'This turns what you hear and feel into where your hands need to be.',
    location:
      'The upper-back part of your brain, behind the sensory strip. Its lower portion, the inferior parietal lobule, sits at a junction of hearing, touch, and vision.',
    whatItDoes:
      'It builds a single spatial map out of your senses, combining the sound you want, the feel of the instrument, and where your hands are in space. It is especially active when you sight-read.',
    neurobiology:
      'Multisensory neurons here combine inputs from hearing, vision, and touch into one shared spatial frame. It is a hub in the dorsal visual stream, the pathway that guides movement.',
    forMusic:
      'When you glance at a note and your hand goes to the right place without looking down, that translation from symbol to space happens here.',
    facts: [
      'It is engaged when you sight-read, mapping what you see to where your hands move (Sergent, 1992).',
      'It belongs to the dorsal action stream that steers movement through space.',
    ],
    sources: [
      'Sergent et al. (1992), Science: a distributed network for reading and performing music.',
      'Culham & Valyear (2006), Curr Opin Neurobiol: parietal cortex and action.',
    ],
  },

  temporal: {
    key: 'temporal',
    name: 'Temporal Lobe (Auditory Cortex)',
    oneLiner: 'This is where sound becomes music: pitch, timbre, and the note you intended compared with the note you played.',
    location:
      'The lower side of your brain, roughly behind your ear. Its top edge holds the primary auditory cortex (Heschl\'s gyrus), and just behind that sits the planum temporale, a key pitch and language area.',
    whatItDoes:
      'It analyzes pitch, timbre, and rhythm, and constantly compares the sound you are making with the sound you intended. That comparison is the core of playing in tune.',
    neurobiology:
      'Auditory cortex is tonotopic, laid out like a keyboard, with neurons tuned in order from low to high pitch. In musicians, responses to musical tones are stronger, and the region is often physically enlarged.',
    forMusic:
      'A musician\'s auditory-motor loop, which ties hearing tightly to movement, is measurably stronger than a non-musician\'s. Musicians with absolute pitch tend to have a strongly asymmetric planum temporale.',
    facts: [
      'It is laid out like a keyboard, from low pitch to high (tonotopy).',
      'Absolute-pitch musicians show exaggerated planum temporale asymmetry (Schlaug, 1995).',
    ],
    sources: [
      'Zatorre, Chen & Penhune (2007), Nat Rev Neurosci: auditory-motor interactions.',
      'Schlaug et al. (1995), Science: planum temporale asymmetry in musicians.',
    ],
  },

  occipital: {
    key: 'occipital',
    name: 'Occipital Lobe',
    oneLiner: 'This is where the visual work of reading the score begins.',
    location:
      'The very back of your brain. It is given over almost entirely to vision.',
    whatItDoes:
      'It processes everything you see, starting with edges and contrast in the primary visual cortex and building up to whole shapes. When you read music, note-heads and staff positions are decoded here before being passed forward and turned into movement.',
    neurobiology:
      'Primary visual cortex is retinotopic, mapped like your field of view, with neurons tuned to specific line orientations. Reading music recruits it alongside parietal and frontal areas that convert the symbols into actions.',
    forMusic:
      'Fluent sight-reading is fast pattern recognition: you stop reading note by note and start seeing chords and shapes as single units, which is a visual skill built on this cortex.',
    facts: [
      'Neurons here are tuned to specific line orientations (Hubel & Wiesel).',
      'Sight-reading trains you to see a chord as one shape rather than a stack of separate notes.',
    ],
    sources: [
      'Hubel & Wiesel (1962), J Physiol: orientation tuning in visual cortex.',
      'Stewart et al. (2003), Brain: learning to read music.',
    ],
  },

  cerebellum: {
    key: 'cerebellum',
    name: 'Cerebellum',
    oneLiner: 'This makes your timing tight and your movements smooth.',
    location:
      'The dense, tightly folded structure tucked under the back of your brain. It is small, but it holds more neurons than the entire rest of the brain combined.',
    whatItDoes:
      'It fine-tunes the timing and coordination of the movements your cortex plans, and it predicts the feel of a movement so it can correct errors before they build up. It is central to rhythm and to fast, even passages.',
    neurobiology:
      'It learns from a different signal than the reward system does. Climbing fibers from the brainstem deliver an error signal whenever a movement does not match the prediction, and the cerebellum adjusts to reduce that error next time. This is learning from movement error rather than from reward.',
    forMusic:
      'When a scale goes from uneven to even, that is your cerebellum at work. It is also why slow, accurate practice pays off: you are giving it clean examples to smooth out.',
    facts: [
      'It holds roughly 80% of your brain\'s neurons in about 10% of its volume.',
      'It learns from movement error rather than reward, using a system separate from dopamine.',
    ],
    sources: [
      'Ito (2000), Int Rev Neurobiol: the cerebellum and motor learning.',
      'Marr (1969); Albus (1971): the classic theory of cerebellar learning.',
    ],
  },

  brainstem: {
    key: 'brainstem',
    name: 'Brainstem',
    oneLiner: 'This keeps you alert and passes sound up toward the cortex.',
    location:
      'The stalk that connects your brain to your spinal cord. It runs everything you never think about, including breathing, heart rate, and how awake you are.',
    whatItDoes:
      'Beyond keeping you alive, it is an early relay for sound on its way up to the cortex, and its arousal systems set how alert and focused you feel. (A sense of the beat comes mainly from the basal ganglia, cerebellum, and motor cortex, not the brainstem.)',
    neurobiology:
      'Small brainstem nuclei release the brain\'s main neuromodulators, including noradrenaline (from the locus coeruleus) for alertness and mood, and they relay the dopamine and serotonin systems. These chemicals set the level of plasticity, or gain, on learning everywhere else in the brain.',
    forMusic:
      'How alert and engaged you are, which is set largely here, determines how much of a practice session actually lasts. This is why a focused 20 minutes beats a tired hour.',
    facts: [
      'The locus coeruleus is your brain\'s main source of noradrenaline, which sharpens attention.',
      'Sound passes through several brainstem relays before you consciously hear it, and those relays are sharper in musicians.',
    ],
    sources: [
      'Sara (2009), Nat Rev Neurosci: the locus coeruleus and noradrenaline.',
      'Musacchia et al. (2007), PNAS: musicians\' brainstem encoding of sound.',
    ],
  },

  'basal-ganglia': {
    key: 'basal-ganglia',
    name: 'Basal Ganglia',
    oneLiner: 'This is where practice turns into habit, and where a piece starts to play itself.',
    location:
      'A cluster of structures deep in the center of your brain, wrapped around the thalamus. Its main input hub is called the striatum.',
    whatItDoes:
      'It gates your actions. A "Go" pathway pushes a movement through, a "NoGo" pathway holds it back, and the balance between them decides what actually happens. Over many repetitions, it shifts a skill from effortful to automatic.',
    neurobiology:
      'Dopamine is the teacher here. If your attempt turned out better than expected, dopamine neurons fire and strengthen the "Go" pathway for what you just did. If it turned out worse than expected, they pause, and the "NoGo" pathway wins. This dopamine-gated learning is how repetition builds automatic skill.',
    forMusic:
      'The moment a passage stops needing your full attention and simply happens is control passing to your basal ganglia. Because it strengthens whatever you actually did, accurate repetitions matter far more than fast ones.',
    facts: [
      'It reinforces whatever you actually played, so get it right slowly before you get it fast.',
      'Damage here (as in Parkinson\'s disease) makes starting and sequencing movement difficult.',
    ],
    sources: [
      'Schultz (1998), J Neurophysiol: dopamine as a reward-prediction-error signal.',
      'Graybiel (2008), Annu Rev Neurosci: habits and the basal ganglia.',
    ],
  },

  hippocampus: {
    key: 'hippocampus',
    name: 'Hippocampus',
    oneLiner: 'This files new pieces into memory, and replays them while you sleep.',
    location:
      'A pair of curved, seahorse-shaped structures deep in the inner folds of your temporal lobes. Its name is Greek for "seahorse."',
    whatItDoes:
      'It binds the parts of a new experience into a single memory you can consciously recall, including the notes, the fingering, and the room you were in. Early in learning a piece, remembering what comes next depends on the hippocampus.',
    neurobiology:
      'It forms fast, flexible memories and then gradually hands them off to the cortex for long-term storage. During sleep it replays recent experience in fast bursts called sharp-wave ripples, and that replay is thought to support the transfer.',
    forMusic:
      'This is part of why sleep after practice matters. For the memory of the notes and structure, the hippocampus replays recent experience during sleep, which is thought to aid consolidation. (The motor skill itself leans more on cortical and basal-ganglia circuits.)',
    facts: [
      'During sleep it replays recent experience, which is thought to aid memory consolidation.',
      'There is evidence it may keep producing some new neurons in adulthood, though how much this occurs in adult humans is debated.',
    ],
    sources: [
      'Walker et al. (2002), Neuron: sleep and motor-skill consolidation.',
      'Buzsáki (2015), Hippocampus: sharp-wave ripples and memory.',
    ],
  },

  amygdala: {
    key: 'amygdala',
    name: 'Amygdala',
    oneLiner: 'This is why music moves you, and why a recital can make your hands shake.',
    location:
      'A pair of almond-shaped clusters just in front of each hippocampus, deep in the temporal lobes.',
    whatItDoes:
      'It tags experiences with emotion and drives your body\'s response to them, including the thrill of a soaring passage and the racing heart of stage fright. It also makes emotional memories stick harder.',
    neurobiology:
      'It connects tightly to the hippocampus (which is why emotional memories are stronger) and to brainstem systems that trigger the stress response, including adrenaline, a faster heart, and tense muscles. A little of this sharpens you, and too much overwhelms the system.',
    forMusic:
      'Some arousal improves performance, but past a point it takes over and control slips. Learning to stay in that middle range is a real, trainable performance skill rather than only nerves.',
    facts: [
      'Emotional moments are remembered better because the amygdala increases how strongly they are encoded.',
      'The chills you get from a great passage involve emotion and reward circuits firing together.',
    ],
    sources: [
      'Phelps (2004), Curr Opin Neurobiol: the amygdala and emotional memory.',
      'Salimpoor et al. (2011), Nat Neurosci: reward, emotion, and musical chills.',
    ],
  },

  thalamus: {
    key: 'thalamus',
    name: 'Thalamus',
    oneLiner: 'This is the switchboard that every signal passes through to reach your cortex.',
    location:
      'A pair of egg-shaped structures at the very center of your brain, sitting just above the brainstem.',
    whatItDoes:
      'Almost everything you sense, except smell, routes through the thalamus on its way to the cortex. It also relays the outputs of the basal ganglia and cerebellum back up, and it helps decide what gets through and what is filtered out.',
    neurobiology:
      'It is an active relay rather than a passive one. It gates and shapes the traffic, and its loops with the cortex help set your level of attention and arousal. It is a key junction that lets the deep motor circuits influence movement.',
    forMusic:
      'When you tune out a noisy room to lock onto your own playing, thalamic gating is part of how you do it, turning down the irrelevant signals so the important one gets through cleanly.',
    facts: [
      'Every sense except smell is relayed to your cortex through here.',
      'It closes the loops that let deep motor circuits shape and time your movements.',
    ],
    sources: [
      'Sherman (2007), Curr Opin Neurobiol: the thalamus as an active relay.',
      'Alexander, DeLong & Strick (1986), Annu Rev Neurosci: basal ganglia-thalamocortical loops.',
    ],
  },
};
