import { useQuery, useQueryClient, UseQueryResult } from 'react-query';
import axios from '@utils/axiosInstance';
import { SingleCourse } from '../interfaces/course';
import { useAuth } from './useAuth';
import { isLearnerRole } from '../interfaces/enums';

/** Course outline changes infrequently once live; progress uses userLessons cache separately. */
export const LEARNER_COURSE_SHELL_STALE_MS = 30 * 60 * 1000;
export const LEARNER_COURSE_SHELL_CACHE_MS = 60 * 60 * 1000;

export const learnerCourseShellQueryKey = (courseId: string | undefined): [string, string | undefined] => [
	'learnerCourseShell',
	courseId,
];

export async function fetchLearnerCourseShell(courseId: string, baseUrl: string): Promise<SingleCourse | null> {
	const res = await axios.get<{ data: SingleCourse }>(`${baseUrl}/courses/activelessons/${courseId}`);
	return res.data?.data ?? null;
}

type UseLearnerCourseShellOptions = {
	enabled?: boolean;
};

export const useLearnerCourseShell = (
	courseId: string,
	options: UseLearnerCourseShellOptions = {}
): UseQueryResult<SingleCourse | null, Error> => {
	const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;
	const queryClient = useQueryClient();
	const { user } = useAuth();
	const userId = user?._id;
	const { enabled = true } = options;

	return useQuery<SingleCourse | null, Error>(
		learnerCourseShellQueryKey(courseId),
		(): Promise<SingleCourse | null> => fetchLearnerCourseShell(courseId, baseUrl),
		{
			enabled: enabled && !!courseId && !!userId && isLearnerRole(user?.role),
			staleTime: LEARNER_COURSE_SHELL_STALE_MS,
			cacheTime: LEARNER_COURSE_SHELL_CACHE_MS,
			retry: 2,
			refetchOnWindowFocus: false,
			onSuccess: () => {
				// activelessons may lazily create the first UserLesson (cohort after start).
				if (userId && courseId) {
					void queryClient.invalidateQueries(['userLessonsForCourse', courseId, userId]);
				}
			},
		}
	);
};
