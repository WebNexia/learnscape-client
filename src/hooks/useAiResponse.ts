import { useState } from 'react';
import { QuestionType } from '../interfaces/enums';
import axiosInstance from '../utils/axiosInstance';

export interface QuestionPrompt {
	question: string;
	type: string;
	options?: string[];
	correctAnswer?: string;
	userInput?: string;
}

const useAiResponse = () => {
	const [aiResponse, setAiResponse] = useState<string>('');
	const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);

	const handleInitialSubmit = async (userPrompt: QuestionPrompt) => {
		setIsLoadingAiResponse(true);

		try {
			const response = await axiosInstance.post('/ai/feedback', {
				question: userPrompt.question,
				type: userPrompt.type,
				options: userPrompt.options,
				correctAnswer: userPrompt.correctAnswer,
				userInput: userPrompt.userInput,
			});
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
