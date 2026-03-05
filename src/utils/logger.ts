// utils/logger.ts
export const debugLog = (...args: any[]) => {
  // Debug logs in console (development + release both)
  console.log(...args);

  // Send logs to Webhook.site
  fetch('https://webhook.site/4e5cf46d-7f2a-46ef-9da0-bf6541ad8ef7', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      log: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)),
    }),
  })
    .then(() => console.log(':::::logs posted:::::'))
    .catch(err => console.log(':::::log post failed:::::', err));
};

