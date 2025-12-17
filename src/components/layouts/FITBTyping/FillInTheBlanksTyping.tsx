import React, { useState, useEffect, useContext, useRef } from 'react';
import styled from 'styled-components';
import { Box, Typography, TextField, TextFieldProps, IconButton, Tooltip } from '@mui/material';
import { BlankValuePair } from '../../../interfaces/question';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { shuffle } from 'lodash';
import { words } from '../../../interfaces/randomWords';
import { QuizQuestionAnswer } from '../../../pages/LessonPage';
import { UserBlankValuePairAnswers } from '../../../interfaces/userQuestion';
import { LessonType } from '../../../interfaces/enums';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { decode } from 'html-entities';

const Container = styled(Box)`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	margin-top: '0.5rem';
	flex-grow: 1;
`;

const Column = styled(Box)`
	width: 100%;
	flex-grow: 1;
`;

const TextContainer = styled(Box)<{ isMobileSizeSmall: boolean }>`
	display: inline;
	flex-wrap: wrap;
	align-items: baseline;
	line-height: ${({ isMobileSizeSmall }) => (isMobileSizeSmall ? 1.7 : 2.5)};
	width: 100%;
	white-space: pre-wrap;
	margin: 0;
	padding: 0;
`;

interface CustomTextFieldProps {
	isCorrect: boolean | null;
	fromQuizQuestionUser: boolean;
	isLessonCompleted: boolean;
	lessonType: string;
	isMobileSizeSmall: boolean;
}

type StyledInputProps = CustomTextFieldProps & TextFieldProps;

const StyledInput = styled(
	({ isCorrect, isLessonCompleted, fromQuizQuestionUser, lessonType, isMobileSizeSmall, ...otherProps }: StyledInputProps) => (
		<TextField {...otherProps} />
	)
)`
	& .MuiOutlinedInput-root {
		background-color: ${({ isCorrect, fromQuizQuestionUser, isLessonCompleted, lessonType }) => {
			if (isLessonCompleted) return isCorrect ? theme.palette.success.main : '#ef5350';

			if (fromQuizQuestionUser || lessonType === LessonType.QUIZ) {
				return '#fff';
			}

			if (isCorrect === true) return theme.palette.success.main;
			if (isCorrect === false) return '#ef5350';
			return '#fff';
		}};
	}

	& .MuiOutlinedInput-input,
	& .MuiInputBase-input,
	& input {
		color: ${({ isLessonCompleted, isCorrect, fromQuizQuestionUser, lessonType }) => {
			if (isLessonCompleted) return '#fff';

			// If it's a quiz question, keep the default text color
			if (fromQuizQuestionUser || lessonType === LessonType.QUIZ) {
				return 'black';
			}

			// If it's a practice question, use white text if correct/incorrect is determined
			if (isCorrect !== null) return '#fff';
			return 'black';
		}};
		font-size: ${({ isMobileSizeSmall }) => (isMobileSizeSmall ? '0.75rem' : '0.85rem')};
		height: ${({ isMobileSizeSmall }) => (isMobileSizeSmall ? '0.75rem' : undefined)};
	}
	margin: 0.1rem 0.25rem;
	min-width: 3rem;
`;

interface FillInTheBlanksTypingProps {
	questionId?: string;
	fromPracticeQuestionUser?: boolean;
	fromQuizQuestionUser?: boolean;
	fromAdminQuestions?: boolean;
	isLessonCompleted?: boolean;
	textWithBlanks: string;
	blankValuePairs: BlankValuePair[];
	onComplete?: (allCorrect: boolean) => void;
	displayedQuestionNumber?: number;
	numberOfQuestions?: number;
	userBlankValuePairsAfterSubmission?: UserBlankValuePairAnswers[];
	lessonType?: string | undefined;
	userQuizAnswers?: QuizQuestionAnswer[];
	setAllPairsMatchedFITBTyping?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLessonCompleted?: React.Dispatch<React.SetStateAction<boolean>>;
	setShowQuestionSelector?: React.Dispatch<React.SetStateAction<boolean>>;
	setUserQuizAnswers?: React.Dispatch<React.SetStateAction<QuizQuestionAnswer[]>>;
	onCorrectMatch?: () => void;
	onWrongMatch?: () => void;
}

