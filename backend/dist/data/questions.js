"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEME_CHAIN_PROMPTS = exports.QUESTIONS = void 0;
exports.QUESTIONS = [
    // ── Standard ──
    { type: 'standard', template: 'If {player} suddenly became a billionaire tomorrow, what is the first stupid thing they would buy?' },
    { type: 'standard', template: "What's {player}'s worst idea for a theme party?" },
    { type: 'standard', template: 'If {player} wrote a self-help book, what ridiculous advice would it contain?' },
    { type: 'standard', template: "What's the most embarrassing thing {player} would pin on their fridge?" },
    { type: 'standard', template: 'If {player} opened a restaurant, what would the strangest menu item be?' },
    { type: 'standard', template: "What's {player}'s secret talent that they would never admit to?" },
    { type: 'standard', template: 'If {player} were a superhero, what would their most useless superpower be?' },
    { type: 'standard', template: 'What would {player} do if they were invisible for 24 hours?' },
    // ── Caption ──
    { type: 'caption', template: '{player} accidentally sent a message to the wrong person. The message said: ______' },
    { type: 'caption', template: '{player} posted a story at 3 AM. The caption was: ______' },
    // ── Future ──
    { type: 'future', template: '10 years from now, {player} will be famous for ______' },
    { type: 'future', template: 'In 2035, {player} will win an award for ______' },
    // ── Excuse ──
    { type: 'excuse', template: "{player} didn't show up to work today because ______" },
    { type: 'excuse', template: '{player} was 3 hours late to the party because ______' },
    // ── Prediction ──
    { type: 'prediction', template: "What is {player}'s most used excuse for being late?" },
    { type: 'prediction', template: "What will be {player}'s next impulse purchase?" },
    // ── Secret Word ──
    { type: 'secret_word', template: 'Describe {player} in ONE word' },
    // ── Double ({player1} + {player2}) ──
    { type: 'double', template: 'If {player1} and {player2} started a company together, what would the company accidentally do wrong?' },
    { type: 'double', template: 'If {player1} and {player2} were stuck on a deserted island, what would they argue about first?' },
    // ── Most Likely (no target) ──
    { type: 'most_likely', template: 'Who is most likely to survive a zombie apocalypse?' },
    { type: 'most_likely', template: 'Who is most likely to accidentally become famous?' },
    { type: 'most_likely', template: 'Who is most likely to start a cult by accident?' },
    { type: 'most_likely', template: 'Who is most likely to get banned from a country?' },
    // ── Lie Detection ──
    { type: 'lie_detection', template: "What's the most embarrassing thing that has happened to {player}?" },
    { type: 'lie_detection', template: "What's {player}'s guilty pleasure that nobody knows about?" },
    { type: 'lie_detection', template: "What's the weirdest thing {player} has ever done alone?" },
    // ── Compliment ──
    { type: 'compliment', template: "What's something secretly impressive about {player}?" },
    { type: 'compliment', template: "What's the best quality about {player} that they don't realize?" },
    // ── Secret Phrase ──
    { type: 'secret_phrase', template: 'If {player} had to give a TED talk, what would the topic be?' },
    { type: 'secret_phrase', template: 'What would {player} be doing if money was no object?' },
];
exports.MEME_CHAIN_PROMPTS = [
    '{player} started a startup that sells...',
    '{player} opened a theme park called...',
    '{player} wrote a movie script about...',
    "The world ended and {player}'s first business idea was...",
];
