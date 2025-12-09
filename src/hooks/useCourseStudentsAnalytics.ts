import { useQuery } from 'react-query';
import { assessmentService, CourseStudentsAnalytics } from '../services/assessmentService';

export const useCourseStudentsAnalytics = (courseId?: string) => {
	return useQuery<CourseStudentsAnalytics, Error>(
		['courseStudentsAnalytics', courseId],
		() => {
			if (!courseId) {
				throw new Error('Course ID is required to fetch course students analytics.');
			}
			return assessmentService.getCourseStudentsAnalytics(courseId);
		},
		{
			enabled: !!courseId,
			staleTime: 5 * 60 * 1000,
			cacheTime: 10 * 60 * 1000,
		}
	);
};
