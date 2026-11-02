const CLOUD_SYNC_OBJECT_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a19e72a5ff14ac';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { url } = body;
    if (url && typeof url === 'string' && url.startsWith('https://script.google.com/')) {
      const getRes = await fetch(CLOUD_SYNC_OBJECT_URL);
      let current = {};
      if (getRes.ok) {
        const obj = await getRes.json();
        if (obj?.data?.stateJson) {
          current = JSON.parse(obj.data.stateJson);
        }
      }
      const now = Date.now();
      const nextState = {
        ...current,
        sheetsUrl: url.trim(),
        sheetsUrlUpdatedAt: now,
        updatedAt: now,
      };
      await fetch(CLOUD_SYNC_OBJECT_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'dompetku_fahmi',
          data: {
            stateJson: JSON.stringify(nextState),
            updatedAt: now,
          },
        }),
      });
    }
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(200).json({ ok: true });
  }
}
