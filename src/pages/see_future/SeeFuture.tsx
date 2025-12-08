import styles from './SeeFuture.module.css'
import { useMemo, useState } from 'react'

type Components = { cause: string; action: string; internal: string; consequence: string; tone: string }
type CardDef = { id: string; title: string; upright: Components; reversed: Components }
type Pulled = { card: CardDef; reversed: boolean }

const TAROT: CardDef[] = [
  { id: 'algorithm', title: 'The Algorithm', upright: { cause: 'you benefited from something you did not understand', action: 'you accepted the win without asking questions', internal: 'telling yourself this confirms you’re cracked actually', consequence: 'expectations quietly inflated beyond reality', tone: 'for reasons nobody can explain' }, reversed: { cause: 'you tried to game the system', action: 'you leaned into behavior that felt embarrassing even at the time', internal: 'insisting this was “playing smart”', consequence: 'the system adjusted and moved on without you', tone: 'coldly and without apology' } },
  { id: 'overthinker', title: 'The Overthinker', upright: { cause: 'you hesitated longer than the moment allowed', action: 'you replayed the same choice six different ways', internal: 'waiting for the universe to co-sign it', consequence: 'the window closed on its own', tone: 'while you were still thinking' }, reversed: { cause: 'you acted before thinking it through', action: 'you committed immediately and publicly', internal: 'hoping confidence would carry it', consequence: 'the outcome hit faster than expected', tone: 'and stuck around' } },
  { id: 'vibe', title: 'The Vibe', upright: { cause: 'nothing seemed noticeably wrong', action: 'you relaxed into it a little too hard', internal: 'enjoying the calm without questioning it', consequence: 'you missed the part where things shifted', tone: 'quietly' }, reversed: { cause: 'the energy felt cooked from the jump', action: 'you ignored your instincts', internal: 'because dealing with it sounded exhausting', consequence: 'the weirdness escalated anyway', tone: 'on its own schedule' } },
  { id: 'dude', title: 'The Dude', upright: { cause: 'you drifted into a situation unintentionally', action: 'you existed without strategy or thought', internal: 'assuming vibes would carry you', consequence: 'you became part of something accidentally', tone: 'against your will' }, reversed: { cause: 'you tried to be memorable on purpose', action: 'you inserted yourself where you didn’t need to', internal: 'convinced this was adding value', consequence: 'you became the moment people remember differently', tone: 'forever' } },
  { id: 'notification', title: 'The Notification', upright: { cause: 'information arrived that did not matter', action: 'you absorbed it anyway', internal: 'pretending it didn’t affect you', consequence: 'your mood shifted regardless', tone: 'instantly' }, reversed: { cause: 'something important passed you by', action: 'you noticed too late', internal: 'telling yourself it wasn’t a big deal', consequence: 'it became one retroactively', tone: 'obviously' } },
  { id: 'grind', title: 'The Grind', upright: { cause: 'you decided effort was the answer', action: 'you pushed harder instead of smarter', internal: 'feeling productive while going nowhere', consequence: 'exhaustion set in before results', tone: 'predictably' }, reversed: { cause: 'you stopped pushing for once', action: 'you actually rested', internal: 'feeling guilty the entire time', consequence: 'nothing improved emotionally', tone: 'somehow' } },
  { id: 'mirror', title: 'The Mirror', upright: { cause: 'you caught a rare glimpse of yourself objectively', action: 'you acknowledged it briefly', internal: 'proud of the awareness', consequence: 'the moment passed immediately', tone: 'as usual' }, reversed: { cause: 'self-reflection was required', action: 'you avoided it with commitment', internal: 'choosing comfort instead', consequence: 'the same problems remained', tone: 'undefeated' } },
  { id: 'button', title: 'The Button', upright: { cause: 'temptation presented itself', action: 'you pressed it', internal: 'expecting fireworks', consequence: 'absolutely nothing happened', tone: 'anticlimactically' }, reversed: { cause: 'temptation showed up loudly', action: 'you resisted', internal: 'calling it maturity', consequence: 'curiosity lingered anyway', tone: 'forever' } },
  { id: 'exit', title: 'The Exit', upright: { cause: 'the moment peaked', action: 'you almost left on time', internal: 'sensing the timing', consequence: 'you hovered instead', tone: 'for no reason' }, reversed: { cause: 'the moment clearly ended', action: 'you stayed', internal: 'hoping it would recover', consequence: 'it got uncomfortable instead', tone: 'fast' } },
  { id: 'cake', title: 'The Cake 🎂', upright: { cause: 'a celebration occurred', action: 'you participated correctly', internal: 'expecting satisfaction', consequence: 'it underdelivered emotionally', tone: 'every time' }, reversed: { cause: 'indulgence was encouraged', action: 'you leaned into it', internal: 'treating it symbolically', consequence: 'regret crept in later', tone: 'uninvited' } },
  { id: 'text', title: 'The Text', upright: { cause: 'a message arrived', action: 'you reread it obsessively', internal: 'inventing meaning between lines', consequence: 'anxiety filled the gaps', tone: 'immediately' }, reversed: { cause: 'impulse took over', action: 'you sent it instantly', internal: 'confident for half a second', consequence: 'regret landed hard', tone: 'instantly' } },
  { id: 'screenshot', title: 'The Screenshot', upright: { cause: 'a moment felt small', action: 'someone recorded it anyway', internal: 'assuming it was harmless', consequence: 'it became permanent', tone: 'unfortunately' }, reversed: { cause: 'consequences approached', action: 'you deleted evidence', internal: 'believing that solved it', consequence: 'it did not', tone: 'at all' } },
  { id: 'group-chat', title: 'The Group Chat', upright: { cause: 'conversation unfolded without you', action: 'you observed silently', internal: 'unsure if you should speak', consequence: 'it moved on anyway', tone: 'rudely' }, reversed: { cause: 'you had a thought', action: 'you shared it', internal: 'expecting engagement', consequence: 'the vibe dipped', tone: 'noticeably' } },
  { id: 'plan', title: 'The Plan', upright: { cause: 'you prepared carefully', action: 'you followed the plan', internal: 'trusting the structure', consequence: 'it collapsed on contact', tone: 'immediately' }, reversed: { cause: 'planning felt optional', action: 'you winged it', internal: 'hoping adaptability counts', consequence: 'chaos filled the gaps', tone: 'aggressively' } },
  { id: 'wait', title: 'The Wait', upright: { cause: 'action felt inconvenient', action: 'you delayed', internal: 'calling it patience', consequence: 'momentum died quietly', tone: 'slowly' }, reversed: { cause: 'urgency appeared', action: 'you rushed', internal: 'ignoring warning signs', consequence: 'it got weird fast', tone: 'publicly' } },
  { id: 'memory', title: 'The Memory', upright: { cause: 'nostalgia kicked in', action: 'you edited the past generously', internal: 'enjoying the fantasy', consequence: 'reality suffered by comparison', tone: 'unfairly' }, reversed: { cause: 'memory surfaced unfiltered', action: 'you accepted it', internal: 'hating the accuracy', consequence: 'perspective shifted', tone: 'painfully' } },
  { id: 'apology', title: 'The Apology', upright: { cause: 'something needed fixing', action: 'you apologized', internal: 'hoping that closed the ticket', consequence: 'tension lingered anyway', tone: 'awkwardly' }, reversed: { cause: 'accountability approached', action: 'you avoided it', internal: 'assuming time would help', consequence: 'silence replaced resolution', tone: 'loudly' } },
  { id: 'confidence', title: 'The Confidence', upright: { cause: 'good vibes appeared', action: 'you spoke boldly', internal: 'believing in yourself blindly', consequence: 'others went along with it', tone: 'somehow' }, reversed: { cause: 'doubt crept in', action: 'you held back', internal: 'questioning yourself unfairly', consequence: 'opportunity passed', tone: 'politely' } },
  { id: 'loop', title: 'The Loop', upright: { cause: 'the pattern looked familiar', action: 'you repeated it knowingly', internal: 'assuming awareness was enough', consequence: 'the outcome repeated too', tone: 'perfectly' }, reversed: { cause: 'hope appeared', action: 'you told yourself this time was different', internal: 'ignoring history', consequence: 'it wasn’t', tone: 'shockingly' } },
  { id: 'end', title: 'The End', upright: { cause: 'closure felt close', action: 'you relaxed', internal: 'assuming it was finished', consequence: 'loose threads remained', tone: 'annoyingly' }, reversed: { cause: 'an ending was expected', action: 'it didn’t arrive', internal: 'pretending that’s fine', consequence: 'it dragged on silently', tone: 'forever' } },
  { id: 'email', title: 'The Email', upright: { cause: 'a message arrived with unnecessary formality', action: 'rereading it for tone', internal: 'assuming hidden meaning', consequence: 'stress appeared out of nowhere', tone: 'for no reason' }, reversed: { cause: 'professionalism was briefly abandoned', action: 'replying too casually', internal: 'trusting vibes over judgment', consequence: 'regret arrived immediately', tone: 'in real time' } },
  { id: 'reminder', title: 'The Reminder', upright: { cause: 'something was almost forgotten', action: 'being reminded at the worst time', internal: 'pretending appreciation', consequence: 'mood shifted sharply', tone: 'instantly' }, reversed: { cause: 'memory failed quietly', action: 'missing the reminder entirely', internal: 'believing it wasn’t important', consequence: 'consequences surfaced later', tone: 'dramatically' } },
  { id: 'scroll', title: 'The Scroll', upright: { cause: 'boredom struck unexpectedly', action: 'scrolling without purpose', internal: 'chasing stimulation', consequence: 'time disappeared', tone: 'aggressively' }, reversed: { cause: 'stopping felt intentional', action: 'closing the app', internal: 'feeling proud for five seconds', consequence: 'boredom returned worse', tone: 'immediately' } },
  { id: 'playlist', title: 'The Playlist', upright: { cause: 'music aligned too well', action: 'over-identifying with the lyrics', internal: 'romanticizing the moment', consequence: 'emotions escalated unnecessarily', tone: 'loudly' }, reversed: { cause: 'the wrong song played', action: 'letting it continue anyway', internal: 'not wanting to disrupt the mood', consequence: 'irritation lingered', tone: 'quietly' } },
  { id: 'link', title: 'The Link', upright: { cause: 'curiosity was sparked', action: 'clicking without thinking', internal: 'expecting answers', consequence: 'confusion multiplied', tone: 'exponentially' }, reversed: { cause: 'caution appeared briefly', action: 'not clicking', internal: 'wondering what was missed', consequence: 'curiosity persisted', tone: 'overnight' } },
  { id: 'clock', title: 'The Clock', upright: { cause: 'time became noticeable', action: 'watching it pass', internal: 'feeling falsely productive', consequence: 'urgency dissolved', tone: 'slowly' }, reversed: { cause: 'time slipped unnoticed', action: 'losing track entirely', internal: 'assuming plenty remained', consequence: 'panic emerged', tone: 'suddenly' } },
  { id: 'silence', title: 'The Silence', upright: { cause: 'conversation ended naturally', action: 'letting silence sit', internal: 'assuming comfort', consequence: 'tension grew anyway', tone: 'awkwardly' }, reversed: { cause: 'words ran out', action: 'filling space unnecessarily', internal: 'fearing discomfort', consequence: 'regret followed', tone: 'instantly' } },
  { id: 'screenshot-unsent', title: 'The Screenshot (Unsent)', upright: { cause: 'temptation appeared briefly', action: 'saving something for later', internal: 'calling it harmless', consequence: 'temptation lingered', tone: 'patiently' }, reversed: { cause: 'impulse escalated', action: 'sending the screenshot', internal: 'expecting validation', consequence: 'consequences unlocked', tone: 'dramatically' } },
  { id: 'tab', title: 'The Tab', upright: { cause: 'curiosity fractured', action: 'opening another tab', internal: 'believing multitasking helps', consequence: 'focus collapsed', tone: 'immediately' }, reversed: { cause: 'overload approached', action: 'closing everything at once', internal: 'craving control', consequence: 'information loss occurred', tone: 'tragically' } },
  { id: 'drink', title: 'The Drink', upright: { cause: 'celebration blurred judgment', action: 'refilling without thinking', internal: 'feeling socially aligned', consequence: 'filter disappeared', tone: 'rapidly' }, reversed: { cause: 'restraint felt intentional', action: 'stopping early', internal: 'feeling vaguely superior', consequence: 'regret still appeared', tone: 'anyway' } },
  { id: 'laugh', title: 'The Laugh', upright: { cause: 'humor landed unexpectedly', action: 'laughing harder than necessary', internal: 'enjoying connection', consequence: 'volume escalated', tone: 'publicly' }, reversed: { cause: 'joke missed', action: 'laughing anyway', internal: 'wanting inclusion', consequence: 'embarrassment surfaced', tone: 'immediately' } },
  { id: 'delay', title: 'The Delay', upright: { cause: 'response felt optional', action: 'waiting longer than needed', internal: 'calling it strategy', consequence: 'momentum faded', tone: 'quietly' }, reversed: { cause: 'urgency appeared artificial', action: 'responding instantly', internal: 'hoping it mattered', consequence: 'overexposure followed', tone: 'predictably' } },
  { id: 'camera', title: 'The Camera', upright: { cause: 'moment felt important', action: 'capturing it', internal: 'expecting permanence', consequence: 'memory changed shape', tone: 'strangely' }, reversed: { cause: 'attention drifted', action: 'not recording', internal: 'trusting recall', consequence: 'details vanished', tone: 'permanently' } },
  { id: 'seat', title: 'The Seat', upright: { cause: 'opportunity appeared nearby', action: 'taking the spot', internal: 'assuming it was earned', consequence: 'expectations increased', tone: 'instantly' }, reversed: { cause: 'hesitation lingered', action: 'not sitting down', internal: 'avoiding attention', consequence: 'opportunity passed', tone: 'politely' } },
  { id: 'pause', title: 'The Pause', upright: { cause: 'uncertainty surfaced', action: 'stopping briefly', internal: 'assuming clarity would follow', consequence: 'nothing changed', tone: 'notably' }, reversed: { cause: 'momentum overrode judgment', action: 'pushing forward', internal: 'ignoring hesitation', consequence: 'collision occurred', tone: 'audibly' } },
  { id: 'expectation', title: 'The Expectation', upright: { cause: 'hope formed quietly', action: 'building it up', internal: 'trusting optimism', consequence: 'disappointment followed', tone: 'inevitably' }, reversed: { cause: 'expectations were suppressed', action: 'pretending indifference', internal: 'guarding emotions', consequence: 'disappointment arrived anyway', tone: 'efficiently' } },
  { id: 'compliment', title: 'The Compliment', upright: { cause: 'approval surfaced', action: 'accepting it outwardly', internal: 'doubting sincerity', consequence: 'self-confidence wobble occurred', tone: 'briefly' }, reversed: { cause: 'validation appeared', action: 'deflecting it', internal: 'avoiding vulnerability', consequence: 'awkward silence formed', tone: 'immediately' } },
  { id: 'shortcut', title: 'The Shortcut', upright: { cause: 'impatience set in', action: 'taking the faster route', internal: 'expecting efficiency', consequence: 'complications emerged', tone: 'ironically' }, reversed: { cause: 'caution prevailed', action: 'taking the long way', internal: 'valuing stability', consequence: 'time resentment formed', tone: 'slowly' } },
  { id: 'update', title: 'The Update', upright: { cause: 'change appeared mandatory', action: 'accepting it immediately', internal: 'trusting improvement', consequence: 'disappointment followed', tone: 'casually' }, reversed: { cause: 'delay felt sensible', action: 'avoiding the update', internal: 'fearing disruption', consequence: 'incompatibility arose', tone: 'eventually' } },
  { id: 'look', title: 'The Look', upright: { cause: 'attention was felt', action: 'making eye contact', internal: 'interpreting meaning', consequence: 'assumptions formed', tone: 'instantly' }, reversed: { cause: 'awareness spiked', action: 'avoiding eye contact', internal: 'minimizing presence', consequence: 'misunderstanding followed', tone: 'quietly' } },
]

