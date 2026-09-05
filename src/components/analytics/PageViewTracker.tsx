import { useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { OrganisationContext } from '../../contexts/OrganisationContextProvider';
import { hasOptionalCookieConsent } from '../../utils/cookieConsentStorage';
import { getAnalyticsSessionId, getAnalyticsVisitorId, readUtmParams, shouldTrackPath } from '../../utils/pageViewTracker';

const PageViewTracker = () => {
	const location = useLocation();
	const { orgId } = useContext(OrganisationContext);
	const lastSentRef = useRef<{ path: string; at: number } | null>(null);
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	useEffect(() => {
		const sendPageView = () => {
			if (!orgId || !hasOptionalCookieConsent() || !shouldTrackPath(location.pathname)) {
				return;
			}

			const sessionId = getAnalyticsSessionId();
			const visitorId = getAnalyticsVisitorId();
			if (!sessionId || !visitorId) return;

			const now = Date.now();
			if (lastSentRef.current && lastSentRef.current.path === location.pathname && now - lastSentRef.current.at < 2000) {
				return;
			}
			lastSentRef.current = { path: location.pathname, at: now };

			const utm = readUtmParams(location.search);
			const payload = {
				orgId,
				sessionId,
				visitorId,
				path: location.pathname,
				referrer: typeof document !== 'undefined' ? document.referrer : '',
				language: typeof navigator !== 'undefined' ? navigator.language : '',
				...utm,
			};

			axiosInstance.post(`${base_url}/analytics/pageview`, payload).catch(() => {
				// Tracking must never interrupt browsing.
			});
		};

		sendPageView();
		window.addEventListener('learnscape-cookie-consent', sendPageView);
		return () => window.removeEventListener('learnscape-cookie-consent', sendPageView);
	}, [location.pathname, location.search, orgId, base_url]);

	return null;
};

export default PageViewTracker;
