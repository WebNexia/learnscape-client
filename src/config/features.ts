/**
 * Must match server `SUBSCRIPTIONS_ENABLED`: only explicit `'true'` enables subscription product (UI + client assumptions).
 * Set `VITE_SUBSCRIPTIONS_ENABLED=false` in `.env` when subscriptions are off.
 */
export const isSubscriptionsProductEnabled = import.meta.env.VITE_SUBSCRIPTIONS_ENABLED === 'true';
