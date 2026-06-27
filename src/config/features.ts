/**
 * Must match server `SUBSCRIPTIONS_ENABLED`: only explicit `'true'` enables subscription product (UI + client assumptions).
 * Set `VITE_SUBSCRIPTIONS_ENABLED=false` in `.env` when subscriptions are off.
 */
export const isSubscriptionsProductEnabled = import.meta.env.VITE_SUBSCRIPTIONS_ENABLED === 'true';

export const RESOURCES_ACCESS_MESSAGE_WITH_SUBSCRIPTION = 'Subscription or paid course enrollment required to access resources';

export const RESOURCES_ACCESS_MESSAGE_WITHOUT_SUBSCRIPTION = 'Paid course enrollment required to access resources';

export const getResourcesAccessRequiredMessage = (): string =>
	isSubscriptionsProductEnabled ? RESOURCES_ACCESS_MESSAGE_WITH_SUBSCRIPTION : RESOURCES_ACCESS_MESSAGE_WITHOUT_SUBSCRIPTION;
