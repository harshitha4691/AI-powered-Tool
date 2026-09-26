export default function handler(_req: any, res: any) {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== '' &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );

  res.status(200).json({
    status: 'ok',
    hasApiKey: hasKey,
    provider: hasKey ? 'Google Gemini 1.5 Flash' : 'Demo & Mock AI Engine',
    uptimeSeconds: process.uptime ? process.uptime() : 0,
  });
}
