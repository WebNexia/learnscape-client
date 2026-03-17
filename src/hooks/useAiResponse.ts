import { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

export interface QuestionPrompt {
	question: string;
	type: string;
	options?: string[];
	correctAnswer?: string;
	userInput?: string;
	/** Lesson content (plain text) for open-ended AI context */
	lessonText?: string;
	/** Chapter name for open-ended AI context */
	chapterName?: string;
}

const useAiResponse = () => {
	const [aiResponse, setAiResponse] = useState<string>('');
	const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);

	const handleInitialSubmit = async (userPrompt: QuestionPrompt) => {
		setIsLoadingAiResponse(true);

		try {
			const body: Record<string, unknown> = {
				question: userPrompt.question,
				type: userPrompt.type,
				options: userPrompt.options,
				correctAnswer: userPrompt.correctAnswer,
				userInput: userPrompt.userInput,
			};
			if (userPrompt.lessonText != null) body.lessonText = userPrompt.lessonText;
			if (userPrompt.chapterName != null) body.chapterName = userPrompt.chapterName;
			const response = await axiosInstance.post('/ai/feedback', body);
			const responseText = response.data?.data ?? '';
			setAiResponse(responseText);
			return responseText;
		} catch (error) {
			console.error('Error fetching AI response:', error);
			return '';
		} finally {
			setIsLoadingAiResponse(false);
		}
	};

	return {
		aiResponse,
		isLoadingAiResponse,
		handleInitialSubmit,
	};
};

export default useAiResponse;
