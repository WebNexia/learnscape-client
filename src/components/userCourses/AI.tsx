import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';

const AI = () => {
	const [aiResponse, setAiResponse] = useState<string>('');
	const [userPrompt, setUserPrompt] = useState<string>(
		'The question is: Which one is a common noun? Options are 1) cat, 2) London, 3) Mercedes. Learner answer is London. Correct answer is cat. Explain the correct answer.'
	);

	const API_KEY = import.meta.env.VITE_OPEN_AI_API_KEY;

	async function handleInitialSubmit() {
		const prompt = [{ role: 'user', content: 'prompt' }];

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{ role: 'system', content: 'You are a helpful assistant designed to output string.' },
					{
						role: 'user',
						content: `What is vehicle in Turkish?`,
					},
				],
				temperature: 0.7,
				max_tokens: 4000,
			}),
		});
		const data = await response.json();
		console.log(data);
		const aiResponse = data.choices[0].message.content;

		setAiResponse(aiResponse);
	}
	return (
		<Box>
			<input value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} />
			<Typography>{aiResponse}</Typography>

			<CustomSubmitButton onClick={handleInitialSubmit}>Submit</CustomSubmitButton>
		</Box>
	);
};

export default AI;
