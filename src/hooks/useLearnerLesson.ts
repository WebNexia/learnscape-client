import { useQuery, UseQueryResult } from 'react-query';
import axios from '@utils/axiosInstance';
import { Lesson } from '../interfaces/lessons';
import { QuestionInterface } from '../interfaces/question';
import { useAuth } from './useAuth';
import { Roles } from '../interfaces/enums';

/** Lesson bodies change infrequently once published; invalidate on completion / progress mutations. */
export const LEARNER_LESSON_STALE_MS = 30 * 60 * 1000;
export const LEARNER_LESSON_CACHE_MS = 60 * 60 * 1000;

export const learnerLessonQueryKey = (lessonId: string | undefined, courseId: string | undefined): [string, string | undefined, string | undefined] => [
	'learnerLesson',
	lessonId,
	courseId,
];

export async function fetchLearnerLesson(lessonId: string, courseId: string | undefined, baseUrl: string): Promise<Lesson> {
	const res = await axios.get<Lesson>(`${baseUrl}/lessons/${lessonId}`, {
		params: courseId ? { courseId } : undefined,
	});
	const lessonData = res.data;

	return {
		...lessonData,
		questions: lessonData.questions?.filter((q: QuestionInterface | null) => q !== null) || [],
	};
}

type UseLearnerLessonOptions = {
	enabled?: boolean;
};

export const useLearnerLesson = (
	lessonId: string,
	courseId: string | undefined,
	options: UseLearnerLessonOptions = {}
): UseQueryResult<Lesson, Error> => {
	const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useAuth();
	const { enabled = true } = options;

	return useQuery<Lesson, Error>(
		learnerLessonQueryKey(lessonId, courseId),
		(): Promise<Lesson> => fetchLearnerLesson(lessonId, courseId, baseUrl),
		{
			enabled: enabled && !!lessonId && !!user?._id && user?.role === Roles.USER,
			staleTime: LEARNER_LESSON_STALE_MS,
			cacheTime: LEARNER_LESSON_CACHE_MS,
			retry: 2,
			refetchOnWindowFocus: false,
		}
	);
};
