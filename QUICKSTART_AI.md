# AI Canvas Agent - Quick Start Guide

Get the AI Assistant running in 5 minutes!

## 🚀 Setup Steps

### 1. Get OpenAI API Key (2 minutes)

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-...`)

### 2. Configure Functions Environment (1 minute)

Create `functions/.env` file:

```bash
cd functions
echo "OPENAI_API_KEY=sk-your-key-here" > .env
echo "OPENAI_MODEL=gpt-4-turbo-preview" >> .env
echo "OPENAI_MAX_TOKENS=2000" >> .env
echo "OPENAI_TEMPERATURE=0.2" >> .env
```

Or manually create `functions/.env`:
```env
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.2
```

### 3. Build Functions (1 minute)

```bash
cd functions
npm run build
```

### 4. Start Emulator (1 minute)

```bash
cd ..
firebase emulators:start --only functions
```

Keep this terminal running!

### 5. Start Client (In another terminal)

```bash
npm run dev
```

### 6. Test It! (30 seconds)

1. Open http://localhost:5173 in browser
2. Log in to your account
3. Click the 🤖 button in bottom-right corner
4. Try: **"Create a red circle at (200, 200)"**

---

## 💡 Try These Commands

### Easy
- "Create a blue rectangle at (300, 300)"
- "Move selected shapes to (500, 500)"
- "Align all shapes to the left"

### Medium
- "Arrange selected shapes in a 3x3 grid"
- "Create 5 circles in a row from (100, 100) to (500, 100)"
- "Distribute shapes horizontally with equal spacing"

### Advanced
- "Generate a 50x50 noise terrain tilemap"
- "Create a 40x40 cave tilemap with 45% fill"
- "Paint grass tiles from (0,0) to (20,20)"

---

## 🎯 Commands by Mode

### Shape Mode 🎨
- Create, modify, delete shapes
- Move, resize, rotate
- Arrange, distribute, align

### Tilemap Mode 🗺️
- Paint tile regions
- Erase tile regions
- Generate procedural tilemaps

Switch modes using the toggle in the top bar!

---

## 🐛 Troubleshooting

### "AI features not enabled"
Create `.env` in project root:
```env
VITE_AI_ENABLED=true
```
Restart dev server.

### "OpenAI API key not configured"
- Check `functions/.env` exists
- Verify API key is correct
- Restart emulator

### "Rate limit exceeded"
Wait 60 seconds. Limit: 10 requests/minute.

### Functions not starting
```bash
cd functions
npm install
npm run build
firebase emulators:start --only functions
```

### 🤖 Button not showing
- Check `.env` has `VITE_AI_ENABLED=true`
- Restart dev server
- Check browser console for errors

---

## 📚 Full Documentation

- **Command Reference**: `docs/AI_COMMANDS.md`
- **Environment Setup**: `functions/ENV_SETUP.md`
- **Day 1 Summary**: `PR30_DAY1_COMPLETE.md`

---

## 🎉 You're Ready!

The AI Assistant is now running locally. Try creating shapes, arranging layouts, and generating tilemaps using natural language!

For production deployment:
```bash
firebase deploy --only functions
```

Happy creating! 🚀

