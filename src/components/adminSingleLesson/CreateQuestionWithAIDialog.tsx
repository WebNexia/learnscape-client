import { DialogContent, Typography, Box, FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useContext, useState } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import useQuestionAiResponse from '../../hooks/useQuestionAiResponse';
import TypingAnimation from '../layouts/loading/TypingAnimation';
import CustomErrorMessage from '../forms/customFields/CustomErrorMessage';
import theme from '../../themes';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import { LessonType } from '../../interfaces/enums';

interface CreateQuestionWithAIDialogProps {
	isAiQuestionModalOpen: boolean;
	setIsAiQuestionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	lessonType: string;
	onQuestionsGenerated?: (questions: string, questionType: string) => void;
}

const CreateQuestionWithAIDialog = ({
	isAiQuestionModalOpen,
	setIsAiQuestionModalOpen,
	lessonType,
	onQuestionsGenerated,
}: CreateQuestionWithAIDialogProps) => {
	const { questionTypes } = useContext(QuestionsContext);

	const [topic, setTopic] = useState<string>('');
	const [level, setLevel] = useState<string>('');
	const [numberOfQuestions, setNumberOfQuestions] = useState<string>('');
	const [questionType, setQuestionType] = useState<string>('');
	const [prompt, setPrompt] = useState<string>('');
	const [error, setError] = useState<string>('');

	const { generateQuestions, isLoadingAiResponse } = useQuestionAiResponse();

	const handleSubmit = async () => {
		if (!topic.trim() || !level.trim() || !numberOfQuestions || !questionType.trim() || !prompt.trim()) {
			setError('Please fill in all fields');
			return;
		}

		setError('');

		try {
			const questions = await generateQuestions({
				topic: topic.trim(),
				level: level.trim(),
				numberOfQuestions: numberOfQuestions,
				questionType: questionType.trim(),
				description: prompt.trim(),
			});

			// Pass the generated questions back to parent component
			if (onQuestionsGenerated) {
				onQuestionsGenerated(JSON.stringify(questions), questionType);
			}

			// Close the modal and reset form
			handleCancel();
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError('Failed to generate questions. Please try again.');
			}
		}
	};

	const handleCancel = () => {
		setTopic('');
		setLevel('');
		setNumberOfQuestions('');
		setQuestionType('');
		setPrompt('');
		setError('');
		setIsAiQuestionModalOpen(false);
	};

	return (
		<CustomDialog openModal={isAiQuestionModalOpen} closeModal={handleCancel} title='Create question with AI' maxWidth='xs'>
			<DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
				<Typography variant='body2' sx={{ mb: 2 }}>
					Enter the question details below and AI will generate questions for you.
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
				<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', mb: '1rem' }}>
					<FormControl sx={{ flex: 1, mr: '1rem' }}>
						<Select
							displayEmpty
							value={numberOfQuestions}
							onChange={(e: SelectChangeEvent<string>) => {
								setNumberOfQuestions(e.target.value);
								setError('');
							}}
							size='small'
							required
							sx={{ backgroundColor: theme.bgColor?.common, fontSize: '0.8rem' }}>
							<MenuItem value='' disabled sx={{ fontSize: '0.8rem' }}>
								Number of Questions
							</MenuItem>
							{['1', '2', '3', '4', '5']?.map((num) => (
								<MenuItem value={num} key={num} sx={{ fontSize: '0.85rem' }}>
									{num}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<FormControl sx={{ flex: 1 }}>
						<Select
							displayEmpty
							value={questionType}
							onChange={(e: SelectChangeEvent<string>) => {
								setQuestionType(e.target.value);
								setError('');
							}}
							size='small'
							required
							sx={{ backgroundColor: theme.bgColor?.common, fontSize: '0.8rem' }}>
							<MenuItem value='' disabled sx={{ fontSize: '0.8rem' }}>
								Question Type
							</MenuItem>
							{questionTypes
								?.filter((type) => {
									// Use the actual type.name instead of casting to enum
									if (lessonType === LessonType.QUIZ) {
										return ['Multiple Choice', 'True-False', 'Open-ended', 'Audio/Video', 'Matching', 'FITB-Typing', 'FITB-Drag/Drop']?.includes(
											type.name
										);
									} else if (lessonType === LessonType.PRACTICE_LESSON) {
										return ['Multiple Choice', 'True-False', 'Open-ended', 'Matching', 'FITB-Typing', 'FITB-Drag/Drop', 'Flip Card']?.includes(
											type.name
										);
									}
									return true;
								})
								?.map((type) => (
									<MenuItem value={type.name} key={type._id} sx={{ fontSize: '0.85rem' }}>
										{type.name}
									</MenuItem>
								))}
						</Select>
					</FormControl>
				</Box>

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
					placeholder="Provide detailed instructions for the AI. For example: 'Create questions about photosynthesis for 8th grade students. Focus on the chemical process, plant structures, and environmental factors. Make questions engaging and test understanding.'"
					InputProps={{ inputProps: { maxLength: 750 } }}
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
				submitBtnText='Generate Questions'
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

export default CreateQuestionWithAIDialog;
