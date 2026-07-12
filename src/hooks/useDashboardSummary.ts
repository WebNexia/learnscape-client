import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useContext } from 'react';
import axios from '@utils/axiosInstance';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { useAuth } from './useAuth';

export const LEARNER_DASHBOARD_STALE_MS = 0;
export const LEARNER_DASHBOARD_CACHE_MS = 10 * 60 * 1000;
export const ADMIN_DASHBOARD_STALE_MS = 2 * 60 * 1000;

export const DASHBOARD_QUERY_ROOT = 'dashboardSummary';

const dashboardQueryOptions = (isLearner: boolean) => ({
	staleTime: isLearner ? LEARNER_DASHBOARD_STALE_MS : ADMIN_DASHBOARD_STALE_MS,
	cacheTime: LEARNER_DASHBOARD_CACHE_MS,
	refetchOnWindowFocus: false,
	refetchOnMount: false,
});

async function fetchDashboardSection<T>(url: string): Promise<T> {
	let lastError: unknown;

	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const response = await axios.get(url);
			return response.data.data as T;
		} catch (error) {
			lastError = error;

			if ((attempt < 3 && (error as { code?: string })?.code === 'ERR_CONNECTION_REFUSED') || (error as { code?: string })?.code === 'ECONNREFUSED') {
				const delay = Math.pow(2, attempt) * 1000;
				await new Promise((resolve) => setTimeout(resolve, delay));
			} else {
				break;
			}
		}
	}

	throw lastError;
}

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

export interface CourseEnrollmentsChart {
	labels: string[];
	data: number[];
}

export interface AdminIncomeData {
	ownerIncome?: number;
	ownerIncomeFromPayments?: number;
	ownerIncomeFromSubscriptions?: number;
	superAdminIncome?: number;
	superAdminIncomeFromPayments?: number;
	superAdminIncomeFromSubscriptions?: number;
	totalPayments?: number;
}

export interface AdminData extends AdminIncomeData {
	totalCourses: number;
	totalUsers: number;
	inquiriesCount: number;
	enrolledUsersCount: number;
	userTimeline: UserTimeline;
	courseEnrollments: CourseEnrollmentsChart;
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
	courseEnrollments: CourseEnrollmentsChart;
}

export interface DashboardSummaryData {
	common: CommonData;
	roleSpecific: AdminData | LearnerData | InstructorData;
}

/**
 * Fetches dashboard data in sections for faster first paint and lighter payloads.
 */
export const useDashboardSummary = () => {
	const { userId } = useContext(UserAuthContext);
	const { orgId } = useContext(OrganisationContext);
	const { isLearner, hasAdminAccess, isInstructor, canAccessPayments } = useAuth();

	const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;
	const queryEnabled = !!userId && !!orgId;
	const queryOptions = dashboardQueryOptions(isLearner);

	const commonQuery = useQuery(
		[DASHBOARD_QUERY_ROOT, 'common', userId, orgId],
		() => fetchDashboardSection<CommonData>(`${baseUrl}/dashboard/summary/common/${orgId}/${userId}`),
		{
			...queryOptions,
			enabled: queryEnabled,
			onError: (error) => {
				console.error('❌ Dashboard common API error:', error);
			},
		}
	);

	const adminQuery = useQuery(
		[DASHBOARD_QUERY_ROOT, 'admin', userId, orgId],
		() => fetchDashboardSection<AdminData>(`${baseUrl}/dashboard/summary/admin/${orgId}/${userId}`),
		{
			...queryOptions,
			enabled: queryEnabled && hasAdminAccess,
			onError: (error) => {
				console.error('❌ Dashboard admin API error:', error);
			},
		}
	);

	const adminIncomeQuery = useQuery(
		[DASHBOARD_QUERY_ROOT, 'adminIncome', userId, orgId],
		() => fetchDashboardSection<AdminIncomeData>(`${baseUrl}/dashboard/summary/admin/income/${orgId}/${userId}`),
		{
			...queryOptions,
			enabled: queryEnabled && canAccessPayments,
			onError: (error) => {
				console.error('❌ Dashboard admin income API error:', error);
			},
		}
	);

	const instructorQuery = useQuery(
		[DASHBOARD_QUERY_ROOT, 'instructor', userId, orgId],
		() => fetchDashboardSection<InstructorData>(`${baseUrl}/dashboard/summary/instructor/${orgId}/${userId}`),
		{
			...queryOptions,
			enabled: queryEnabled && isInstructor,
			onError: (error) => {
				console.error('❌ Dashboard instructor API error:', error);
			},
		}
	);

	const learnerQuery = useQuery(
		[DASHBOARD_QUERY_ROOT, 'learner', userId, orgId],
		() => fetchDashboardSection<LearnerData>(`${baseUrl}/dashboard/summary/learner/${orgId}/${userId}`),
		{
			...queryOptions,
			enabled: queryEnabled && isLearner,
			onError: (error) => {
				console.error('❌ Dashboard learner API error:', error);
			},
		}
	);

	const dashboardData = useMemo((): DashboardSummaryData | undefined => {
		if (!commonQuery.data) {
			return undefined;
		}

		let roleSpecific: AdminData | LearnerData | InstructorData | undefined;

		if (hasAdminAccess && adminQuery.data) {
			roleSpecific = {
				...adminQuery.data,
				...(adminIncomeQuery.data || {}),
			};
		} else if (isInstructor && instructorQuery.data) {
			roleSpecific = instructorQuery.data;
		} else if (isLearner && learnerQuery.data) {
			roleSpecific = learnerQuery.data;
		}

		if (!roleSpecific) {
			return undefined;
		}

		return {
			common: commonQuery.data,
			roleSpecific,
		};
	}, [
		commonQuery.data,
		adminQuery.data,
		adminIncomeQuery.data,
		instructorQuery.data,
		learnerQuery.data,
		hasAdminAccess,
		isInstructor,
		isLearner,
	]);

	const commonData = commonQuery.data;

	const roleQueryLoading =
		(hasAdminAccess && adminQuery.isLoading) ||
		(isInstructor && instructorQuery.isLoading) ||
		(isLearner && learnerQuery.isLoading);

	const incomeLoading = canAccessPayments && adminIncomeQuery.isLoading;

	const isError = commonQuery.isError || adminQuery.isError || adminIncomeQuery.isError || instructorQuery.isError || learnerQuery.isError;
	const error =
		(commonQuery.error as Error | undefined)?.message ||
		(adminQuery.error as Error | undefined)?.message ||
		(adminIncomeQuery.error as Error | undefined)?.message ||
		(instructorQuery.error as Error | undefined)?.message ||
		(learnerQuery.error as Error | undefined)?.message ||
		null;

	const refetch = async () => {
		await Promise.all([
			commonQuery.refetch(),
			hasAdminAccess ? adminQuery.refetch() : Promise.resolve(),
			canAccessPayments ? adminIncomeQuery.refetch() : Promise.resolve(),
			isInstructor ? instructorQuery.refetch() : Promise.resolve(),
			isLearner ? learnerQuery.refetch() : Promise.resolve(),
		]);
	};

	return {
		dashboardData,
		commonData,
		loading: commonQuery.isLoading || roleQueryLoading,
		commonLoading: commonQuery.isLoading,
		roleLoading: roleQueryLoading,
		incomeLoading,
		error: isError ? error || 'Failed to fetch dashboard data' : null,
		refetch,
	};
};