const DESCRIPTIONS: Record<string, string> = {
  'algorithm': 'An unseen system that decides outcomes quietly and without explanation. Rewards and punishments appear at random, then are retroactively treated as destiny. Order exists here, but it is not concerned with fairness.',
  'overthinker': 'A symbol of hesitation, analysis paralysis, and internal debate that outlives its usefulness. Clarity is sought, but momentum rarely survives the review process.',
  'vibe': 'An atmosphere noticed instinctively and interpreted emotionally rather than logically. Signals are present, but their meaning is left comfortably unexamined.',
  'dude': 'Represents pure presence without intention or reflection. Movement occurs without strategy, and participation happens before understanding arrives.',
  'notification': 'A small interruption that carries disproportionate weight. Attention is redirected, whether it was needed or not.',
  'grind': 'Relentless effort fueled by belief rather than results. Progress is implied by motion alone, not by actual change.',
  'mirror': 'A moment of self-awareness that appears briefly and without warning. Reflection is offered, but not guaranteed to be acted upon.',
  'button': 'A test of restraint presented as a minor choice. Pressed or avoided, the button carries consequences that rarely match expectations.',
  'exit': 'The narrow window when departure is still graceful. Stay too long, and the meaning of the moment begins to shift.',
  'cake': 'Celebration, indulgence, and ritualized enjoyment. Sweetness masks expectation, and satisfaction is not guaranteed.',
  'text': 'A message that exists longer in thought than in reality. Meaning multiplies with every reread, often independent of intent.',
  'screenshot': 'An attempt to preserve, protect, or document. What was once fleeting becomes fixed, sometimes against its own nature.',
  'group-chat': 'A collective space where tone matters more than content. Engagement is visible, silence loud, and timing unforgiving.',
  'plan': 'Structure created to create security. Flexible in theory, fragile in practice.',
  'wait': 'A pause that can be wisdom or avoidance depending on perspective. Time moves forward regardless of readiness.',
  'memory': 'A past moment reshaped by time and emotion. Accuracy is optional, but the feelings remain convincing.',
  'apology': 'An effort to repair or resolve. Intention is clear, reception is not.',
  'confidence': 'A surge of certainty that arrives without documentation. Persuasive in tone, shaky in foundation.',
  'loop': 'A familiar pattern repeating under a new justification. Recognition does not guarantee interruption.',
  'end': 'Closure perceived rather than confirmed. Threads remain, even when endings are declared.',
  'email': 'Formality obscuring emotional content. Language is polished, implications are not.',
  'reminder': 'An external prompt that arrives slightly too late or far too early. Memory is assisted without consent.',
  'scroll': 'Endless motion without destination. Time dissolves quietly while attention is redeployed elsewhere.',
  'playlist': 'A sequence of sounds that shapes mood and meaning. Emotion escalates in sync with the beat.',
  'link': 'Curiosity packaged as convenience. Clicking opens more than expected.',
  'clock': 'Awareness of time sharpened by urgency. Moments slip past regardless of observation.',
  'silence': 'An absence louder than words. Meaning fills the gap whether invited or not.',
  'screenshot-unsent': 'Evidence paused mid-action. The impulse remains, unresolved but ready.',
  'tab': 'A fragment of attention left open. Focus diffuses as possibility multiplies.',
  'drink': 'Social lubricants and lowered thresholds. Enjoyment comes first, consequences follow later.',
  'laugh': 'An emotional response that briefly escapes control. Volume and duration outpace intention.',
  'delay': 'A response withheld just long enough to be noticed. Silence gains meaning through timing.',
  'camera': 'An attempt to freeze the moment. Presence changes the instant it is recorded.',
  'seat': 'Proximity granting significance. Position alters perspective, whether desired or not.',
  'pause': 'Stillness introduced without resolution. Movement hesitates, clarity does not arrive.',
  'expectation': 'Hope constructed quietly and reinforced internally. Disappointment emerges not from outcome, but assumption.',
  'compliment': 'Validation offered without instruction. Acceptance and deflection compete simultaneously.',
  'shortcut': 'Efficiency pursued over certainty. Faster paths reveal hidden terrain.',
  'update': 'Change introduced under the guise of improvement. Adaptation becomes mandatory.',
  'look': 'A shared glance loaded with interpretation. Meaning is assigned retroactively.',
}

