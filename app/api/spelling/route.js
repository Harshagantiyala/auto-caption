import { NextResponse } from "next/server";

const TELUGU_VOCABULARY = [
  { word: "నమస్కారం", romanized: "namaskaram", category: "greeting" },
  { word: "చూశారా", romanized: "chusara", category: "creator hook" },
  { word: "తెలుసుకుందాం", romanized: "thelusukundam", category: "hook" },
  { word: "కచ్చితంగా", romanized: "kachithamga", category: "emphasis" },
  { word: "ముఖ్యమైన", romanized: "mukhyamaina", category: "adjective" },
  { word: "షేర్ చేయండి", romanized: "share cheyandi", category: "call to action" },
  { word: "సేవ్ చేసుకోండి", romanized: "save chesukondi", category: "call to action" },
  { word: "ఫాలో అవ్వండి", romanized: "follow avvandi", category: "call to action" },
  { word: "లైక్ చేయండి", romanized: "like cheyandi", category: "call to action" },
  { word: "కామెంట్ చేయండి", romanized: "comment cheyandi", category: "call to action" },
  { word: "ఎంగేజ్‌మెంట్", romanized: "engagement", category: "metric" },
  { word: "వైరల్ రీల్స్", romanized: "viral reels", category: "content" }
];

export async function POST(request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ suggestions: [] });
    }

    const q = query.trim().toLowerCase();
    const suggestions = TELUGU_VOCABULARY.filter(item =>
      item.word.includes(q) || item.romanized.includes(q)
    ).slice(0, 5);

    return NextResponse.json({ ok: true, suggestions });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
