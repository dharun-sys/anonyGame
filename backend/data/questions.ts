export type RoundType =
  | 'standard'
  | 'caption'
  | 'future'
  | 'excuse'
  | 'prediction'
  | 'secret_word'
  | 'double'
  | 'most_likely'
  | 'lie_detection'
  | 'compliment'
  | 'secret_phrase';

export interface QuestionTemplate {
  type: RoundType;
  template: string;
}

export const QUESTIONS: QuestionTemplate[] = [
    // ── More Standard (chaotic / adult humor) ──
  { type: 'standard', template: 'What illegal side hustle would {player} definitely try if nobody could catch them?' },
  { type: 'standard', template: 'If {player} got famous overnight, what embarrassing old post would resurface?' },
  { type: 'standard', template: 'What weird thing would {player} spend way too much money on?' },
  { type: 'standard', template: 'What terrible life advice would {player} give confidently?' },
  { type: 'standard', template: 'If {player} ran a country, what completely useless law would they pass?' },
  { type: 'standard', template: 'What would {player} absolutely do if they knew nobody would ever find out?' },
  { type: 'standard', template: 'What strange thing would {player} secretly be obsessed with?' },
  { type: 'standard', template: 'What terrible reality show would {player} accidentally win?' },
  { type: 'standard', template: 'What would {player} get arrested for in the most ridiculous way?' },

  // ── Caption (awkward / chaotic moments) ──
  { type: 'caption', template: '{player} was caught sneaking out at 2 AM. The excuse text message reads: ______' },
  { type: 'caption', template: '{player} accidentally sent a voice note to the family group. It said: ______' },
  { type: 'caption', template: '{player} got caught staring at their phone during an important moment. The message on screen: ______' },
  { type: 'caption', template: '{player} posted a very questionable selfie. The caption reads: ______' },
  { type: 'caption', template: '{player} accidentally went live on Instagram. The first thing viewers heard was: ______' },
  { type: 'caption', template: '{player} got caught laughing during a serious meeting. The reason was: ______' },

  // ── Future (absurd futures) ──
  { type: 'future', template: 'In 2040, {player} will somehow become famous for ______' },
  { type: 'future', template: 'In the future, {player} will be banned from ______' },
  { type: 'future', template: 'The documentary about {player} will be titled ______' },
  { type: 'future', template: 'Years later, people will remember {player} as the person who ______' },
  { type: 'future', template: 'One day {player} will accidentally become the CEO of ______' },

  // ── Excuse (awkward / suspicious excuses) ──
  { type: 'excuse', template: '{player} left the party suddenly because ______' },
  { type: 'excuse', template: '{player} avoided answering their phone because ______' },
  { type: 'excuse', template: '{player} cancelled plans last minute because ______' },
  { type: 'excuse', template: '{player} disappeared for 4 hours because ______' },
  { type: 'excuse', template: '{player} came back home looking suspicious because ______' },

  // ── Prediction (fun guessing prompts) ──
  { type: 'prediction', template: "What is {player}'s biggest red flag?" },
  { type: 'prediction', template: "What's {player}'s most embarrassing habit?" },
  { type: 'prediction', template: "What's something {player} pretends to understand but actually doesn't?" },
  { type: 'prediction', template: "What's the weirdest thing {player} would buy online?" },
  { type: 'prediction', template: "What's something {player} would absolutely lie about on a date?" },

  // ── Secret Word (funny descriptors) ──
  { type: 'secret_word', template: 'What animal best represents {player}?' },
  { type: 'secret_word', template: 'What vibe does {player} give off?' },

  // ── Double (two-player chaos) ──
  { type: 'double', template: 'If {player1} and {player2} were roommates, what would they fight about every day?' },
  { type: 'double', template: 'If {player1} and {player2} started a podcast, what terrible topic would it be about?' },
  { type: 'double', template: 'If {player1} and {player2} were criminals together, what crime would they fail at?' },
  { type: 'double', template: 'If {player1} and {player2} opened a nightclub, what would the theme be?' },
  { type: 'double', template: 'If {player1} and {player2} were on a reality show together, what drama would happen first?' },

  // ── Most Likely (group chaos moments) ──
  { type: 'most_likely', template: 'Who is most likely to accidentally text the wrong person something embarrassing?' },
  { type: 'most_likely', template: 'Who is most likely to become famous for something stupid?' },
  { type: 'most_likely', template: 'Who is most likely to forget they are muted during a call?' },
  { type: 'most_likely', template: 'Who is most likely to get kicked out of a club?' },
  { type: 'most_likely', template: 'Who is most likely to send a risky text and regret it immediately?' },

  // ── Lie Detection (awkward confessions) ──
  { type: 'lie_detection', template: "What's the weirdest thing {player} has done when nobody was watching?" },
  { type: 'lie_detection', template: "What's something embarrassing {player} would never admit publicly?" },
  { type: 'lie_detection', template: "What's a secret habit {player} probably has?" },
  { type: 'lie_detection', template: "What's something strange {player} has definitely Googled?" },

  // ── Compliment (fun wholesome balance) ──
  { type: 'compliment', template: "What's something surprisingly cool about {player}?" },
  { type: 'compliment', template: "Why would people secretly enjoy hanging out with {player}?" },
  { type: 'compliment', template: "What's a quality that makes {player} unintentionally funny?" },

  // ── Secret Phrase (absurd ideas) ──
  { type: 'secret_phrase', template: 'If {player} had a secret cult, what would it be called?' },
  { type: 'secret_phrase', template: 'What strange motivational quote would {player} invent?' },
  { type: 'secret_phrase', template: 'What strange rule would exist in {player}\'s imaginary world?' },
  { type: 'secret_phrase', template: 'If {player} wrote a movie about their life, the title would be ______' },
  { type: 'secret_phrase', template: 'If {player} had a secret nickname nobody knows about, it would be ______' }
];

export const MEME_CHAIN_PROMPTS = [
  '{player} started a startup that sells...',
  '{player} opened a theme park called...',
  '{player} wrote a movie script about...',
  "The world ended and {player}'s first business idea was...",
];