const ENDINGS = [
  'You already knew this.',
  'This changes nothing.',
  'Many are saying this was preventable.',
  'Do not pull again.',
  'You will learn nothing from this.',
]

function getRecentIds(max = 8): string[] {
  try {
    const raw = localStorage.getItem('tarot_recent')
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.slice(0, max) : []
  } catch { return [] }
}
function setRecentIds(ids: string[], max = 12) {
  try { localStorage.setItem('tarot_recent', JSON.stringify(ids.slice(0, max))) } catch {}
}
function drawThree(): Pulled[] {
  const recent = new Set(getRecentIds())
  const poolPreferred = TAROT.filter(c => !recent.has(c.id))
  const poolFallback = TAROT.filter(c => recent.has(c.id))
  const pool = [...poolPreferred, ...poolFallback]
  const res: Pulled[] = []
  const used = new Set<string>()
  for (let i = 0; i < 3; i++) {
    // pick from preferred if available, ensuring uniqueness
    const available = pool.filter(c => !used.has(c.id))
    const idx = Math.floor(Math.random() * available.length)
    const card = available[idx]
    used.add(card.id)
    const reversed = Math.random() < 0.5
    res.push({ card, reversed })
  }
  // update recent list to reduce immediate repeat pulls across sessions
  const updatedRecent = [...Array.from(used), ...getRecentIds()].filter((v, i, a) => a.indexOf(v) === i)
  setRecentIds(updatedRecent)
  return res
}

