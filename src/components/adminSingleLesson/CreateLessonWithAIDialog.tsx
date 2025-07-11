import { DialogContent, Typography, Box } from '@mui/material';
import { useState } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import useLessonAiResponse from '../../hooks/useLessonAiResponse';
import TypingAnimation from '../layouts/loading/TypingAnimation';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';

interface CreateLessonWithAIDialogProps {
	isAiInstructionModalOpen: boolean;
	setIsAiInstructionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	onContentGenerated?: (content: string) => void;
}

const CreateLessonWithAIDialog = ({ isAiInstructionModalOpen, setIsAiInstructionModalOpen, onContentGenerated }: CreateLessonWithAIDialogProps) => {
	const [topic, setTopic] = useState<string>('');
	const [level, setLevel] = useState<string>('');
	const [prompt, setPrompt] = useState<string>('');
	const [error, setError] = useState<string>('');

	const { generateLessonContent, isLoadingAiResponse } = useLessonAiResponse();

	const handleSubmit = async () => {
		if (!topic.trim() || !level.trim() || !prompt.trim()) {
			setError('Please fill in all fields');
			return;
		}

		setError('');

		try {
			const content = await generateLessonContent({
				topic: topic.trim(),
				level: level.trim(),
				description: prompt.trim(),
			});

			// Pass the generated content back to parent component
			if (onContentGenerated) {
				onContentGenerated(content);
			}

			// Close the modal and reset form
			handleCancel();
		} catch (error) {
			setError('Failed to generate lesson content. Please try again.');
		}
	};

	const handleCancel = () => {
		setTopic('');
		setLevel('');
		setPrompt('');
		setError('');
		setIsAiInstructionModalOpen(false);
	};

	return (
		<CustomDialog openModal={isAiInstructionModalOpen} closeModal={handleCancel} title='Create lesson with AI' maxWidth='xs'>
			<DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
				<Typography variant='body2' sx={{ mb: 2 }}>
					Enter the lesson details below and AI will generate comprehensive lesson content for you.
				</Typography>

				<CustomTextField
					label='Topic'
					value={topic}
					onChange={(e) => {
						setTopic(e.target.value);
						setError('');
					}}
					placeholder='e.g., Photosynthesis, Algebra, WW II, Python Programming'
					InputProps={{ inputProps: { maxLength: 100 } }}
					sx={{ mt: '0.75rem', mb: '1rem' }}
				/>
				<CustomTextField
					label='Level'
					value={level}
					onChange={(e) => {
						setLevel(e.target.value);
						setError('');
					}}
					placeholder='e.g., Beginner, Intermediate, Advanced, 8th Grade, High School'
					InputProps={{ inputProps: { maxLength: 100 } }}
					sx={{ mb: '1rem' }}
				/>
				<CustomTextField
					label='Prompt'
					multiline
					resizable
					rows={6}
					value={prompt}
					onChange={(e) => {
						setPrompt(e.target.value);
						setError('');
					}}
					placeholder="Provide detailed instructions for the AI. For example: 'Create a lesson about photosynthesis for 8th grade students. Include hands-on activities, visual examples, and a quiz at the end. Focus on the chemical process and make it engaging for teenagers.'"
					sx={{ mb: '1rem' }}
				/>

				{error && <CustomErrorMessage sx={{ fontSize: '0.75rem' }}>{error}</CustomErrorMessage>}

				{isLoadingAiResponse && (
					<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
						<TypingAnimation />
					</Box>
				)}
			</DialogContent>
			<CustomDialogActions
				submitBtnText='Generate Content'
				cancelBtnText='Cancel'
				onCancel={handleCancel}
				onSubmit={handleSubmit}
				actionSx={{ margin: '0 0.5rem 0.5rem 0' }}
				disableBtn={isLoadingAiResponse}
				disableCancelBtn={isLoadingAiResponse}
			/>
		</CustomDialog>
	);
};

export default CreateLessonWithAIDialog;
