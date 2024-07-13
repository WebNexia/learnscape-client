import { useCallback } from 'react';
import axios from 'axios';
import { UserQuestion } from '../interfaces/userQuestion';

export interface UserQuestionData {
	userQuestionId: string;
	questionId: string;
	userAnswer: string;
}

export const useFetchUserQuestion = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const fetchUserAnswersByLesson = useCallback(
		async (lessonId: string): Promise<UserQuestionData[]> => {
			try {
				const res = await axios.get(`${base_url}/userquestions/lesson/${lessonId}`);
				return (
					res.data.response?.map((data: UserQuestion) => ({
						userQuestionId: data._id,
						questionId: data.questionId,
						userAnswer: data.userAnswer,
					})) || []
				);
			} catch (error) {
				console.log(error);
				return [];
			}
		},
		[base_url]
	);

	return {
		fetchUserAnswersByLesson,
	};
};
