import axios from 'axios';
import { useState } from 'react';
import { UserQuestion } from '../interfaces/userQuestion';

export interface UserQuestionData {
	userQuestionId: string;
	questionId: string;
	userAnswer: string;
}

export const useFetchUserQuestion = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [userAnswers, setUserAnswers] = useState<UserQuestionData[]>([]);

	const fetchUserAnswersByLesson = async (lessonId: string) => {
		try {
			const res = await axios.get(`${base_url}/userquestions/lesson/${lessonId}`);

			const fetchedUserQuestionDataByLesson = res.data.response?.map((data: UserQuestion) => {
				return {
					userQuestionId: data._id,
					questionId: data.questionId,
					userAnswer: data.userAnswer,
				};
			});

			setUserAnswers(fetchedUserQuestionDataByLesson);
		} catch (error) {
			console.log(error);
		}
	};
	return {
		fetchUserAnswersByLesson,
		userAnswers,
	};
};
