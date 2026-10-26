/**
 * Telugu Transliteration Engine (Bidirectional Telugu ⇄ Romanized English)
 * Allows creators to effortlessly toggle between Native Telugu script and Romanized Telugish.
 */

// Basic phonetic dictionary for common conversational Telugu creator phrases
const COMMON_DICTIONARY = [
  { te: "నమస్కారం", en: "namaskaram" },
  { te: "మీరు", en: "meeru" },
  { te: "ఈ", en: "ee" },
  { te: "రీల్", en: "reel" },
  { te: "వీడియో", en: "video" },
  { te: "చూశారా", en: "chusara" },
  { te: "మనం", en: "manam" },
  { te: "ఒక", en: "oka" },
  { te: "ముఖ్యమైన", en: "mukhyamaina" },
  { te: "విషయం", en: "vishayam" },
  { te: "తెలుసుకుందాం", en: "thelusukundam" },
  { te: "కచ్చితంగా", en: "kachithamga" },
  { te: "సేవ్", en: "save" },
  { te: "చేసుకోండి", en: "chesukondi" },
  { te: "షేర్", en: "share" },
  { te: "చేయండి", en: "cheyandi" },
  { te: "ఫాలో", en: "follow" },
  { te: "అవ్వండి", en: "avvandi" },
  { te: "ఎందుకు", en: "endhuku" },
  { te: "అంటే", en: "ante" },
  { te: "చాలా", en: "chala" },
  { te: "బాగుంది", en: "bagundhi" },
  { te: "ఇది", en: "idhi" },
  { te: "అవును", en: "avunu" },
  { te: "కాదు", en: "kaadhu" },
  { te: "ఇప్పుడు", en: "ippudu" },
  { te: "రోజు", en: "roju" },
  { te: "కొత్త", en: "kotha" },
  { te: "ట్రిక్", en: "trick" },
  { te: "లైక్", en: "like" },
  { te: "కామెంట్", en: "comment" }
];

// Telugu vowels and consonants mapping
const VOWELS = {
  'అ': 'a', 'ఆ': 'aa', 'ఇ': 'i', 'ఈ': 'ee', 'ఉ': 'u', 'ఊ': 'oo',
  'ఋ': 'ru', 'ఎ': 'e', 'ఏ': 'e', 'ఐ': 'ai', 'ఒ': 'o', 'ఓ': 'o', 'ఔ': 'au',
  'ం': 'm', 'ః': 'h'
};

const MATRAS = {
  'ా': 'aa', 'ి': 'i', 'ీ': 'ee', 'ు': 'u', 'ూ': 'oo', 'ృ': 'ru',
  'ె': 'e', 'ే': 'e', 'ై': 'ai', 'ొ': 'o', 'ో': 'o', 'ౌ': 'au',
  'ం': 'm', '్': ''
};

const CONSONANTS = {
  'క': 'k', 'ఖ': 'kh', 'గ': 'g', 'ఘ': 'gh', 'ఙ': 'ng',
  'చ': 'ch', 'ఛ': 'chh', 'జ': 'j', 'ఝ': 'jh', 'ఞ': 'ny',
  'ట': 't', 'ఠ': 'th', 'డ': 'd', 'ఢ': 'dh', 'ణ': 'n',
  'త': 'th', 'థ': 'th', 'ద': 'd', 'ధ': 'dh', 'న': 'n',
  'ప': 'p', 'ఫ': 'f', 'బ': 'b', 'భ': 'bh', 'మ': 'm',
  'య': 'y', 'ర': 'r', 'ల': 'l', 'వ': 'v', 'శ': 'sh',
  'ష': 'sh', 'స': 's', 'హ': 'h', 'ళ': 'l', 'క్ష': 'ksh', 'ఱ': 'r'
};

/**
 * Convert Telugu unicode script to Romanized English
 */
export function teluguToRomanized(text) {
  if (!text) return "";
  let words = text.split(/(\s+)/);
  return words.map(w => {
    // Check dictionary first
    let clean = w.trim();
    let dict = COMMON_DICTIONARY.find(d => d.te === clean);
    if (dict) return dict.en;

    // Fallback phonetic transliteration
    let result = "";
    let i = 0;
    while (i < clean.length) {
      let char = clean[i];
      let nextChar = clean[i + 1];

      if (VOWELS[char]) {
        result += VOWELS[char];
        i++;
      } else if (CONSONANTS[char]) {
        let cons = CONSONANTS[char];
        if (nextChar && MATRAS[nextChar] !== undefined) {
          result += cons + MATRAS[nextChar];
          i += 2;
        } else if (nextChar === '్') {
          result += cons;
          i += 2;
        } else {
          result += cons + 'a';
          i++;
        }
      } else {
        result += char;
        i++;
      }
    }
    return result || w;
  }).join("");
}

/**
 * Convert Romanized English to Telugu script
 */
export function romanizedToTelugu(text) {
  if (!text) return "";
  let words = text.split(/(\s+)/);
  return words.map(w => {
    let clean = w.trim().toLowerCase();
    let dict = COMMON_DICTIONARY.find(d => d.en === clean);
    if (dict) return dict.te;
    return w;
  }).join("");
}

/**
 * Check if string contains Telugu unicode characters
 */
export function isTeluguScript(text) {
  return /[\u0C00-\u0C7F]/.test(text);
}
