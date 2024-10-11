import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { MatchingPair, QuestionInterface } from '../../../interfaces/question';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import MatchingPreview from './MatchingPreview';
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';
import { Lesson } from '../../../interfaces/lessons';
import { QuestionUpdateTrack } from '../../../pages/AdminLessonEditPage';
import { questionLessonUpdateTrack } from '../../../utils/questionLessonUpdateTrack';
import { LessonType } from '../../../interfaces/enums';
import CustomInfoMessageAlignedRight from '../infoMessage/CustomInfoMessageAlignedRight';

interface MatchingProps {
	question?: QuestionInterface;
	existingQuestion?: boolean;
	matchingPairs?: MatchingPair[];
	lessonType?: string;
	setNewQuestion?: React.Dispatch<React.SetStateAction<QuestionInterface>>;
	setIsMinimumTwoMatchingPairs?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingPair: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave?: React.Dispatch<React.SetStateAction<Lesson>> | undefined;
	setIsLessonUpdated?: React.Dispatch<React.SetStateAction<boolean>> | undefined;
	setIsQuestionUpdated?: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>> | undefined;
	setMatchingPairsAdminQuestions?: React.Dispatch<React.SetStateAction<MatchingPair[]>>;
}

const Matching = ({
	question,
	existingQuestion,
	matchingPairs = [],
	lessonType,
	setNewQuestion,
	setIsMinimumTwoMatchingPairs,
	setIsMissingPair,
	setSingleLessonBeforeSave,
	setIsLessonUpdated,
	setIsQuestionUpdated,
	setMatchingPairsAdminQuestions,
}: MatchingProps) => {
	const [pairs, setPairs] = useState<MatchingPair[]>(() =>
		existingQuestion ? matchingPairs : [{ id: generateUniqueId('pair-'), question: '', answer: '' }]
	);

	const updatePairs = (newPairs: MatchingPair[]) => {
		setPairs(newPairs);
		if (setMatchingPairsAdminQuestions) setMatchingPairsAdminQuestions(newPairs);

		if (setNewQuestion) {
			setNewQuestion((prevData) => ({ ...prevData, matchingPairs: newPairs }));
		}

		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;
				const updatedQuestions = prevData.questions.map((prevQuestion) =>
					prevQuestion?._id === question?._id ? { ...prevQuestion, matchingPairs: newPairs } : prevQuestion
				);
				return { ...prevData, questions: updatedQuestions };
			});
			if (question) questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
		}

		const nonBlankPairs = newPairs?.filter((pair) => pair.question.trim() && pair.answer.trim());
		const missingPairExists = newPairs.some((pair) => !pair.question.trim() || !pair.answer.trim());

		setIsMinimumTwoMatchingPairs?.(nonBlankPairs.length < 2);
		setIsMissingPair?.(missingPairExists);
	};

	const handlePairChange = (index: number, field: 'question' | 'answer', value: string) => {
		const newPairs = pairs?.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair));
		updatePairs(newPairs);
	};

	const addPair = () => {
		const newPair = { id: generateUniqueId('pair-'), question: '', answer: '' };
		updatePairs([...pairs, newPair]);
	};

	const removePair = (index: number) => {
		const newPairs = pairs?.filter((_, i) => i !== index);
		updatePairs(newPairs);
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: '2rem', width: '100%' }}>
			{pairs?.map((pair, index) => (
				<Box key={pair.id} sx={{ display: 'flex', mb: '0.5rem', width: '90%', alignItems: 'center' }}>
					<CustomTextField
						placeholder='Pair Key'
						value={pair.question}
						onChange={(e) => handlePairChange(index, 'question', e.target.value)}
						required
						sx={{ marginRight: '1.5rem' }}
					/>
					<CustomTextField
						placeholder='Pair Value'
						value={pair.answer}
						onChange={(e) => handlePairChange(index, 'answer', e.target.value)}
						required
						sx={{ marginRight: '1.5rem' }}
					/>
					<Tooltip title='Remove Pair' placement='right'>
						<IconButton
							onClick={() => removePair(index)}
							sx={{
								mb: '0.85rem',
								':hover': { backgroundColor: 'transparent' },
							}}>
							<RemoveCircle />
						</IconButton>
					</Tooltip>
				</Box>
			))}
			<Box sx={{ width: '90%' }}>
				<Tooltip title='Add Pair' placement='right'>
					<IconButton onClick={addPair} sx={{ mb: '0.85rem', ':hover': { backgroundColor: 'transparent' } }}>
						<AddCircle />
					</IconButton>
				</Tooltip>
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '90%', mt: '3rem' }}>
					<Box>
						<Typography variant='h5'>Student View </Typography>
					</Box>
					<CustomInfoMessageAlignedRight message={`View as in a ${lessonType === LessonType.QUIZ ? 'quiz' : 'practice lesson'}`} />
				</Box>
				<MatchingPreview initialPairs={pairs} lessonType={lessonType} />
			</Box>
		</Box>
	);
};

export default Matching;
