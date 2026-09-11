import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type TurnstileWidgetHandle = {
	reset: () => void;
};

type TurnstileWidgetProps = {
	action: string;
	onChange: (token: string | null) => void;
	onExpired?: () => void;
	onError?: () => void;
	resetKey?: string | number | boolean;
	/** After Success checkmark is shown, replace widget with a clearer status line. Default true. */
	hideAfterSuccess?: boolean;
	/** How long to keep Cloudflare Success visible before swapping (ms). */
	successVisibleMs?: number;
	/** Widget size — `flexible` fits narrow mobile containers. */
	size?: 'normal' | 'flexible' | 'compact';
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
const DEFAULT_SUCCESS_VISIBLE_MS = 1500;
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
	{
		action,
		onChange,
		onExpired,
		onError,
		resetKey,
		hideAfterSuccess = true,
		successVisibleMs = DEFAULT_SUCCESS_VISIBLE_MS,
		size = 'flexible',
	},
	ref
) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);
	const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onChangeRef = useRef(onChange);
	const onExpiredRef = useRef(onExpired);
	const onErrorRef = useRef(onError);
	const [showCustomStatus, setShowCustomStatus] = useState(false);

	onChangeRef.current = onChange;
	onExpiredRef.current = onExpired;
	onErrorRef.current = onError;

	const clearHideTimer = () => {
		if (hideTimerRef.current) {
			clearTimeout(hideTimerRef.current);
			hideTimerRef.current = null;
		}
	};

	useImperativeHandle(ref, () => ({
		reset() {
			clearHideTimer();
			setShowCustomStatus(false);
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.reset(widgetIdRef.current);
			}
			// Do not call onChange(null) here — parents set the token to null themselves.
		},
	}));

	useEffect(() => {
		clearHideTimer();
		setShowCustomStatus(false);
	}, [resetKey, action]);

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
				size,
				appearance: 'always',
				callback: (token: string) => {
					onChangeRef.current(token);
					if (!hideAfterSuccess) return;
					clearHideTimer();
					// Let Cloudflare Success checkmark show first, then swap to our status line.
					hideTimerRef.current = setTimeout(() => {
						setShowCustomStatus(true);
						hideTimerRef.current = null;
					}, successVisibleMs);
				},
				'expired-callback': () => {
					clearHideTimer();
					setShowCustomStatus(false);
					onChangeRef.current(null);
					onExpiredRef.current?.();
				},
				'error-callback': () => {
					clearHideTimer();
					setShowCustomStatus(false);
					onChangeRef.current(null);
					onErrorRef.current?.();
				},
			});
		};

		mount();

		return () => {
			cancelled = true;
			clearHideTimer();
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.remove(widgetIdRef.current);
			}
			widgetIdRef.current = null;
		};
	}, [action, resetKey, hideAfterSuccess, successVisibleMs, size]);

	if (!SITE_KEY) {
		return null;
	}

	const hideWidget = hideAfterSuccess && showCustomStatus;

	return (
		<div style={{ width: '100%', maxWidth: '100%' }}>
			<div
				ref={containerRef}
				className='cf-turnstile'
				style={
					hideWidget
						? {
							position: 'absolute',
							width: 1,
							height: 1,
							overflow: 'hidden',
							clip: 'rect(0 0 0 0)',
							opacity: 0,
							pointerEvents: 'none',
						}
						: { width: '100%' }
				}
				aria-hidden={hideWidget ? true : undefined}
			/>
			{hideWidget ? (
				<p
					style={{
						margin: '0.6rem 0 0',
						fontFamily: 'Varela Round, sans-serif',
						fontSize: '0.8rem',
						color: '#166534',
						fontWeight: 600,
						textAlign: 'center',
					}}>
					Güvenlik doğrulaması tamamlandı
				</p>
			) : null}
		</div>
	);
});

export default TurnstileWidget;
