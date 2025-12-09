import { useQuery } from 'react-query';
import { assessmentService, UserCourseRankAnalytics } from '../services/assessmentService';

export const useUserCourseRank = (courseId?: string) => {
	return useQuery<UserCourseRankAnalytics, Error>(
		['userCourseRank', courseId],
		() => {
			if (!courseId) {
				throw new Error('Course ID is required to fetch course rank analytics.');
			}
			return assessmentService.getUserCourseRank(courseId);
		},
		{
			enabled: !!courseId,
			staleTime: 5 * 60 * 1000,
			cacheTime: 10 * 60 * 1000,
		}
	);
};
