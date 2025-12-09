import { useQuery } from 'react-query';
import { assessmentService, UserCourseAnalytics } from '../services/assessmentService';

export const useUserCourseAnalytics = (courseId?: string) => {
	return useQuery<UserCourseAnalytics, Error>(
		['userCourseAnalytics', courseId],
		() => {
			if (!courseId) {
				throw new Error('Course ID is required to fetch course analytics.');
			}
			return assessmentService.getUserCourseAnalytics(courseId);
		},
		{
			enabled: !!courseId,
			staleTime: 5 * 60 * 1000,
			cacheTime: 10 * 60 * 1000,
		}
	);
};
