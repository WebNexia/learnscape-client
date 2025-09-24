import { useQuery } from 'react-query';
import { useContext } from 'react';
import axios from '@utils/axiosInstance';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

// Dashboard data interfaces
export interface UpcomingEvent {
	id: string;
	title: string;
	startDate: string;
}

export interface RecentTopic {
	id: string;
	title: string;
	createdAt: string;
}

export interface QuizNotification {
	hasNotification: boolean;
	message: string;
	type: 'unchecked' | 'checked' | 'none' | 'error';
}

export interface CommonData {
	upcomingEvents: UpcomingEvent[];
	recentTopics: RecentTopic[];
	quizNotification: QuizNotification;
}

export interface UserTimeline {
	labels: string[];
	data: number[];
}

export interface AdminData {
	totalCourses: number;
	totalUsers: number;
	totalRevenue: number;
	totalPayments: number;
	inquiriesCount: number;
	enrolledUsersCount: number;
	userTimeline: UserTimeline;
}

export interface LearnerData {
	enrolledCourses: number;
	completedCourses: number;
	completedLessons: number;
	courseTimeline: UserTimeline;
	lessonTimeline: UserTimeline;
}

export interface InstructorData {
	totalCourses: number;
	totalUsers: number;
	userTimeline: UserTimeline;
	courseEnrollments: {
		labels: string[];
		data: number[];
	};
}

export interface DashboardSummaryData {
	common: CommonData;
	roleSpecific: AdminData | LearnerData | InstructorData;
}

/**
 * Simple hook to fetch dashboard summary data
 * Returns role-based data with caching
 */
export const useDashboardSummary = () => {
	const { userId } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const {
		data: dashboardData,
		isLoading,
		isError,
		error,
		refetch,
	} = useQuery(
		['dashboardSummary', userId, orgId],
		async () => {
			if (!userId || !orgId) {
				throw new Error('User ID or Organization ID is missing');
			}

			const url = `${base_url}/dashboard/summary/${orgId}/${userId}`;

			// Add retry logic for connection issues
			let lastError;
			for (let attempt = 1; attempt <= 3; attempt++) {
				try {
					const response = await axios.get(url);

					return response.data.data as DashboardSummaryData;
				} catch (error) {
					lastError = error;
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';

					if ((attempt < 3 && (error as any)?.code === 'ERR_CONNECTION_REFUSED') || (error as any)?.code === 'ECONNREFUSED') {
						const delay = Math.pow(2, attempt) * 1000; // 2s, 4s delays
						await new Promise((resolve) => setTimeout(resolve, delay));
					} else {
						break;
					}
				}
			}

			throw lastError;
		},
		{
			enabled: !!userId && !!orgId,
			staleTime: 2 * 60 * 1000, // 2 minutes
			cacheTime: 10 * 60 * 1000, // 10 minutes
			refetchOnWindowFocus: true,
			refetchOnMount: true,
			onError: (error) => {
				console.error('❌ Dashboard API Error:', error);
			},
		}
	);

	return {
		dashboardData,
		loading: isLoading,
		error: isError ? (error as Error)?.message || 'Failed to fetch dashboard data' : null,
		refetch,
	};
};
