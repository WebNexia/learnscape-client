import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { MatchingPair, QuestionInterface } from '../../../interfaces/question';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import MatchingPreview from './MatchingPreview';
import { generateUniqueId } from '../../../utils/uniqueIdGenerator';

interface MatchingProps {
	setNewQuestion?: React.Dispatch<React.SetStateAction<QuestionInterface>>;
	setIsMinimumTwoMatchingPairs?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsMissingPair: React.Dispatch<React.SetStateAction<boolean>>;
}

const Matching = ({ setNewQuestion, setIsMinimumTwoMatchingPairs, setIsMissingPair }: MatchingProps) => {
	const [pairs, setPairs] = useState<MatchingPair[]>([{ id: generateUniqueId('pair-'), question: '', answer: '' }]);

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
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: '2rem' }}>
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
