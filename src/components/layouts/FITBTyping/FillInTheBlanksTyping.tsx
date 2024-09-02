import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Box, Typography, TextField, TextFieldProps, IconButton, Tooltip } from '@mui/material';
import { BlankValuePair } from '../../../interfaces/question';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { shuffle } from 'lodash';
import { words } from '../../../interfaces/randomWords';

const Container = styled(Box)`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	margin-top: 0.5rem;
	flex-grow: 1;
`;

const Column = styled(Box)`
	width: 90%;
	flex-grow: 1;
`;

const TextContainer = styled(Box)`
	display: inline;
	flex-wrap: wrap;
	align-items: baseline;
	line-height: 2.5;
	width: 100%;
	white-space: pre-wrap;
	margin: 0;
	padding: 0;
`;

interface CustomTextFieldProps {
	isCorrect: boolean | null;
}

type StyledInputProps = CustomTextFieldProps & TextFieldProps;

const StyledInput = styled(({ isCorrect, ...otherProps }: StyledInputProps) => <TextField {...otherProps} />)`
	& .MuiOutlinedInput-root {
		background-color: ${({ isCorrect }) => (isCorrect === null ? '#fff' : isCorrect ? 'green' : '#d32f2f')};
		padding: 0; /* Adjust padding to reduce height */
		font-size: 0.85rem; /* Reduce font size to make input smaller */
		color: ${({ isCorrect }) => (isCorrect === null ? 'black' : 'white')};
	}
	margin: 0 0.25rem;
	min-width: 3rem;
`;

interface FillInTheBlanksTypingProps {
	fromPracticeQuestionUser?: boolean;
	textWithBlanks: string;
	blankValuePairs: BlankValuePair[];
	onComplete?: (allCorrect: boolean) => void;
	displayedQuestionNumber?: number;
	numberOfQuestions?: number;
	setAllPairsMatched?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLessonCompleted?: React.Dispatch<React.SetStateAction<boolean>>;
	setShowQuestionSelector?: React.Dispatch<React.SetStateAction<boolean>>;
}

const FillInTheBlanksTyping = ({
	fromPracticeQuestionUser,
	textWithBlanks,
	blankValuePairs,
	onComplete,
	displayedQuestionNumber,
	numberOfQuestions,
	setAllPairsMatched,
	setIsLessonCompleted,
	setShowQuestionSelector,
}: FillInTheBlanksTypingProps) => {
	const [userAnswers, setUserAnswers] = useState<string[]>([]);
	const [inputStatus, setInputStatus] = useState<(boolean | null)[]>([]);
	const [showHiddenBlankValues, setShowHiddenBlankValues] = useState<boolean>(false);
	const [hints, setHints] = useState<string[]>([]);
	const [textSegments, setTextSegments] = useState<string[]>([]);

	const { updateLastQuestion, getLastQuestion, handleNextLesson } = useUserCourseLessonData();

	useEffect(() => {
		const initialAnswers = Array(blankValuePairs.length).fill('');
		const initialStatus = Array(blankValuePairs.length).fill(null);
		setUserAnswers(initialAnswers);
		setInputStatus(initialStatus);

		const randomWords = shuffle(words).slice(0, 5);
		const values = blankValuePairs.map((pair) => pair.value);
		const hintWords = shuffle([...values, ...randomWords]);
		setHints(hintWords);
	}, [blankValuePairs]);

	useEffect(() => {
		// Sanitize and split the text
		let sanitizedText = sanitizeHtml(textWithBlanks)
			.replace(/[()]/g, '')
			.replace(/<\/?[^>]+(>|$)/g, '');

		// Split the text by the placeholders
		const segments = sanitizedText.split(/(___\d+___)/g);
		setTextSegments(segments);
	}, [textWithBlanks]);

	useEffect(() => {
		const allCorrect = blankValuePairs.every((pair, index) => pair.value === userAnswers[index]);
		if (onComplete) onComplete(allCorrect);

		if (setAllPairsMatched) {
			setAllPairsMatched(allCorrect);
		}

		if (allCorrect && fromPracticeQuestionUser) {
			if (displayedQuestionNumber && numberOfQuestions) {
				if (displayedQuestionNumber + 1 <= numberOfQuestions && getLastQuestion() <= displayedQuestionNumber) {
					updateLastQuestion(displayedQuestionNumber + 1);
				}
				if (displayedQuestionNumber === numberOfQuestions) {
					handleNextLesson();
					if (setIsLessonCompleted) setIsLessonCompleted(true);
					if (setShowQuestionSelector) setShowQuestionSelector(true);
				}
			}
		}
	}, [userAnswers]);

	const handleChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
		const newAnswers = [...userAnswers];
		const newStatus = [...inputStatus];
		const inputValue = event.target.value;

		newAnswers[index] = inputValue;

		if (inputValue === '') {
			newStatus[index] = null;
		} else if (blankValuePairs[index].value === inputValue.trim()) {
			newStatus[index] = true;
		} else {
			newStatus[index] = false;
		}

		setUserAnswers(newAnswers);
		setInputStatus(newStatus);
	};

	return (
		<Container>
			<Column>
				<TextContainer>
					{textSegments.map((segment, index) => {
						const match = segment.match(/___(\d+)___/);
						if (match) {
							const blankIndex = parseInt(match[1], 10) - 1;
							return (
								<StyledInput
									key={`input-${blankIndex}`}
									variant='outlined'
									size='small'
									value={userAnswers[blankIndex] || ''}
									onChange={handleChange(blankIndex)}
									isCorrect={inputStatus[blankIndex]}
								/>
							);
						} else {
							return (
								<Typography key={`text-${index}`} variant='body2' component='span'>
									{segment}
								</Typography>
							);
						}
					})}
				</TextContainer>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						minHeight: '3rem',
						boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
						borderRadius: '0.35rem',
						width: '100%',
						mt: '2rem',
						padding: '1rem',
					}}>
					<Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
						{hints.map((hint, index) => {
							return (
								<Box key={index} sx={{ border: '0.01rem solid gray', padding: '0.25rem 0.5rem', margin: '0.25rem', borderRadius: '0.35rem' }}>
									{showHiddenBlankValues ? <Typography variant='body2'>{hint}</Typography> : <Typography>*****</Typography>}
								</Box>
							);
						})}
					</Box>
					<Box>
						<Tooltip title={showHiddenBlankValues ? 'Hide Possible Answers' : 'See Possible Answers'} placement='top'>
							<IconButton onClick={() => setShowHiddenBlankValues(!showHiddenBlankValues)}>
								{showHiddenBlankValues ? <VisibilityOff /> : <Visibility />}
							</IconButton>
						</Tooltip>
					</Box>
				</Box>
			</Column>
		</Container>
	);
};

export default FillInTheBlanksTyping;