const PAST_TEMPLATES = [
  (c:string,a:string,con:string)=>`This started when ${c}, leading you to ${a}, resulting in ${con}.`,
  (c:string,a:string,con:string)=>`It all kicked off because ${c}, so you were ${a}, and then ${con}.`,
  (c:string,a:string,con:string)=>`Somewhere earlier, ${c}. Naturally, you were ${a}, and ${con} followed.`,
  (c:string,a:string,con:string)=>`Believe it or not, this began when ${c}, leading you to ${a}, and ${con}.`,
  (c:string,a:string,con:string)=>`Before you realized anything was happening, ${c}, then you were ${a}, and suddenly ${con}.`,
]
const PRESENT_TEMPLATES = [
  (a:string,i:string)=>`Right now, you are ${a}, while ${i}.`,
  (a:string,i:string)=>`Currently, you’re ${a}, all while ${i}.`,
  (a:string,i:string)=>`At present, you can be found ${a}, confidently ${i}.`,
  (a:string,i:string)=>`Right now, this looks like ${a}, paired with ${i}.`,
  (a:string,i:string)=>`Somehow, in the present moment, you’re ${a}, gently ${i}.`,
]
const FUTURE_TEMPLATES = [
  (conNom:string,t:string)=>`Next, and whether you like it or not, ${conNom} ${futureProgress()}, ${t}.`,
  (conNom:string,t:string)=>`Coming up, ${conNom} ${futureProgress()} — ${t}.`,
  (conNom:string,t:string)=>`Soon, ${conNom} ${futureProgress()}, and it will happen ${t}.`,
  (conNom:string,t:string)=>`From here, ${conNom} ${futureProgress()}, ${t}, and that’s that.`,
  (conNom:string,t:string)=>`The future says ${conNom} ${futureProgress()}, ${t}, don’t ask why.`,
]
const SHORT_INJECTORS = [
  'for no reason anyone can remember',
  'in a way that feels personal',
  'as if the universe is bored',
  'with your full chest',
  'like this was always the plan',
  'loudly, but not helpfully',
  'against all logic',
  'with zero witnesses, somehow',
  'on a weekday',
]
const META_INJECTORS = [
  'This will make sense later. It won’t.',
  'Nobody is stopping this, by the way.',
  'You will explain this poorly afterward.',
  'This is not your fault. It is also your fault.',
  'You will remember this incorrectly.',
]
const HARD_CUTS = [
  'Pause. Sit with that.',
  'Yes, this is still about you.',
  'Anyway.',
]
const rand = (n:number)=>Math.floor(Math.random()*n)
const pick = <T,>(arr:T[])=>arr[rand(arr.length)]
function maybeAppendShort(str:string, p=0.15) { return Math.random()<p ? `${ensureSentence(str)} ${pick(SHORT_INJECTORS)}` : str }
function maybeAppendMeta(str:string, p=0.15) { return Math.random()<p ? `${ensureSentence(str)} ${pick(META_INJECTORS)}` : str }
function maybeHardCut(lines:string[], p=0.05) { if (Math.random()<p) lines.push(pick(HARD_CUTS)) }
function futureProgress() {
  const blurPhrases = ['has technically already begun','is unfolding quietly','has kind of already happened','is halfway done']
  return pick(blurPhrases)
}
function nominalizeConsequence(consequence:string) {
  const s = stripPronouns(consequence).toLowerCase()
  // simple nominalization heuristics
  if (s.includes('tension lingered')) return 'the lingering tension'
  if (s.startsWith('the outcome')) return 'that outcome'
  if (s.includes('regret')) return 'the regret'
  if (s.includes('anxiety')) return 'the anxiety'
  if (s.includes('momentum died')) return 'the lost momentum'
  if (s.includes('window closed')) return 'the closed window'
  return `that ${s}`
}
function addCasualAbsurdity(lines:string[], p=0.25) {
  if (Math.random()<p) lines.push(pick(['someone nearby will be holding a drink','your phone will be face-down','there will be background music, unfortunately','you’ll be mid-sentence']))
}
function maybeContradiction(sentence:string, p=0.2) {
  return Math.random()<p ? `${sentence} ${pick(['This felt unexpected, even though you were waiting for it.','You acted intentionally, without meaning to.'])}` : sentence
}
function formatReading(card: CardDef, reversed: boolean) {
  const raw = reversed ? card.reversed : card.upright
  const comp = normalizeComponents(raw)
  const past = maybeAppendMeta(maybeAppendShort(maybeContradiction(pick(PAST_TEMPLATES)(comp.cause, comp.action, comp.consequence))))
  const present = maybeAppendMeta(maybeAppendShort(pick(PRESENT_TEMPLATES)(comp.action, comp.internal)))
  const future = maybeAppendMeta(maybeAppendShort(pick(FUTURE_TEMPLATES)(nominalizeConsequence(comp.consequence), comp.tone)))
  const lines = [past, present, future]
  // Optional extras at the end only (respect separation)
  const extras: string[] = []
  addCasualAbsurdity(extras)
  maybeHardCut(extras)
  return [...lines, ...extras]
}

