import { useQuery, UseQueryResult } from 'react-query';
import axios from '@utils/axiosInstance';
import { SingleCourse } from '../interfaces/course';
import { useAuth } from './useAuth';
import { Roles } from '../interfaces/enums';

export const STAFF_COURSE_PREVIEW_STALE_MS = 10 * 60 * 1000;
export const STAFF_COURSE_PREVIEW_CACHE_MS = 30 * 60 * 1000;

export const staffCoursePreviewQueryKey = (courseId: string | undefined): [string, string | undefined] => [
	'staffCoursePreview',
	courseId,
];

export async function fetchStaffCoursePreview(courseId: string, baseUrl: string): Promise<SingleCourse> {
	const res = await axios.get<{ status: number; data: SingleCourse }>(`${baseUrl}/courses/${courseId}/staff-preview`);
	return res.data?.data;
}

type UseStaffCoursePreviewOptions = {
	enabled?: boolean;
};

const isStaffRole = (role?: string) =>
	role === Roles.ADMIN || role === Roles.OWNER || role === Roles.SUPER_ADMIN || role === Roles.INSTRUCTOR;

export const useStaffCoursePreview = (
	courseId: string,
	options: UseStaffCoursePreviewOptions = {}
): UseQueryResult<SingleCourse, Error> => {
	const baseUrl = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useAuth();
	const { enabled = true } = options;

	return useQuery<SingleCourse, Error>(
		staffCoursePreviewQueryKey(courseId),
		(): Promise<SingleCourse> => fetchStaffCoursePreview(courseId, baseUrl),
		{
			enabled: enabled && !!courseId && !!user?._id && isStaffRole(user?.role),
			staleTime: STAFF_COURSE_PREVIEW_STALE_MS,
			cacheTime: STAFF_COURSE_PREVIEW_CACHE_MS,
			retry: 1,
			refetchOnWindowFocus: false,
		}
	);
};
