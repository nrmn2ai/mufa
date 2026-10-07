import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client (uses GEMINI_API_KEY from environment)
const ai = new GoogleGenAI();

// API Route: Generate contextual lyrics and poetic verses based on singing style and musical mode
app.post('/api/ai-lyrics', async (req: Request, res: Response) => {
  try {
    const { styleId, styleName, scale, rootKey, vocalMood, lang } = req.body;

    const prompt = `
You are an expert master poet, composer, and vocal coach for Iranian and international music.
A singer is currently performing live with the following musical parameters:
- Active Musical Style: "${styleName}" (${styleId})
- Mode / Scale: "${scale}"
- Root Key: "${rootKey}"
- Vocal Expression / Mood: "${vocalMood}"
- Preferred Language: "${lang || 'fa'}"

Task:
1. Provide 2-4 lines of rhythmic, deeply poetic lyrics (شعر یا ترانه موزون) that match the emotional tone, meter, and cadence of this musical style (if Persian, compose in classical or modern Iranian poetic meter like Ghazal or Taraneh; if English, lyrical rhyming verses).
2. Provide 1 concise practical vocal improvisation tip (نکته بداهه‌خوانی) on how to sing or ornament this phrase (e.g. which note to rest on, where to apply Tahrir/vibrato, or how to phrase the rhythm).

Output strictly valid JSON with this exact schema:
{
  "lyrics": [
    "Line 1...",
    "Line 2...",
    "Line 3...",
    "Line 4..."
  ],
  "poeticMeter": "وزن شعر یا سبک ترانه",
  "vocalTip": "نکته بداهه‌خوانی کوتاه و کاربردی",
  "recommendedEmotion": "حس عاطفی توصیه شده"
}
Do not include markdown code fence formatting outside the JSON if possible, just the JSON string.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error in /api/ai-lyrics:', error);
    // Return friendly fallback
    res.json({
      success: true,
      data: {
        lyrics: [
          'به جهان خرم از آنم که جهان خرم ازوست',
          'عاشقم بر همه عالم که همه عالم ازوست',
          'غم و شادی برِ عارف چه تفاوت دارد',
          'ساقیا باده بده کین همه مایه ازوست'
        ],
        poeticMeter: 'مفاعیلن مفاعیلن فعولن',
        vocalTip: 'روی نت فرود گام کمی مکث کنید و با تحریر ملایم فرود بیایید.',
        recommendedEmotion: 'عارفانه و پرشور'
      }
    });
  }
});

// Setup Vite in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Melodiya server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
