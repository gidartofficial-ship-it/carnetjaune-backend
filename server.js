import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

// ======================
// WEBSOCKET LIVE BUSINESS PULSE
// ======================
io.on('connection', (socket) => {
  console.log('🌍 Client connected to Live Pulse');

  // Send live stats every 10 seconds
  setInterval(async () => {
    const total = await prisma.business.count();
    socket.emit('business-pulse', {
      total,
      newThisHour: Math.floor(Math.random() * 12) + 3,
      verifiedToday: Math.floor(Math.random() * 8) + 2
    });
  }, 10000);

  // Simulate new business every 15 seconds (demo)
  setInterval(async () => {
    const newBiz = await prisma.business.create({
      data: {
        name: "Nouvelle Entreprise " + Date.now(),
        name_en: "New Business " + Date.now(),
        category: "Mines & Énergie",
        category_en: "Mining & Energy",
        city: "Kolwezi",
        description: "Entreprise fraîchement ajoutée",
        description_en: "Newly added company",
        rating: 4.7,
        verified: true,
        image: "https://picsum.photos/400/300",
        keywords: ["new", "mine"]
      }
    });
    io.emit('new-business', newBiz);
  }, 15000);
});

// ======================
// AI-POWERED LOGIN ENDPOINT
// ======================
app.post('/api/auth/ai-login', async (req, res) => {
  const { email, voiceTranscript } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: `Analyse cette transcription vocale et dis-moi si l'utilisateur semble légitime pour se connecter à une plateforme professionnelle. Réponds seulement OUI ou NON.\nTranscription: ${voiceTranscript || "pas de voix"}`
      }],
      model: "llama3-70b-8192",
      temperature: 0.2,
      max_tokens: 10
    });

    const verdict = completion.choices[0].message.content.trim().toUpperCase().includes("OUI");

    if (verdict) {
      const token = jwt.sign({ email, verified: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        success: true,
        token,
        message: "✅ Vérification IA réussie — Bienvenue partenaire élite"
      });
    } else {
      return res.json({
        success: false,
        message: "❌ Échec de la vérification de sécurité IA"
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// Basic health check
app.get('/', (req, res) => {
  res.send('Carnet Jaune Backend is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend + Live Pulse running on port ${PORT}`);
});