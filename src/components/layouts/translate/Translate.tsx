import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { TranslatePair, QuestionInterface } from '../../../interfaces/question';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';
import { Lesson } from '../../../interfaces/lessons';
import { QuestionUpdateTrack } from '../../../pages/AdminLessonEditPage';
import { questionLessonUpdateTrack } from '../../../utils/questionLessonUpdateTrack';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface TranslateProps {
	question?: QuestionInterface;
	existingQuestion?: boolean;
	translatePairs?: TranslatePair[];
	setNewQuestion?: React.Dispatch<React.SetStateAction<QuestionInterface>>;
	setIsMinimumOneTranslatePair?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingPair: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave?: React.Dispatch<React.SetStateAction<Lesson>> | undefined;
	setIsLessonUpdated?: React.Dispatch<React.SetStateAction<boolean>> | undefined;
	setIsQuestionUpdated?: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>> | undefined;
	setTranslatePairsAdminQuestions?: React.Dispatch<React.SetStateAction<TranslatePair[]>>;
}

const Translate = ({
	question,
	existingQuestion,
	translatePairs = [],
	setNewQuestion,
	setIsMinimumOneTranslatePair,
	setIsMissingPair,
	setSingleLessonBeforeSave,
	setIsLessonUpdated,
	setIsQuestionUpdated,
	setTranslatePairsAdminQuestions,
}: TranslateProps) => {
	const [pairs, setPairs] = useState<TranslatePair[]>(() =>
		existingQuestion
			? translatePairs && translatePairs.length > 0
				? translatePairs
				: [{ id: generateUniqueId('translate-pair-'), originalText: '', translation: '' }]
			: [{ id: generateUniqueId('translate-pair-'), originalText: '', translation: '' }]
	);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Sync state when translatePairs prop changes (for edit dialogs)
	useEffect(() => {
		if (existingQuestion) {
			if (translatePairs && translatePairs.length > 0) {
				setPairs(translatePairs);
			} else {
				// Ensure at least one empty pair is shown
				setPairs([{ id: generateUniqueId('translate-pair-'), originalText: '', translation: '' }]);
			}
		}
	}, [existingQuestion, translatePairs]);

	const updatePairs = (newPairs: TranslatePair[]) => {
		setPairs(newPairs);
		if (setTranslatePairsAdminQuestions) setTranslatePairsAdminQuestions(newPairs);

		if (setNewQuestion) {
			setNewQuestion((prevData) => ({ ...prevData, translatePairs: newPairs }));
		}

		if (setSingleLessonBeforeSave) {
			setSingleLessonBeforeSave((prevData) => {
				if (!prevData.questions) return prevData;
				const updatedQuestions = prevData.questions?.map((prevQuestion) =>
					prevQuestion?._id === question?._id ? { ...prevQuestion, translatePairs: newPairs } : prevQuestion
				);
				return { ...prevData, questions: updatedQuestions };
			});
			if (question) questionLessonUpdateTrack(question._id, setIsLessonUpdated, setIsQuestionUpdated);
		}

		const nonBlankPairs = newPairs?.filter((pair) => pair.originalText.trim() && pair.translation.trim()) || [];
		const missingPairExists = newPairs?.some((pair) => !pair.originalText.trim() || !pair.translation.trim()) || false;

		setIsMinimumOneTranslatePair?.(nonBlankPairs.length < 1);
		setIsMissingPair?.(missingPairExists);
	};

	const handlePairChange = (index: number, field: 'originalText' | 'translation', value: string) => {
		const newPairs = pairs?.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair)) || [];
		updatePairs(newPairs);
	};

	const addPair = () => {
		const newPair = { id: generateUniqueId('translate-pair-'), originalText: '', translation: '' };
		updatePairs([...(pairs || []), newPair]);
	};

	const removePair = (index: number) => {
		const newPairs = pairs?.filter((_, i) => i !== index) || [];
		updatePairs(newPairs);
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				mt: isMobileSize ? '1.5rem' : '2rem',
				width: '100%',
				mb: isMobileSize ? '-3rem' : '0rem',
			}}>
			{pairs?.map((pair, index) => (
				<Box
					key={pair.id}
					sx={{ display: 'flex', mb: isMobileSize ? '0.25rem' : '0.5rem', width: isMobileSize ? '100%' : '90%', alignItems: 'center' }}>
					<CustomTextField
						placeholder='Original Text'
						multiline
						rows={2}
						value={pair.originalText}
						onChange={(e) => handlePairChange(index, 'originalText', e.target.value)}
						required
						sx={{ marginRight: isMobileSize ? '0.5rem' : '1.5rem' }}
						InputProps={{
							inputProps: {
								maxLength: 500,
							},
						}}
					/>
					<CustomTextField
						placeholder='Translation'
						multiline
						rows={2}
						value={pair.translation}
						onChange={(e) => handlePairChange(index, 'translation', e.target.value)}
						required
						sx={{ marginRight: isMobileSize ? '0.5rem' : '1.5rem' }}
						InputProps={{
							inputProps: {
								maxLength: 500,
							},
						}}
					/>
					<Tooltip title='Remove Pair' placement='right' arrow>
						<IconButton
							onClick={() => removePair(index)}
							sx={{
								'mb': '0.85rem',
								':hover': { backgroundColor: 'transparent' },
							}}>
							<RemoveCircle fontSize='small' />
						</IconButton>
					</Tooltip>
				</Box>
			))}
			<Box sx={{ width: isMobileSize ? '100%' : '90%' }}>
				<Tooltip title='Add Pair' placement='right' arrow>
					<IconButton onClick={addPair} sx={{ 'mb': '0.85rem', ':hover': { backgroundColor: 'transparent' } }}>
						<AddCircle fontSize='small' />
					</IconButton>
				</Tooltip>
			</Box>
		</Box>
	);
};

export default Translate;