// Grammar helpers: remove pronouns, convert action/internal to gerunds, keep cause/consequence in past-tense fragments
function stripPronouns(s: string) {
  return s
    .replace(/^\s*so you\s+/i, '')
    .replace(/^\s*then you\s+/i, '')
    .replace(/^\s*you\s+/i, '')
    .replace(/^\s*you\’re\s+/i, '')
    .replace(/^\s*you\s+are\s+/i, '')
    .trim()
}

function toGerund(phrase: string) {
  const s = stripPronouns(phrase)
  const parts = s.split(/\s+/)
  if (parts.length === 0) return s
  const first = parts[0]
  let g = first
  if (/^[a-z]+ed$/i.test(first)) {
    if (/^[a-z]+ied$/i.test(first)) {
      g = first.replace(/ied$/i, 'ying')
    } else if (/^[a-z]+ed$/i.test(first)) {
      g = first.replace(/ed$/i, 'ing')
    }
  } else if (/^[a-z]+$/i.test(first)) {
    // common irregulars
    const irr: Record<string,string> = {
      'ran': 'running',
      'wrote': 'writing',
      'went': 'going',
      'made': 'making',
      'took': 'taking',
      'gave': 'giving',
      'spoke': 'speaking',
      'said': 'saying',
      'read': 'reading',
      'reread': 'rereading',
      'sent': 'sending',
      'clicked': 'clicking',
      'press': 'pressing',
      'pressed': 'pressing',
      'commit': 'committing',
      'committed': 'committing',
      'stay': 'staying',
      'stayed': 'staying',
      'delete': 'deleting',
      'deleted': 'deleting',
    }
    const lower = first.toLowerCase()
    if (irr[lower]) g = irr[lower]
    else if (/^[a-z]+s$/i.test(first)) {
      g = first.replace(/s$/i, 'ing')
    }
  }
  parts[0] = g
  return parts.join(' ')
}

