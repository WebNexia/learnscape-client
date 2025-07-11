import { useState } from 'react';
import { QuestionType } from '../interfaces/enums';

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

	const API_KEY = import.meta.env.VITE_OPEN_AI_API_KEY;

	const handleInitialSubmit = async (userPrompt: QuestionPrompt) => {
		setIsLoadingAiResponse(true);

		let promptMessage = '';

		switch (userPrompt.type) {
			case QuestionType.MULTIPLE_CHOICE:
				promptMessage = `
					Question: ${userPrompt?.question}
					Options: ${userPrompt?.options?.join(', ')}
					Correct Answer: ${userPrompt?.correctAnswer}
					${userPrompt.userInput ? `User Answer: ${userPrompt?.userInput}` : ''}
					Explain why the question's answer is correct and also give feedback according to the user's answer. If there is no user answer, ignore it, do not mention about it,  just explain the correct answer. Explain as if you are answering the user herself. Do not ask user to feel free to ask, just explain. 
				`;
				break;
			case QuestionType.TRUE_FALSE:
				promptMessage = `
					Question: ${userPrompt?.question}
					Options: True, False
					Correct Answer: ${userPrompt?.correctAnswer}
					${userPrompt.userInput ? `User Answer: ${userPrompt?.userInput}` : ''}
					Explain why the question's answer is correct and also give feedback according to the user's answer. If there is no user answer, ignore it, do not mention about it, just explain the correct answer. Explain as if you are answering the user herself. Do not ask user to feel free to ask, just explain. 
				`;
				break;
			case QuestionType.OPEN_ENDED:
				promptMessage = `
					Question: ${userPrompt?.question}
					Student's Answer: ${userPrompt?.userInput}
					Give feedback based on the user's input based on the question. Answer as if you are answering the user herself. Do not ask user to feel free to ask, just explain. 
				`;
				break;
		}

		try {
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'gpt-3.5-turbo',
					messages: [
						{ role: 'system', content: 'You are a helpful assistant designed to output string.' },
						{ role: 'user', content: promptMessage },
					],
					temperature: 0.7,
					max_tokens: 200,
				}),
			});
			const data = await response.json();
			const aiResponse = data.choices[0].message.content;
			setAiResponse(aiResponse);
		} catch (error) {
			console.error('Error fetching AI response:', error);
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
