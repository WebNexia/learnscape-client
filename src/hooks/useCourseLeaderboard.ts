import { useQuery } from 'react-query';
import { assessmentService, CourseLeaderboard } from '../services/assessmentService';

export const useCourseLeaderboard = (courseId?: string) => {
	return useQuery<CourseLeaderboard, Error>(
		['courseLeaderboard', courseId],
		() => {
			if (!courseId) {
				throw new Error('Course ID is required to fetch course leaderboard.');
			}
			return assessmentService.getCourseLeaderboard(courseId);
		},
		{
			enabled: !!courseId,
			staleTime: 5 * 60 * 1000,
			cacheTime: 10 * 60 * 1000,
		}
	);
};
