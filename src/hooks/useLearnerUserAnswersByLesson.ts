import { useQuery, UseQueryResult } from 'react-query';
import { useFetchUserQuestion, UserQuestionData } from './useFetchUserQuestion';
import { useAuth } from './useAuth';
import { Roles } from '../interfaces/enums';

/** Answers change on submit; invalidated with userLessons / learnerLesson on progress updates. */
export const LEARNER_USER_ANSWERS_STALE_MS = 5 * 60 * 1000;
export const LEARNER_USER_ANSWERS_CACHE_MS = 10 * 60 * 1000;

export const learnerUserAnswersByLessonQueryKey = (lessonId: string | undefined): [string, string | undefined] => [
	'learnerUserAnswersByLesson',
	lessonId,
];

type UseLearnerUserAnswersByLessonOptions = {
	enabled?: boolean;
};

export const useLearnerUserAnswersByLesson = (
	lessonId: string,
	options: UseLearnerUserAnswersByLessonOptions = {}
): UseQueryResult<UserQuestionData[], Error> => {
	const { fetchUserAnswersByLesson } = useFetchUserQuestion();
	const { user } = useAuth();
	const { enabled = true } = options;

	return useQuery<UserQuestionData[], Error>(
		learnerUserAnswersByLessonQueryKey(lessonId),
		() => fetchUserAnswersByLesson(lessonId),
		{
			enabled: enabled && !!lessonId && !!user?._id && user?.role === Roles.USER,
			staleTime: LEARNER_USER_ANSWERS_STALE_MS,
			cacheTime: LEARNER_USER_ANSWERS_CACHE_MS,
			retry: 2,
			refetchOnWindowFocus: false,
		}
	);
};