function normalizeComponents(raw: Components): Components {
  return {
    cause: stripPronouns(raw.cause),
    action: toGerund(raw.action),
    internal: toGerund(raw.internal),
    consequence: stripPronouns(raw.consequence),
    tone: stripPronouns(raw.tone),
  }
}

function ensureSentence(s:string) {
  return /[\.\!\?]$/.test(s) ? s : `${s}.`
}

export default function SeeFuture() {
  const [revealedIdx, setRevealedIdx] = useState<number>(-1)
  const [pull, setPull] = useState<Pulled[]>([])
  const [placed, setPlaced] = useState<boolean>(false)

  const startPull = () => {
    setPull(drawThree())
    setRevealedIdx(-1)
    // trigger place-down animation
    setPlaced(true)
  }

  const revealCard = (i: number) => {
    if (pull.length !== 3) return
    if (i === revealedIdx + 1) setRevealedIdx(i)
  }

  const canShowReset = revealedIdx === 2

  const narrativeSections = useMemo(() => {
    if (pull.length !== 3 || revealedIdx !== 2) return [] as Array<{title:string; lines:string[]}>
    const [past, present, future] = pull
    const sections = [
      { title: `Past — ${past.card.title} ${past.reversed ? '(Reversed)' : ''}`, lines: formatReading(past.card, past.reversed) },
      { title: `Present — ${present.card.title} ${present.reversed ? '(Reversed)' : ''}`, lines: formatReading(present.card, present.reversed) },
      { title: `Future — ${future.card.title} ${future.reversed ? '(Reversed)' : ''}`, lines: formatReading(future.card, future.reversed) },
    ]
    sections.push({ title: '', lines: [pick(ENDINGS)] })
    return sections
  }, [pull, revealedIdx])

  return (
    <section className={styles.container}>
      <div className={styles.wrap}>
        <div className={styles.title}>See your future</div>
        <div className={styles.deck} onClick={startPull} role="button" aria-label="Tarot deck">Click the deck</div>
        {placed && (
          <div className={`${styles.row} ${placed ? styles.rowPlaced : ''}`}>
            {[0,1,2].map((i) => (
              <div key={i} className={`${styles.card} ${revealedIdx >= i ? styles.revealed : ''}`} onClick={() => revealCard(i)} style={{ animationDelay: `${i*140}ms` }}>
                <div className={styles.cardInner}>
                  <div className={`${styles.cardFace} ${styles.cardBack}`}></div>
                  <div className={`${styles.cardFace} ${styles.cardFront}`}>
                    {pull[i] ? (
                      <div className={styles.frontWrap}>
                        <div>
                          <div className={styles.frontTitle}>{pull[i].card.title}</div>
                          {pull[i].reversed && (<div className={styles.frontReversed}>(Reversed)</div>)}
                        </div>
                        <div className={styles.frontBody}>
                          {DESCRIPTIONS[pull[i].card.id] ?? ''}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.frontWrap}>
                        <div className={styles.frontTitle}>Card</div>
                        <div className={styles.frontBody}>Tap to reveal</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className={styles.meta}>
          {revealedIdx === -1 && !placed && (<div>Tap the deck to draw three cards.</div>)}
          {placed && revealedIdx < 2 && (<div>Reveal cards left to right to uncover your reading.</div>)}
        </div>
        {revealedIdx === 2 && (
          <aside className={styles.narrativeOverlay}>
            <div className={styles.narrativeTitle}>Your Brain Rot Prophecy</div>
            <div className={styles.narrativeBody}>
              {narrativeSections.slice(0,3).map((section, i)=> (
                <div key={i} className={styles.narrativeSection}>
                  <div className={styles.narrativeSectionTitle}>{section.title}</div>
                  {section.lines.map((line, j)=> (<div key={j}>{line}</div>))}
                </div>
              ))}
              <div className={styles.narrativeEnding}>{narrativeSections[3]?.lines[0]}</div>
            </div>
          </aside>
        )}
        <div className={styles.buttonRow}>
          <button className={`${canShowReset ? styles.button : styles.hidden}`} onClick={() => { setPull([]); setRevealedIdx(-1); setPlaced(false) }}>Don't like your future?</button>
        </div>
      </div>
    </section>
  )
}
