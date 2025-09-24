import { useQueryClient } from 'react-query';

/**
 * Simple dashboard sync utility
 * Refreshes dashboard data when changes occur
 */
export const useDashboardSync = () => {
	const queryClient = useQueryClient();

	const refreshDashboard = () => {
		// Invalidate and refetch dashboard data
		queryClient.invalidateQueries(['dashboardSummary']);

		// Also try to refetch immediately
		queryClient.refetchQueries(['dashboardSummary']);
	};

	const refreshQuizSubmissions = () => {
		// Invalidate learner quiz submissions cache
		queryClient.invalidateQueries(['learnerQuizSubmissions']);

		// Invalidate admin/instructor quiz submissions cache
		queryClient.invalidateQueries(['allAdminQuizSubmissions']);

		// Also try to refetch immediately
		queryClient.refetchQueries(['learnerQuizSubmissions']);
		queryClient.refetchQueries(['allAdminQuizSubmissions']);
	};

	return { refreshDashboard, refreshQuizSubmissions };
};

/**
 * Helper functions to trigger dashboard refresh
 * Call these after actions that affect dashboard data
 */
export const dashboardSyncHelpers = {
	// Course related
	onCourseEnrolled: (refreshDashboard: () => void) => {
		refreshDashboard();
	},

	onCourseCompleted: (refreshDashboard: () => void) => {
		refreshDashboard();
	},

	// Lesson related
	onLessonCompleted: (refreshDashboard: () => void) => {
		refreshDashboard();
	},

	// Quiz related
	onQuizSubmitted: (refreshDashboard: () => void, refreshQuizSubmissions: () => void) => {
		refreshDashboard();
		refreshQuizSubmissions();
	},

	// Event related
	onEventCreated: (refreshDashboard: () => void) => {
		refreshDashboard();
	},

	// Community related
	onTopicCreated: (refreshDashboard: () => void) => {
		refreshDashboard();
	},

	// Payment related
	onPaymentCompleted: (refreshDashboard: () => void) => {
		refreshDashboard();
	},

	// Inquiry related
	onInquiryCreated: (refreshDashboard: () => void) => {
		refreshDashboard();
	},
};
