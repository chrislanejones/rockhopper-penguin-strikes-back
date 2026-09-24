import { office } from '../state/store'

/** One line on the strip. No `who` is narration. */
interface Line {
  who?: 'you' | 'him'
  text: string
}

/**
 * What the two of them say in the car, one exchange a ride, in turn. It goes
 * along the bottom of the screen on the same strip everything else she says
 * does, a line at a time, with who is talking in front of it.
 */
const TALKS: Line[][] = [
  [
    { text: 'He does not look up from the panel. Nobody does, in here.' },
    { who: 'you', text: 'Thirty seconds of your time?' },
    { who: 'him', text: 'I have until fourteen.' },
    { who: 'you', text: 'This car does not go to fourteen.' },
    { who: 'him', text: 'Then take a minute.' },
    { who: 'you', text: 'I find keys. I open safes. I make the gala by six-thirty.' },
    { who: 'him', text: 'Put that on a card. Nobody on 23 makes the gala.' },
  ],
  [
    { text: 'Same man. Same finger on 14.' },
    { who: 'you', text: 'They say the Thames is high this week.' },
    { who: 'him', text: 'Only below the bridge.' },
    { who: 'you', text: 'So you are my contact.' },
    { who: 'him', text: 'I am waiting for fourteen.' },
    { who: 'you', text: 'Nothing goes to fourteen.' },
    { who: 'him', text: 'Then I am your contact.' },
  ],
  [
    { text: 'He has not moved an inch since the last ride.' },
    { who: 'you', text: "Settle something. The men's room on 23." },
    { who: 'him', text: 'Do not go in there.' },
    { who: 'you', text: 'Too late.' },
    { who: 'him', text: 'Then you know why I ride the lift all day.' },
    { who: 'you', text: 'Waiting for fourteen?' },
    { who: 'him', text: 'Fourteen has a lock on the door. And soap.' },
  ],
]

/** The next exchange. Moves on once one has started, so a step in and straight out does not use one up. */
let talk = 0

/** How long a line stays up: long enough to read it twice. */
const readFor = (text: string) => Math.min(5200, Math.max(2400, 1300 + text.length * 55))
/** The strip goes down between lines, so a new speaker reads as a new line. */
const GAP = 350
/** A beat after she steps in before anyone talks. */
const LEAD = 900

/**
 * Start the next exchange on the strip. Returns what stops it: the timers
 * go, and the line that is up comes down, so a pressed button or a step out
 * of the car ends the conversation mid-sentence, the way it would.
 */
export function startTalk(): () => void {
  const lines = TALKS[talk % TALKS.length]
  const timers: ReturnType<typeof setTimeout>[] = []
  let said = ''
  let at = LEAD
  for (const l of lines) {
    const ms = readFor(l.text)
    timers.push(
      setTimeout(() => {
        if (!said) talk++
        said = l.text
        office().showHint(l.text, ms, l.who)
      }, at),
    )
    at += ms + GAP
  }
  return () => {
    timers.forEach(clearTimeout)
    if (said) office().clearHint(said)
  }
}
