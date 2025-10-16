# Firebase Functions Environment Setup

## Required Environment Variables

The AI Canvas Agent requires an OpenAI API key to function. Follow these steps to configure it:

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key
5. Copy the key (starts with `sk-...`)

### 2. Set Environment Variables (Development)

Create a `.env` file in the `functions/` directory:

```bash
cd functions
touch .env
```

Add the following to `functions/.env`:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.2
```

**Important:** Never commit the `.env` file to git! It's already in `.gitignore`.

### 3. Set Environment Variables (Production)

For production deployment, use Firebase Functions config:

```bash
firebase functions:config:set openai.key="sk-your-actual-api-key-here"
firebase functions:config:set openai.model="gpt-4-turbo-preview"
firebase functions:config:set openai.max_tokens="2000"
firebase functions:config:set openai.temperature="0.2"
```

### 4. Enable AI Features (Client-Side)

Create or update `.env` in the project root:

```env
VITE_AI_ENABLED=true
```

## Configuration Options

### OPENAI_API_KEY (Required)
Your OpenAI API key. Get it from [OpenAI Platform](https://platform.openai.com/).

### OPENAI_MODEL (Optional)
Default: `gpt-4-turbo-preview`

Available models:
- `gpt-4-turbo-preview`: Most capable, recommended
- `gpt-4`: Stable, reliable
- `gpt-3.5-turbo`: Faster, cheaper (not recommended for complex operations)

### OPENAI_MAX_TOKENS (Optional)
Default: `2000`

Maximum tokens in AI response. Adjust based on complexity:
- `1000`: Simple operations
- `2000`: Standard (recommended)
- `4000`: Complex multi-step operations

### OPENAI_TEMPERATURE (Optional)
Default: `0.2`

Controls AI creativity:
- `0.0`: Deterministic, precise
- `0.2`: Recommended balance
- `0.5`: More creative, less predictable

## Testing Configuration

Test your configuration:

```bash
# Build functions
cd functions
npm run build

# Start emulator
firebase emulators:start --only functions

# In another terminal, test the function
curl -X POST http://localhost:5001/YOUR-PROJECT-ID/us-central1/aiCanvasCommand \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "message": "Create a red circle",
      "context": {
        "canvasId": "test",
        "userId": "test-user",
        "selectedShapes": [],
        "viewport": {"x": 0, "y": 0, "width": 1000, "height": 1000, "zoom": 1},
        "mode": "shapes"
      }
    }
  }'
```

## Troubleshooting

### "OpenAI API key not configured"
- Check that `.env` file exists in `functions/` directory
- Verify `OPENAI_API_KEY` is set correctly
- Restart the emulator after changing `.env`

### "Invalid API key"
- Verify your API key is correct and active
- Check if you have credits in your OpenAI account
- Try regenerating the API key

### "Rate limit exceeded"
- Check your OpenAI account usage limits
- Wait a few minutes before trying again
- Consider upgrading your OpenAI plan

### Functions not loading environment variables
In development, use `.env` file.
In production, use `firebase functions:config:set`.

For local emulation with production config:
```bash
firebase functions:config:get > .runtimeconfig.json
```

## Security Best Practices

1. **Never commit API keys to git**
2. **Rotate keys regularly** (every 90 days)
3. **Set usage limits** in OpenAI dashboard
4. **Monitor usage** to detect anomalies
5. **Use separate keys** for dev/prod environments

## Cost Estimation

OpenAI API costs for typical usage:
- **Small canvas** (10-20 shapes): ~$0.002 per command
- **Medium canvas** (50-100 shapes): ~$0.005 per command
- **Large canvas** (500+ shapes): ~$0.01 per command
- **Tilemap generation**: ~$0.003-$0.008 per generation

Rate limiting (10 commands/min/user) helps control costs.

For a team of 10 users:
- Light use (50 commands/day): ~$5-10/month
- Medium use (200 commands/day): ~$20-40/month
- Heavy use (500 commands/day): ~$50-100/month

## Support

For issues with environment setup:
1. Check Firebase Functions logs: `firebase functions:log`
2. Check browser console for client-side errors
3. Verify all dependencies are installed: `npm install`
4. Ensure Node.js version is 18+ (Firebase Functions requirement)