const FillInTheBlanksTyping = ({
	questionId,
	fromPracticeQuestionUser,
	fromQuizQuestionUser,
	fromAdminQuestions,
	isLessonCompleted,
	textWithBlanks,
	blankValuePairs,
	onComplete,
	displayedQuestionNumber,
	numberOfQuestions,
	userBlankValuePairsAfterSubmission,
	lessonType,
	userQuizAnswers,
	setAllPairsMatchedFITBTyping,
	setIsLessonCompleted,
	setShowQuestionSelector,
	setUserQuizAnswers,
	onCorrectMatch,
	onWrongMatch,
}: FillInTheBlanksTypingProps) => {
	const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
	const [inputStatus, setInputStatus] = useState<Record<string, boolean | null>>({});
	const [showHiddenBlankValues, setShowHiddenBlankValues] = useState<boolean>(false);
	const [hints, setHints] = useState<string[]>([]);
	const [textSegments, setTextSegments] = useState<string[]>([]);
	const [hasInteracted, setHasInteracted] = useState(false);
	const hintsInitializedRef = useRef<boolean>(false);
	const previousQuestionIdRef = useRef<string | undefined>(questionId);

	const { updateLastQuestion, getLastQuestion } = useUserCourseLessonData();

	// Reset hints initialization when questionId changes
	useEffect(() => {
		if (previousQuestionIdRef.current !== questionId) {
			hintsInitializedRef.current = false;
			previousQuestionIdRef.current = questionId;
		}
	}, [questionId]);

	const {
		isRotated,
		isVerySmallScreen,
		isSmallScreen,
		isRotatedMedium,
		isSmallMobileLandscape,
		isSmallMobilePortrait,
		isMobileLandscape,
		isMobilePortrait,
		isTabletPortrait,
		isTabletLandscape,
		isDesktopPortrait,
		isDesktopLandscape,
	} = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	useEffect(() => {
		if (isLessonCompleted && userBlankValuePairsAfterSubmission) {
			const submittedAnswers: Record<string, string> = {};
			const status: Record<string, boolean | null> = {};

			userBlankValuePairsAfterSubmission?.forEach((pair) => {
				submittedAnswers[pair.id] = pair.value;
				status[pair.id] = blankValuePairs?.find((bvp) => bvp.id === pair.id)?.value === pair.value;
			});

			setUserAnswers(submittedAnswers);
			setInputStatus(status);
		} else if (!isLessonCompleted && fromQuizQuestionUser) {
			const initialAnswers: Record<string, string> = {};
			const initialStatus: Record<string, boolean | null> = {};

			userQuizAnswers
				?.find((answer) => answer.questionId === questionId)
				?.userBlankValuePairAnswers?.forEach((pair) => {
					initialAnswers[pair.id] = pair.value;
					initialStatus[pair.id] = true;
				});

			setUserAnswers(initialAnswers);
			setInputStatus(initialStatus);

			// Only set hints once, not on every update
			if (!hintsInitializedRef.current) {
				const randomWords = shuffle(words)?.slice(0, 15) || [];
				const values = blankValuePairs?.map((pair) => pair.value) || [];
				const hintWords = shuffle([...values, ...randomWords]);
				setHints(hintWords);
				hintsInitializedRef.current = true;
			}
		} else if (
			(isLessonCompleted && fromPracticeQuestionUser) ||
			(fromPracticeQuestionUser && !isLessonCompleted && displayedQuestionNumber! < getLastQuestion())
		) {
			const initialAnswers: Record<string, string> = {};
			const initialStatus: Record<string, boolean | null> = {};

			blankValuePairs?.forEach((pair) => {
				initialAnswers[pair.id] = pair.value;
				initialStatus[pair.id] = true;
			});

			setUserAnswers(initialAnswers);
			setInputStatus(initialStatus);

			// Only set hints once, not on every update
			if (!hintsInitializedRef.current) {
				const randomWords = shuffle(words)?.slice(0, 5) || [];
				const values = blankValuePairs?.map((pair) => pair.value) || [];
				const hintWords = shuffle([...values, ...randomWords]);
				setHints(hintWords);
				hintsInitializedRef.current = true;
			}
		} else {
			const initialAnswers: Record<string, string> = {};
			const initialStatus: Record<string, boolean | null> = {};

			blankValuePairs?.forEach((pair) => {
				initialAnswers[pair.id] = '';
				initialStatus[pair.id] = null;
			});

			setUserAnswers(initialAnswers);
			setInputStatus(initialStatus);

			// Only set hints once, not on every update
			if (!hintsInitializedRef.current) {
				const randomWords =
					lessonType === LessonType.QUIZ && !fromAdminQuestions ? shuffle(words)?.slice(0, 15) || [] : shuffle(words)?.slice(0, 5) || [];
				const values = blankValuePairs?.map((pair) => pair.value) || [];
				const hintWords = shuffle([...values, ...randomWords]);
				setHints(hintWords);
				hintsInitializedRef.current = true;
			}
		}
	}, [
		blankValuePairs,
		isLessonCompleted,
		userBlankValuePairsAfterSubmission,
		displayedQuestionNumber,
		questionId,
		fromQuizQuestionUser,
		fromPracticeQuestionUser,
		lessonType,
		fromAdminQuestions,
		userQuizAnswers,
	]);

	useEffect(() => {
		setUserQuizAnswers?.((prevData) => {
			const blankValuePairsWithIds: UserBlankValuePairAnswers[] = blankValuePairs?.map((pair) => ({
				id: pair.id,
				value: '',
			}));

			if (prevData) {
				return prevData?.map((data) => {
					if (data.questionId === questionId) {
						return { ...data, userBlankValuePairAnswers: blankValuePairsWithIds };
					}
					return data;
				});
			}

			return prevData;
		});
	}, []);

	useEffect(() => {
		// Sanitize and split the text
		let sanitizedText = sanitizeHtml(decode(textWithBlanks))
			.replace(/[()]/g, '')
			.replace(/<\/?[^>]+(>|$)/g, '');

		// Split the text by the placeholders
		const segments = sanitizedText.split(/(___\d+___)/g);
		setTextSegments(segments);
	}, [textWithBlanks]);

	useEffect(() => {
		if (hasInteracted && fromPracticeQuestionUser) {
			const allCorrect = blankValuePairs?.every((pair) => pair.value === userAnswers[pair.id]) || false;
			if (onComplete) onComplete(allCorrect);

			if (setAllPairsMatchedFITBTyping) {
				setAllPairsMatchedFITBTyping(allCorrect);
			}

			if (allCorrect && fromPracticeQuestionUser) {
				if (displayedQuestionNumber && numberOfQuestions) {
					if (displayedQuestionNumber + 1 <= numberOfQuestions && getLastQuestion() <= displayedQuestionNumber) {
						updateLastQuestion(displayedQuestionNumber + 1);
					}
					if (displayedQuestionNumber === numberOfQuestions) {
						if (setIsLessonCompleted) setIsLessonCompleted(true);
						if (setShowQuestionSelector) setShowQuestionSelector(true);
					}
				}
			}
		}
	}, [userAnswers, hasInteracted]);

	const handleChange = (id: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
		if (isLessonCompleted && lessonType !== LessonType.PRACTICE_LESSON) return;

		setHasInteracted(true);

		const newAnswers = { ...userAnswers };
		const newStatus = { ...inputStatus };
		const inputValue = event.target.value;

		newAnswers[id] = inputValue;

		if (inputValue === '') {
			newStatus[id] = null;
		} else if (blankValuePairs?.find((pair) => pair.id === id)?.value === inputValue.trim()) {
			newStatus[id] = true;
			// Play success sound only when complete correct word is typed
			if (onCorrectMatch) {
				onCorrectMatch();
			}
		} else {
			newStatus[id] = false;
			// No error sound while typing - only success sound when correct word is complete
		}

		setUserAnswers(newAnswers);
		setInputStatus(newStatus);

		if (!isLessonCompleted && fromQuizQuestionUser) {
			setUserQuizAnswers?.((prevData) => {
				const updatedAnswers = blankValuePairs?.map((pair) => ({
					id: pair.id,
					value: newAnswers[pair.id] || '',
				}));

				if (prevData) {
					return prevData?.map((data) => {
						if (data.questionId === questionId) {
							return { ...data, userBlankValuePairAnswers: updatedAnswers };
						}
						return data;
					});
				}

				return prevData;
			});
		}
	};

	return (
		<Container>
			<Column>
				<TextContainer isMobileSizeSmall={isMobileSizeSmall}>
					{textSegments?.map((segment, index) => {
						const match = segment.match(/___(\d+)___/);
						if (match) {
							const blankIndex = parseInt(match[1], 10) - 1;
							const blankId = blankValuePairs[blankIndex]?.id;
							return (
								<StyledInput
									key={`input-${blankId}`}
									variant='outlined'
									size='small'
									value={userAnswers[blankId] || ''}
									onChange={handleChange(blankId)}
									isCorrect={inputStatus[blankId]}
									fromQuizQuestionUser={!!fromQuizQuestionUser}
									isLessonCompleted={!!isLessonCompleted}
									lessonType={lessonType!}
									isMobileSizeSmall={isMobileSizeSmall}
									InputProps={{
										inputProps: {
											maxLength: 50,
										},
									}}
								/>
							);
						} else {
							return (
								<Typography key={`text-${index}`} variant='body2' component='span' sx={{ fontSize: isMobileSizeSmall ? '0.75rem' : '0.85rem' }}>
									{segment}
								</Typography>
							);
						}
					})}
				</TextContainer>

				{(!isLessonCompleted || lessonType === LessonType.PRACTICE_LESSON) && (
					<Box
						sx={{
							mt: '2rem',
							mb: '2rem',
						}}>
						<CustomInfoMessageAlignedLeft message='Type the correct word into each blank to complete the sentence(s)' />
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								minHeight: '3rem',
								boxShadow: '0 0 0.4rem 0.2rem rgba(0,0,0,0.2)',
								borderRadius: '0.35rem',
								width: '100%',
								padding: '1rem',
							}}>
							<Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
								{hints?.map((hint, index) => {
									return (
										<Box
											key={index}
											sx={{
												border: '0.01rem solid gray',
												padding: '0.25rem 0.5rem',
												margin: '0.25rem 0.35rem 0.5rem 0.35rem',
												borderRadius: '0.35rem',
											}}>
											{showHiddenBlankValues ? (
												<Typography variant='body2' sx={{ fontSize: isMobileSizeSmall ? '0.75rem' : '0.85rem' }}>
													{hint}
												</Typography>
											) : (
												<Typography sx={{ fontSize: isMobileSizeSmall ? '0.75rem' : '0.85rem' }}>*****</Typography>
											)}
										</Box>
									);
								})}
							</Box>
							<Box>
								<Tooltip title={showHiddenBlankValues ? 'Hide Possible Answers' : 'See Possible Answers'} placement='top' arrow>
									<IconButton onClick={() => setShowHiddenBlankValues(!showHiddenBlankValues)}>
										{showHiddenBlankValues ? (
											<VisibilityOff fontSize={isMobileSizeSmall ? 'small' : 'medium'} />
										) : (
											<Visibility fontSize={isMobileSizeSmall ? 'small' : 'medium'} />
										)}
									</IconButton>
								</Tooltip>
							</Box>
						</Box>
					</Box>
				)}

				{isLessonCompleted && lessonType !== LessonType.PRACTICE_LESSON && (
					<Box sx={{ margin: isMobileSize ? '2rem 0 1rem 0' : '3rem 0 1rem 0', width: '100%' }}>
						<Box>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem' }}>
								Correct Text
							</Typography>
						</Box>
						<Box
							sx={{
								boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
								borderRadius: '0.35rem',
								margin: '0.5rem 0',
								padding: '1rem',
							}}>
							<TextContainer isMobileSizeSmall={isMobileSizeSmall}>
								{textSegments?.map((segment, index) => {
									const match = segment.match(/___(\d+)___/);
									if (match) {
										const blankIndex = parseInt(match[1], 10) - 1;
										const correctValue = blankValuePairs[blankIndex]?.value;
										return (
											<Typography
												key={`correct-${blankIndex}`}
												variant='body2'
												component='span'
												sx={{
													color: 'green',
													fontWeight: 600,
													border: '0.075rem solid green',
													padding: '0.25rem',
													margin: '0 0.15rem',
													borderRadius: '0.35rem',
													fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												}}>
												{correctValue}
											</Typography>
										);
									} else {
										return (
											<Typography
												key={`correct-text-${index}`}
												variant='body2'
												component='span'
												sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												{segment}
											</Typography>
										);
									}
								})}
							</TextContainer>
						</Box>
					</Box>
				)}
			</Column>
		</Container>
	);
};

export default FillInTheBlanksTyping;
