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

interface MatchingProps {
	question?: QuestionInterface;
	existingQuestion?: boolean;
	matchingPairs?: MatchingPair[];
	setNewQuestion?: React.Dispatch<React.SetStateAction<QuestionInterface>>;
	setIsMinimumTwoMatchingPairs?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingPair: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave?: React.Dispatch<React.SetStateAction<Lesson>> | undefined;
	setIsLessonUpdated?: React.Dispatch<React.SetStateAction<boolean>> | undefined;
	setIsQuestionUpdated?: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>> | undefined;
	setMatchingPairsAdminQuestions: React.Dispatch<React.SetStateAction<MatchingPair[]>>;
}

const Matching = ({
	question,
	existingQuestion,
	matchingPairs,
	setNewQuestion,
	setIsMinimumTwoMatchingPairs,
	setIsMissingPair,
	setSingleLessonBeforeSave,
	setIsLessonUpdated,
	setIsQuestionUpdated,
	setMatchingPairsAdminQuestions,
}: MatchingProps) => {
	const [pairs, setPairs] = useState<MatchingPair[]>(() => {
		if (existingQuestion && matchingPairs) {
			return matchingPairs;
		} else {
			return [{ id: generateUniqueId('pair-'), question: '', answer: '' }];
		}
	});

	const handlePairChange = (index: number, field: 'question' | 'answer', value: string) => {
		const newPairs = [...pairs];
		newPairs[index][field] = value;
		setPairs(newPairs);
		if (setNewQuestion) {
			setNewQuestion((prevData) => {
				if (prevData) {
					return { ...prevData, matchingPairs: newPairs };
				}
				return prevData;
			});
		}

		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;
				const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
					if (prevQuestion !== null && prevQuestion._id === question?._id) {
						return { ...prevQuestion, matchingPairs: newPairs };
					} else {
						return prevQuestion;
					}
				});

				return { ...prevData, questions: updatedQuestions };
			});
			if (question) {
				questionLessonUpdateTrack(question?._id, setIsLessonUpdated, setIsQuestionUpdated);
			}
		}

		setMatchingPairsAdminQuestions(newPairs);

		const nonBlankPairs = newPairs.filter((pair) => pair.question.trim() !== '' && pair.answer.trim() !== '');
		const missingPairExists = newPairs.find((pair) => pair.question.trim() === '' || pair.answer.trim() === '');

		if (nonBlankPairs.length >= 2 && setIsMinimumTwoMatchingPairs) {
			setIsMinimumTwoMatchingPairs(false);
		}

		if (!missingPairExists && setIsMissingPair) {
			setIsMissingPair(false);
		}
	};

	const addPair = () => {
		setPairs([...pairs, { id: generateUniqueId('pair-'), question: '', answer: '' }]);
		if (setNewQuestion) {
			setNewQuestion((prevData) => {
				if (prevData) {
					return { ...prevData, matchingPairs: [...pairs, { id: generateUniqueId('pair-'), question: '', answer: '' }] };
				}
				return prevData;
			});
		}

		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;
				const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
					if (prevQuestion !== null && prevQuestion._id === question?._id) {
						return { ...prevQuestion, matchingPairs: [...pairs, { id: generateUniqueId('pair-'), question: '', answer: '' }] };
					} else {
						return prevQuestion;
					}
				});

				return { ...prevData, questions: updatedQuestions };
			});
			if (question) {
				questionLessonUpdateTrack(question?._id, setIsLessonUpdated, setIsQuestionUpdated);
			}
		}

		setMatchingPairsAdminQuestions([...pairs, { id: generateUniqueId('pair-'), question: '', answer: '' }]);
	};

	const removePair = (index: number) => {
		const newPairs = pairs.filter((_, i) => i !== index);
		setPairs(newPairs);
		if (setNewQuestion) {
			setNewQuestion((prevData) => {
				if (prevData) {
					return { ...prevData, matchingPairs: newPairs };
				}
				return prevData;
			});
		}

		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;
				const updatedQuestions = prevData?.questions?.map((prevQuestion) => {
					if (prevQuestion !== null && prevQuestion._id === question?._id) {
						return { ...prevQuestion, matchingPairs: newPairs };
					} else {
						return prevQuestion;
					}
				});

				return { ...prevData, questions: updatedQuestions };
			});
			if (question) {
				questionLessonUpdateTrack(question?._id, setIsLessonUpdated, setIsQuestionUpdated);
			}
		}
		setMatchingPairsAdminQuestions(newPairs);
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: '2rem', width: '100%' }}>
			{pairs.map((pair, index) => (
				<Box key={pair.id} style={{ display: 'flex', marginBottom: '0.5rem', width: '90%', alignItems: 'center' }}>
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
								marginBottom: '0.85rem',
								':hover': {
									backgroundColor: 'transparent',
								},
							}}>
							<RemoveCircle />
						</IconButton>
					</Tooltip>
				</Box>
			))}
			<Box sx={{ width: '90%' }}>
				<Tooltip title='Add Pair' placement='right'>
					<IconButton
						onClick={addPair}
						sx={{
							marginBottom: '0.85rem',
							':hover': {
								backgroundColor: 'transparent',
							},
						}}>
						<AddCircle />
					</IconButton>
				</Tooltip>
			</Box>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
				<Box sx={{ textAlign: 'left', width: '90%', marginTop: '3rem' }}>
					<Typography variant='h5'>PREVIEW</Typography>
				</Box>
				<MatchingPreview initialPairs={pairs} />
			</Box>
		</Box>
	);
};

export default Matching;
