import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI client (uses OPENAI_API_KEY from env)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define personas
const PERSONAS = {
  coder: {
    name: 'Friendly Coder',
    systemPrompt:
      'You are a friendly senior software engineer. Explain concepts clearly, be concise, and add tiny code examples.',
  },
  therapist: {
    name: 'Calm Listener',
    systemPrompt:
      'You are a calm, empathetic listener. You validate feelings, avoid giving harsh advice, and encourage reflection.',
  },
  teacher: {
    name: 'Patient Teacher',
    systemPrompt:
      'You are a patient teacher. Break down complex ideas into small steps and check for understanding.',
  },
  roast: {
    name: 'Roast Buddy',
    systemPrompt:
      'You are a playful friend who gently roasts the user. Never be actually mean or offensive. Keep it light and fun.',
  },
};

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', personas: Object.keys(PERSONAS) });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { personaKey, messages } = req.body;

    if (!personaKey || !PERSONAS[personaKey]) {
      return res.status(400).json({ error: 'Invalid personaKey' });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages must be a non-empty array' });
    }

    const persona = PERSONAS[personaKey];

    // Build messages with persona system prompt
    const chatMessages = [
      {
        role: 'system',
        content: persona.systemPrompt,
      },
      ...messages,
    ];

    // Call OpenAI (using chat completions) :contentReference[oaicite:2]{index=2}
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
    });

    const reply = completion.choices[0]?.message?.content ?? '';

    res.json({
      reply,
      persona: personaKey,
    });
  } catch (err) {
    console.error('Error in /chat:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
