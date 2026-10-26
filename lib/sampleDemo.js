/**
 * Pre-configured sample Telugu reel project with dual script and word-level timings
 * Used for instant testing and demonstration.
 */

export const SAMPLE_PROJECT = {
  id: "demo-sample-reel",
  title: "Telugu AI Hacks Reel (Demo)",
  filename: "telugu_ai_tips.mp4",
  durationSec: 15.0,
  videoUrl: "/sample_reel.mp4",
  segments: [
    {
      id: "seg-1",
      start: 0.2,
      end: 2.8,
      text: "మీరు ఈ సీక్రెట్ AI ట్రిక్ ని చూశారా",
      romanizedText: "Meeru ee secret AI trick ni chusara",
      words: [
        { word: "మీరు", romanized: "Meeru", start: 0.2, end: 0.6 },
        { word: "ఈ", romanized: "ee", start: 0.6, end: 0.9 },
        { word: "సీక్రెట్", romanized: "secret", start: 0.9, end: 1.5 },
        { word: "AI", romanized: "AI", start: 1.5, end: 1.9 },
        { word: "ట్రిక్ ని", romanized: "trick ni", start: 1.9, end: 2.3 },
        { word: "చూశారా", romanized: "chusara", start: 2.3, end: 2.8 }
      ]
    },
    {
      id: "seg-2",
      start: 3.1,
      end: 6.2,
      text: "ఇది మీ రీల్స్ ఎంగేజ్‌మెంట్‌ని 10 రెట్లు పెంచుతుంది",
      romanizedText: "Idhi mee reels engagement ni 10 retlu penchuthundhi",
      words: [
        { word: "ఇది", romanized: "Idhi", start: 3.1, end: 3.5 },
        { word: "మీ", romanized: "mee", start: 3.5, end: 3.8 },
        { word: "రీల్స్", romanized: "reels", start: 3.8, end: 4.4 },
        { word: "ఎంగేజ్‌మెంట్‌ని", romanized: "engagement ni", start: 4.4, end: 5.2 },
        { word: "10 రెట్లు", romanized: "10 retlu", start: 5.2, end: 5.7 },
        { word: "పెంచుతుంది", romanized: "penchuthundhi", start: 5.7, end: 6.2 }
      ]
    },
    {
      id: "seg-3",
      start: 6.5,
      end: 9.8,
      text: "కేవలం 2 నిమిషాల్లో ఆటోమేటిక్ తెలుగు క్యాప్షన్స్",
      romanizedText: "Kevalam 2 nimishallo automatic Telugu captions",
      words: [
        { word: "కేవలం", romanized: "Kevalam", start: 6.5, end: 7.1 },
        { word: "2 నిమిషాల్లో", romanized: "2 nimishallo", start: 7.1, end: 8.0 },
        { word: "ఆటోమేటిక్", romanized: "automatic", start: 8.0, end: 8.8 },
        { word: "తెలుగు", romanized: "Telugu", start: 8.8, end: 9.3 },
        { word: "క్యాప్షన్స్", romanized: "captions", start: 9.3, end: 9.8 }
      ]
    },
    {
      id: "seg-4",
      start: 10.1,
      end: 14.8,
      text: "ఇప్పుడే సేవ్ చేసుకోండి మరియు మీ ఫ్రెండ్స్‌తో షేర్ చేయండి",
      romanizedText: "Ippude save chesukondi mariyu mee friends tho share cheyandi",
      words: [
        { word: "ఇప్పుడే", romanized: "Ippude", start: 10.1, end: 10.8 },
        { word: "సేవ్", romanized: "save", start: 10.8, end: 11.4 },
        { word: "చేసుకోండి", romanized: "chesukondi", start: 11.4, end: 12.2 },
        { word: "మరియు", romanized: "mariyu", start: 12.2, end: 12.8 },
        { word: "మీ ఫ్రెండ్స్‌తో", romanized: "mee friends tho", start: 12.8, end: 13.8 },
        { word: "షేర్", romanized: "share", start: 13.8, end: 14.2 },
        { word: "చేయండి", romanized: "cheyandi", start: 14.2, end: 14.8 }
      ]
    }
  ]
};
