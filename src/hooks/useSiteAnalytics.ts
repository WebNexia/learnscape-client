import { useQuery } from 'react-query';
import axiosInstance from '../utils/axiosInstance';

export type AnalyticsRangeKey = '24h' | '7d' | '30d' | '90d';

export interface AnalyticsKpis {
	pageViews: number;
	uniqueVisitors: number;
	sessions: number;
	bounceRate: number;
	avgPagesPerSession: number;
	avgSessionSeconds: number;
	newVisitors: number;
	returningVisitors: number;
}

export interface AnalyticsTimelinePoint {
	label: string;
	views: number;
	visitors: number;
	sessions: number;
}

export interface AnalyticsNamedCount {
	name: string;
	views: number;
	visitors: number;
}

export interface AnalyticsTopPage {
	path: string;
	label: string;
	group: string;
	views: number;
	visitors: number;
}

export interface AnalyticsCountry {
	countryCode: string;
	country: string;
	views: number;
	visitors: number;
}

export interface AnalyticsCity {
	city: string;
	countryCode: string;
	country: string;
	views: number;
	visitors: number;
}

export interface AnalyticsSource {
	name: string;
	key: string;
	views: number;
	visitors: number;
}

export interface AnalyticsCampaign {
	source: string;
	medium: string;
	campaign: string;
	views: number;
	visitors: number;
}

export interface AnalyticsSessionPage {
	path: string;
	label: string;
	at: string;
}

export interface AnalyticsRecentSession {
	sessionId: string;
	visitorId: string;
	username: string;
	userRole: string;
	isStaff: boolean;
	country: string;
	countryCode: string;
	city: string;
	deviceType: string;
	browser: string;
	os: string;
	source: string;
	referrerHost: string;
	utmSource: string;
	utmCampaign: string;
	landingPage: string;
	landingLabel: string;
	lastPage: string;
	lastLabel: string;
	pageCount: number;
	startedAt: string;
	lastSeenAt: string;
	pages: AnalyticsSessionPage[];
}

export interface SiteAnalyticsData {
	range: { key: AnalyticsRangeKey; from: string; to: string; bucket: 'hour' | 'day' };
	kpis: AnalyticsKpis;
	timeline: AnalyticsTimelinePoint[];
	topPages: AnalyticsTopPage[];
	countries: AnalyticsCountry[];
	cities: AnalyticsCity[];
	devices: AnalyticsNamedCount[];
	browsers: AnalyticsNamedCount[];
	sources: AnalyticsSource[];
	referrers: AnalyticsNamedCount[];
	campaigns: AnalyticsCampaign[];
	recentSessions: AnalyticsRecentSession[];
}

export const useSiteAnalytics = (range: AnalyticsRangeKey, excludeStaff: boolean) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	return useQuery(
		['ownerSiteAnalytics', range, excludeStaff],
		async () => {
			const response = await axiosInstance.get(`${base_url}/analytics/summary`, {
				params: { range, excludeStaff },
			});
			return response.data.data as SiteAnalyticsData;
		},
		{
			keepPreviousData: true,
			staleTime: 30 * 1000,
			retry: 1,
		}
	);
};
