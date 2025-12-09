import axiosInstance from '../utils/axiosInstance';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

export interface AssessmentAttemptSummary {
	submissionId: string;
	assessmentType: 'pre' | 'post' | 'none';
	createdAt: string;
	updatedAt: string;
	scoreRaw: number | null;
	scoreMax: number | null;
	scorePercent: number | null;
}

export interface AssessmentSummary {
	userId: string;
	assessmentGroupId: string;
	pre: AssessmentAttemptSummary | null;
	post: AssessmentAttemptSummary | null;
}

export interface UserCourseAnalytics {
	courseId: string;
	userId: string;
	totalPossibleScore: number;
	totalEarnedScore: number;
	percent: number | null;
}

export interface CourseStudentAnalyticsItem {
	userId: string;
	name: string;
	email: string | null;
	phone?: string | null;
	countryCode?: string | null;
	totalEarnedScore: number;
	percent: number | null;
	rank: number;
}

export interface CourseStudentsAnalytics {
	courseId: string;
	totalPossibleScore: number;
	completedStudentsCount: number;
	students: CourseStudentAnalyticsItem[];
}

export interface UserCourseRankAnalytics {
	courseId: string;
	totalPossibleScore: number;
	totalStudents: number;
	rank: number | null;
	totalEarnedScore: number;
	percent: number | null;
}

export interface CourseLeaderboardItem {
	userId: string;
	name: string;
	imageUrl: string | null;
	totalEarnedScore: number;
	percent: number | null;
	rank: number;
	isCurrentUser: boolean;
}

export interface CourseLeaderboard {
	courseId: string;
	totalPossibleScore: number;
	totalStudents: number;
	leaderboard: CourseLeaderboardItem[];
}

export const assessmentService = {
	getUserAssessmentSummary: async (userId: string, groupId: string): Promise<AssessmentSummary> => {
		const response = await axiosInstance.get(`${base_url}/quizsubmissions/assessments/user/${userId}/group/${groupId}/summary`);
		return response.data.data as AssessmentSummary;
	},

	getUserCourseAnalytics: async (courseId: string): Promise<UserCourseAnalytics> => {
		const response = await axiosInstance.get(`${base_url}/courses/${courseId}/analytics/me`);
		return response.data.data as UserCourseAnalytics;
	},

	getUserCourseRank: async (courseId: string): Promise<UserCourseRankAnalytics> => {
		const response = await axiosInstance.get(`${base_url}/courses/${courseId}/analytics/me/rank`);
		return response.data.data as UserCourseRankAnalytics;
	},

	getCourseLeaderboard: async (courseId: string): Promise<CourseLeaderboard> => {
		const response = await axiosInstance.get(`${base_url}/courses/${courseId}/analytics/leaderboard`);
		return response.data.data as CourseLeaderboard;
	},

	getCourseStudentsAnalytics: async (courseId: string): Promise<CourseStudentsAnalytics> => {
		const response = await axiosInstance.get(`${base_url}/courses/${courseId}/analytics/students`);
		return response.data.data as CourseStudentsAnalytics;
	},
};
