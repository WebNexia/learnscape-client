import { useQuery, UseQueryResult } from 'react-query';
import axios from '@utils/axiosInstance';
import { Lesson } from '../interfaces/lessons';
import { QuestionInterface } from '../interfaces/question';
import { useAuth } from './useAuth';
import { Roles } from '../interfaces/enums';

export const STAFF_LESSON_PREVIEW_STALE_MS = 10 * 60 * 1000;
export const STAFF_LESSON_PREVIEW_CACHE_MS = 30 * 60 * 1000;

export const staffLessonPreviewQueryKey = (
	courseId: string | undefined,
	lessonId: string | undefined
): [string, string | undefined, string | undefined] => ['staffLessonPreview', courseId, lessonId];

export async function fetchStaffLessonPreview(courseId: string, lessonId: string, baseUrl: string): Promise<Lesson> {
	const res = await axios.get<{ status: number; data: Lesson }>(
		`${baseUrl}/courses/${courseId}/staff-preview/lessons/${lessonId}`
	);
	const lessonData = res.data?.data;
	return {
		...lessonData,
		questions: lessonData.questions?.filter((q: QuestionInterface | null) => q !== null) || [],
	};
}

type UseStaffLessonPreviewOptions = {
	enabled?: boolean;
};

const isStaffRole = (role?: string) =>
	role === Roles.ADMIN || role === Roles.OWNER || role === Roles.SUPER_ADMIN || role === Roles.INSTRUCTOR;

export const useStaffLessonPreview = (
	courseId: string,
	lessonId: string,
	options: UseStaffLessonPreviewOptions = {}
): UseQueryResult<Lesson, Error> => {
	const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useAuth();
	const { enabled = true } = options;

	return useQuery<Lesson, Error>(
		staffLessonPreviewQueryKey(courseId, lessonId),
		(): Promise<Lesson> => fetchStaffLessonPreview(courseId, lessonId, baseUrl),
		{
			enabled: enabled && !!courseId && !!lessonId && !!user?._id && isStaffRole(user?.role),
			staleTime: STAFF_LESSON_PREVIEW_STALE_MS,
			cacheTime: STAFF_LESSON_PREVIEW_CACHE_MS,
			retry: 1,
			refetchOnWindowFocus: false,
		}
	);
};
