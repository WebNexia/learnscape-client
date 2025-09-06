import { useState } from 'react';

export interface LessonPrompt {
	topic: string;
	level: string;
	description: string;
}

const useLessonAiResponse = () => {
	const [aiResponse, setAiResponse] = useState<string>('');
	const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
	const [lastRequestTime, setLastRequestTime] = useState<number>(0);

	const API_KEY = import.meta.env.VITE_OPEN_AI_API_KEY;

	const generateLessonContent = async (lessonPrompt: LessonPrompt) => {
		// Rate limiting: prevent requests more frequent than every 1 second
		const now = Date.now();
		const timeSinceLastRequest = now - lastRequestTime;

		if (timeSinceLastRequest < 1000) {
			throw new Error('Please wait 1 second before generating another lesson.');
		}

		setIsLoadingAiResponse(true);
		setLastRequestTime(now);

		const promptMessage = `
			Create a comprehensive lesson content based on the following requirements:
			
			Topic: ${lessonPrompt.topic}
			Level: ${lessonPrompt.level}
			Additional Instructions: ${lessonPrompt.description}
			
			Please create a well-structured lesson that includes:
			- An engaging introduction
			- Clear learning objectives
			- Main content sections with explanations
			- Examples and practical applications
			- A summary of key points
			- Suggested activities or exercises
			
			Format the content in HTML with proper headings, paragraphs, and formatting.
			Make it engaging and appropriate for the specified level.
			Keep the content educational, clear, and well-organized.
		`;

		try {
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					model: 'gpt-3.5-turbo-16k',
					messages: [
						{
							role: 'system',
							content:
								'You are an expert educational content creator. Create engaging, well-structured lesson content in HTML format with proper formatting and structure.',
						},
						{ role: 'user', content: promptMessage },
					],
					temperature: 0.7,
					max_tokens: 4000,
				}),
			});

			const data = await response.json();

			if (response.status === 429) {
				throw new Error('OpenAI rate limit exceeded. Please wait 1-2 minutes before trying again.');
			}

			if (!response.ok) {
				if (response.status === 429) {
					throw new Error('OpenAI rate limit exceeded. Please wait 1-2 minutes before trying again.');
				}
				throw new Error(data.error?.message || `API Error: ${response.status}`);
			}

			if (data.error) {
				throw new Error(data.error.message);
			}

			const aiResponse = data.choices[0].message.content;
			setAiResponse(aiResponse);
			return aiResponse;
		} catch (error) {
			console.error('Error generating lesson content:', error);

			// Provide specific error messages
			if (error instanceof Error) {
				if (error.message?.includes('Please wait 1 second')) {
					// This is our local rate limiting
					throw error;
				} else if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
					throw new Error('OpenAI rate limit exceeded. Please wait 1-2 minutes before trying again.');
				} else if (error.message?.includes('API key')) {
					throw new Error('API key error. Please check your configuration.');
				} else {
					throw new Error(`Failed to generate lesson content: ${error.message}`);
				}
			}

			throw new Error('Failed to generate lesson content. Please try again.');
		} finally {
			setIsLoadingAiResponse(false);
		}
	};

	return {
		aiResponse,
		isLoadingAiResponse,
		generateLessonContent,
	};
};

export default useLessonAiResponse;
