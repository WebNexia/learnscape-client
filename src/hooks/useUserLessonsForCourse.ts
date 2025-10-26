import { useQuery } from 'react-query';
import axios from '@utils/axiosInstance';
import { useAuth } from './useAuth';
import { Roles } from '../interfaces/enums';
import { UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';

// Backend response interface
interface BackendUserLessonData {
	_id: string;
	lessonId: string;
	courseId: string;
	isCompleted: boolean;
	isInProgress: boolean;
	currentQuestion?: number;
	teacherFeedback?: string;
	isFeedbackGiven?: boolean;
	updatedAt: string;
	createdAt: string;
}

export const useUserLessonsForCourse = (courseId: string) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { user } = useAuth();
	const userId = user?._id;

	return useQuery<UserLessonDataStorage[]>(
		['userLessonsForCourse', courseId, userId],
		async () => {
			if (!userId || !courseId) return [];

			const response = await axios.get(`${base_url}/userlessons/course/${courseId}/user/${userId}`);
			const backendData: BackendUserLessonData[] = response.data.response || [];

			// Transform backend response to match UserLessonDataStorage interface
			const transformedData: UserLessonDataStorage[] = backendData.map((userLesson) => ({
				lessonId: userLesson.lessonId,
				userLessonId: userLesson._id,
				courseId: userLesson.courseId,
				currentQuestion: userLesson.currentQuestion || 1,
				isCompleted: userLesson.isCompleted,
				isInProgress: userLesson.isInProgress,
				teacherFeedback: userLesson.teacherFeedback || '',
				isFeedbackGiven: userLesson.isFeedbackGiven || false,
				updatedAt: userLesson.updatedAt,
			}));

			return transformedData;
		},
		{
			enabled: !!userId && !!courseId && user?.role === Roles.USER,
			staleTime: 5 * 60 * 1000, // 5 minutes
			cacheTime: 10 * 60 * 1000, // 10 minutes
			retry: 2,
		}
	);
};
