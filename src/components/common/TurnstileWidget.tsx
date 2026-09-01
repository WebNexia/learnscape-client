import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type TurnstileWidgetHandle = {
	reset: () => void;
};

type TurnstileWidgetProps = {
	action: string;
	onChange: (token: string | null) => void;
	onExpired?: () => void;
	onError?: () => void;
	resetKey?: string | number | boolean;
};

declare global {
	interface Window {
		turnstile?: {
			render: (el: HTMLElement, opts: Record<string, unknown>) => string;
			reset: (id: string) => void;
			remove: (id: string) => void;
		};
	}
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
	if (typeof window === 'undefined') return Promise.resolve();
	if (window.turnstile) return Promise.resolve();
	if (scriptPromise) return scriptPromise;

	scriptPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile"]');
		if (existing) {
			if (window.turnstile) {
				resolve();
				return;
			}
			existing.addEventListener('load', () => resolve(), { once: true });
			existing.addEventListener('error', () => reject(new Error('Turnstile failed to load')), { once: true });
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Turnstile failed to load'));
		document.head.appendChild(script);
	});

	return scriptPromise;
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(function TurnstileWidget(
	{ action, onChange, onExpired, onError, resetKey },
	ref
) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);
	const onChangeRef = useRef(onChange);
	const onExpiredRef = useRef(onExpired);
	const onErrorRef = useRef(onError);

	onChangeRef.current = onChange;
	onExpiredRef.current = onExpired;
	onErrorRef.current = onError;

	useImperativeHandle(ref, () => ({
		reset() {
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.reset(widgetIdRef.current);
			}
			onChangeRef.current(null);
		},
	}));

	useEffect(() => {
		let cancelled = false;

		const mount = async () => {
			if (!SITE_KEY || !containerRef.current) return;
			try {
				await loadTurnstileScript();
			} catch (err) {
				console.error(err);
				onErrorRef.current?.();
				return;
			}
			if (cancelled || !containerRef.current || !window.turnstile) return;

			widgetIdRef.current = window.turnstile.render(containerRef.current, {
				sitekey: SITE_KEY,
				action,
				theme: 'light',
				callback: (token: string) => onChangeRef.current(token),
				'expired-callback': () => {
					onChangeRef.current(null);
					onExpiredRef.current?.();
				},
				'error-callback': () => {
					onChangeRef.current(null);
					onErrorRef.current?.();
				},
			});
		};

		mount();

		return () => {
			cancelled = true;
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.remove(widgetIdRef.current);
			}
			widgetIdRef.current = null;
		};
	}, [action, resetKey]);

	if (!SITE_KEY) {
		return null;
	}

	return <div ref={containerRef} className="cf-turnstile" />;
});

export default TurnstileWidget;
