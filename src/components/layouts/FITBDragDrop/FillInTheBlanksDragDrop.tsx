import React, { useState, useEffect, useContext, useRef } from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@mui/material';
import { BlankValuePair, QuizBlankValueOption } from '../../../interfaces/question';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import { shuffle } from 'lodash';
import { words } from '../../../interfaces/randomWords';
import { QuizQuestionAnswer } from '../../../pages/LessonPage';
import { UserBlankValuePairAnswers } from '../../../interfaces/userQuestion';
import { LessonType } from '../../../interfaces/enums';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { decode } from 'html-entities';
import WordAssistPopper from '../../userCourses/WordAssistPopper';
import { useWordAssist, wrapWordsForHover } from '../../../hooks/useWordAssist';
import { LEARNER_TEXT_FONT_FAMILY } from '../../../utils/learnerTypography';
import FitbInteractionModeBadge from '../fitb/FitbInteractionModeBadge';
import { getWordBankHint } from '../../../utils/fitbWordBankHint';

const questionTextColor = theme.palette.primary.main;

const Container = styled(Box)`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	margin-top: 0;
	flex-grow: 1;
`;

const Column = styled(Box)`
	width: 100%;
	flex-grow: 1;
`;

const TextContainer = styled(Box)`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	text-align: center;
	line-height: 2rem;
	width: 100%;
	white-space: pre-wrap;
	margin: 0;
	padding: 0;
`;

const DropArea = styled(Box) <{
	$isCorrect: boolean | null;
	$fromQuizQuestionUser?: boolean;
	$isLessonCompleted?: boolean;
	$lessonType?: string;
	$isDropTarget?: boolean;
	$isInteractive?: boolean;
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 4rem;
	min-height: 2rem;
	height: 2rem;
	background-color: ${({ $isCorrect, $fromQuizQuestionUser, $isLessonCompleted, $lessonType, $isDropTarget }) =>
		$isDropTarget
			? 'rgba(1, 67, 90, 0.08)'
			: $isLessonCompleted
				? $isCorrect
					? theme.palette.success.main
					: '#ef5350'
				: ($fromQuizQuestionUser || $lessonType === LessonType.QUIZ) && !$isLessonCompleted
					? '#f0f0f0'
					: $isCorrect === null
						? '#f0f0f0'
						: $isCorrect
							? theme.palette.success.main
							: '#ef5350'};
	border: 0.1rem solid
		${({ $isCorrect, $fromQuizQuestionUser, $isLessonCompleted, $lessonType, $isDropTarget }) =>
		$isDropTarget
			? theme.palette.primary.main
			: $isLessonCompleted
				? $isCorrect
					? '#c3e6cb'
					: '#f5c6cb'
				: ($fromQuizQuestionUser || $lessonType === LessonType.QUIZ) && !$isLessonCompleted
					? '#cccccc'
					: $isCorrect === null
						? '#cccccc'
						: $isCorrect
							? '#c3e6cb'
							: '#f5c6cb'};
	border-radius: 0.25rem;
	padding: 0 0.35rem;
	margin: 0 0.35rem;
	font-size: 0.75rem;
	color: #495057;
	overflow: hidden;
	white-space: nowrap;
	text-align: center;
	vertical-align: middle;
	line-height: normal;
	flex-shrink: 0;
	width: auto;
	cursor: ${({ $isInteractive }) => ($isInteractive ? 'pointer' : 'default')};
	box-shadow: ${({ $isDropTarget }) => ($isDropTarget ? '0 0 0 2px rgba(1, 67, 90, 0.2)' : 'none')};
	transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
`;

const Item = styled.div<{
	$isCorrect: boolean | null;
	$fromQuizQuestionUser?: boolean;
	$lessonType?: string;
	$isSelected?: boolean;
	$isInteractive?: boolean;
}>`
	padding: 0.38rem 0.68rem;
	margin: 0.45rem 0.35rem;
	background: ${({ $isCorrect, $fromQuizQuestionUser, $lessonType, $isSelected }) =>
		$isSelected
			? 'linear-gradient(135deg, #e8f4f8 0%, #d4ebf2 100%)'
			: $fromQuizQuestionUser || $lessonType === LessonType.QUIZ
				? 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)'
				: $isCorrect === null
					? 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)'
					: $isCorrect
						? 'linear-gradient(135deg, #ebf9ef 0%, #d9f2e2 100%)'
						: 'linear-gradient(135deg, #fdecec 0%, #f9dcdc 100%)'};
	border: ${({ $isCorrect, $fromQuizQuestionUser, $lessonType, $isSelected }) =>
		$isSelected
			? `2px solid ${theme.palette.primary.main}`
			: `1px solid ${$fromQuizQuestionUser || $lessonType === LessonType.QUIZ
				? 'rgba(1, 67, 90, 0.16)'
				: $isCorrect === null
					? 'rgba(1, 67, 90, 0.16)'
					: $isCorrect
						? '#b9e3c7'
						: '#f0bcbc'
			}`};
	border-radius: 0.62rem;
	cursor: ${({ $isInteractive }) => ($isInteractive === false ? 'default' : 'pointer')};
	text-align: center;
	font-size: 0.78rem;
	font-family: 'DM Sans', sans-serif;
	font-weight: 500;
	color: #2f4d5c;
	position: relative;
	line-height: 1.1rem;
	width: auto;
	height: fit-content;
	max-width: 100%;
	display: inline-block;
	white-space: nowrap;
	box-shadow: ${({ $isSelected }) => ($isSelected ? '0 4px 14px rgba(1, 67, 90, 0.18)' : '0 2px 8px rgba(0, 0, 0, 0.08)')};
	transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 5px 14px rgba(0, 0, 0, 0.12);
		border-color: rgba(1, 67, 90, 0.3);
	}
`;

interface FillInTheBlanksDragDropProps {
	questionId?: string;
	fromPracticeQuestionUser?: boolean;
	fromQuizQuestionUser?: boolean;
	isLessonCompleted?: boolean;
	textWithBlanks: string;
	blankValuePairs: BlankValuePair[];
	quizBlankValueOptions?: QuizBlankValueOption[];
	onComplete?: (allCorrect: boolean) => void;
	displayedQuestionNumber?: number;
	numberOfQuestions?: number;
	userBlankValuePairsAfterSubmission?: UserBlankValuePairAnswers[];
	lessonType?: string | undefined;
	userQuizAnswers?: QuizQuestionAnswer[];
	setAllPairsMatchedFITBDragDrop?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLessonCompleted?: React.Dispatch<React.SetStateAction<boolean>>;
	setShowQuestionSelector?: React.Dispatch<React.SetStateAction<boolean>>;
	setUserQuizAnswers?: React.Dispatch<React.SetStateAction<QuizQuestionAnswer[]>>;
	onCorrectMatch?: () => void;
	onWrongMatch?: () => void;
	enableWordAssist?: boolean;
}

const decodeHtmlEntities = (text: string): string => {
	const textArea = document.createElement('textarea');
	textArea.innerHTML = text;
	return textArea.value;
};

const FillInTheBlanksDragDrop = ({
	questionId,
	fromPracticeQuestionUser,
	fromQuizQuestionUser,
	isLessonCompleted,
	textWithBlanks,
	blankValuePairs,
	quizBlankValueOptions,
	onComplete,
	displayedQuestionNumber,
	numberOfQuestions,
	userBlankValuePairsAfterSubmission,
	lessonType,
	userQuizAnswers,
	setAllPairsMatchedFITBDragDrop,
	setIsLessonCompleted,
	setShowQuestionSelector,
	setUserQuizAnswers,
	onCorrectMatch,
	onWrongMatch,
	enableWordAssist = true,
}: FillInTheBlanksDragDropProps) => {
	const [blanks, setBlanks] = useState<BlankValuePair[]>([]);
	const [responses, setResponses] = useState<BlankValuePair[]>([]);
	const [textSegments, setTextSegments] = useState<string[]>([]);
	const [hasInteracted, setHasInteracted] = useState(false);
	const [selectedPoolIndex, setSelectedPoolIndex] = useState<number | null>(null);
	const responsesInitializedRef = useRef<boolean>(false);
	const previousQuestionIdRef = useRef<string | undefined>(questionId);
	const previousIsLessonCompletedRef = useRef<boolean | undefined>(isLessonCompleted);

	const { updateLastQuestion, getLastQuestion } = useUserCourseLessonData();

	const isInteractionLocked = Boolean(isLessonCompleted);
	const isReviewMode = Boolean(isLessonCompleted && fromPracticeQuestionUser && lessonType === LessonType.PRACTICE_LESSON);
	const showWordBank = !isLessonCompleted || isReviewMode;

	useEffect(() => {
		if (previousQuestionIdRef.current !== questionId) {
			responsesInitializedRef.current = false;
			previousQuestionIdRef.current = questionId;
			setSelectedPoolIndex(null);
		}
	}, [questionId]);

	useEffect(() => {
		if (previousIsLessonCompletedRef.current === true && isLessonCompleted === false && fromPracticeQuestionUser) {
			responsesInitializedRef.current = false;
			const emptyBlanks = blankValuePairs?.map((pair) => ({
				...pair,
				value: '',
			}));
			setBlanks(emptyBlanks || []);
			setHasInteracted(false);
			setSelectedPoolIndex(null);
		}
		previousIsLessonCompletedRef.current = isLessonCompleted;
	}, [isLessonCompleted, fromPracticeQuestionUser, blankValuePairs]);

	const { isRotated, isVerySmallScreen, isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;
	const { anchorEl, activeWord, wordInfo, isLoadingWordInfo, handleWordHover, handleWordTouchStart, handleWordTouchEnd, handleMouseLeave, handlePopperMouseOut } = useWordAssist({
		enabled: enableWordAssist,
		hoverDelayMs: 500,
	});

	useEffect(() => {
		const sanitizedHtml = sanitizeHtml(decode(textWithBlanks))
			.replace(/[()]/g, '')
			.replace(/<\/?[^>]+(>|$)/g, '')
			.replace(/&nbsp;/g, ' ')
			.replace(/\n/g, '<br />')
			.replace(/^\s*[\r\n]/gm, '');

		const segments = sanitizedHtml.split(/(___\d+___)/g);
		setTextSegments(segments);

		const initializedBlanks = blankValuePairs?.map((pair) => ({
			...pair,
			value: '',
		}));

		const populateBlanks = (source: BlankValuePair[] | UserBlankValuePairAnswers[]) => {
			source?.forEach((pair) => {
				const blank = initializedBlanks?.find((b) => b.id === pair.id);
				if (blank) blank.value = pair.value;
			});
		};

		if (isLessonCompleted && userBlankValuePairsAfterSubmission) {
			populateBlanks(userBlankValuePairsAfterSubmission);
		} else if (!isLessonCompleted && fromQuizQuestionUser) {
			populateBlanks(userQuizAnswers?.find((quizAnswer) => quizAnswer.questionId === questionId)?.userBlankValuePairAnswers || []);
		} else if (isLessonCompleted && fromPracticeQuestionUser) {
			populateBlanks(blankValuePairs);

			if (!responsesInitializedRef.current) {
				const remainingResponses = blankValuePairs?.filter((pair) => !initializedBlanks?.some((blank) => blank.value === pair.value)) || [];
				const randomWords = shuffle(words)?.slice(0, 5) || [];
				setResponses(shuffle([...remainingResponses, ...(randomWords?.map((word) => ({ id: `random-${word}`, value: word, blank: -1 })) || [])]));
				responsesInitializedRef.current = true;
			}
		}

		setBlanks(initializedBlanks);

		if (!isLessonCompleted && !responsesInitializedRef.current) {
			const wordCount = fromQuizQuestionUser || lessonType === LessonType.QUIZ ? 15 : 5;
			const randomWords = shuffle(words)?.slice(0, wordCount) || [];
			const quizResponses = fromQuizQuestionUser
				? quizBlankValueOptions?.map((pair) => ({ id: pair.id, value: pair.value, blank: -1 })) || []
				: blankValuePairs;
			setResponses(shuffle([...quizResponses, ...(randomWords?.map((word) => ({ id: `random-${word}`, value: word, blank: -1 })) || [])]));
			responsesInitializedRef.current = true;
		}
	}, [
		textWithBlanks,
		blankValuePairs,
		quizBlankValueOptions,
		isLessonCompleted,
		userBlankValuePairsAfterSubmission,
		displayedQuestionNumber,
		questionId,
		fromQuizQuestionUser,
		fromPracticeQuestionUser,
		lessonType,
		userQuizAnswers,
	]);

	useEffect(() => {
		if (hasInteracted && fromPracticeQuestionUser) {
			const allCorrect = blanks?.every((blank) => blank.value === blankValuePairs?.find((p) => p.blank === blank.blank)?.value) || false;

			if (setAllPairsMatchedFITBDragDrop) setAllPairsMatchedFITBDragDrop(allCorrect);

			if (onComplete) onComplete(allCorrect);

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
	}, [blanks, hasInteracted]);

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

	const persistQuizAnswers = (updatedBlanks: BlankValuePair[]) => {
		if (fromQuizQuestionUser && !isLessonCompleted) {
			setUserQuizAnswers?.((prevData) => {
				const updatedAnswers = updatedBlanks?.map((blank) => ({
					id: blank.id,
					value: blank.value,
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

	const commitBoardUpdate = (newBlanks: BlankValuePair[], newResponses: BlankValuePair[]) => {
		setBlanks(newBlanks);
		setResponses(newResponses);
		persistQuizAnswers(newBlanks);
	};

	const playMatchFeedback = (blankIndex: number, matchedValue: string) => {
		const correctValue = blankValuePairs?.find((p) => p.blank === blanks[blankIndex]?.blank)?.value;
		if (correctValue) {
			if (correctValue === matchedValue) {
				onCorrectMatch?.();
			} else {
				onWrongMatch?.();
			}
		}
	};

	const handlePoolWordClick = (index: number) => {
		if (isInteractionLocked) return;
		setSelectedPoolIndex((prev) => (prev === index ? null : index));
	};

	const handleBlankClick = (blankId: string) => {
		if (isInteractionLocked) return;

		const blankIndex = blanks.findIndex((blank) => blank.id === blankId);
		if (blankIndex === -1) return;

		const blank = blanks[blankIndex];

		if (blank.value) {
			setHasInteracted(true);
			setSelectedPoolIndex(null);

			const newBlanks = [...blanks];
			const newResponses = [...responses];
			const movedResponse = newBlanks[blankIndex].value;
			newBlanks[blankIndex].value = '';

			newResponses.push({
				id: `response-${newBlanks[blankIndex].id}`,
				blank: newBlanks[blankIndex].blank,
				value: movedResponse,
			});

			commitBoardUpdate(newBlanks, newResponses);
			return;
		}

		if (selectedPoolIndex === null || selectedPoolIndex >= responses.length) return;

		setHasInteracted(true);

		const newBlanks = [...blanks];
		const newResponses = [...responses];
		const matchedValue = newResponses[selectedPoolIndex].value;
		newBlanks[blankIndex].value = matchedValue;
		newResponses.splice(selectedPoolIndex, 1);

		playMatchFeedback(blankIndex, matchedValue);
		setSelectedPoolIndex(null);
		commitBoardUpdate(newBlanks, newResponses);
	};

	const hasSelectedPoolWord = selectedPoolIndex !== null && !isInteractionLocked;

	return (
		<Container>
			<Column>
				<FitbInteractionModeBadge mode='tap' compact={isMobileSize} />
				<TextContainer
					onMouseOver={handleWordHover}
					onMouseOut={handleMouseLeave}
					onTouchStart={handleWordTouchStart}
					onTouchEnd={handleWordTouchEnd}
					onTouchCancel={handleWordTouchEnd}>
					{textSegments?.map((segment, index) => {
						const match = segment.match(/___(\d+)___/);
						if (match) {
							const blankIndex = parseInt(match[1], 10) - 1;
							const blank = blanks[blankIndex];
							if (!blank) return null;

							const isBlankCorrect = blank.value
								? blank.value === blankValuePairs?.find((p) => p.blank === blank.blank)?.value
								: null;
							const isEmptyDropTarget = hasSelectedPoolWord && !blank.value;

							return (
								<DropArea
									key={`drop-area-${blank.id}-${blank.value}`}
									onClick={() => handleBlankClick(blank.id)}
									$isCorrect={isBlankCorrect}
									$fromQuizQuestionUser={fromQuizQuestionUser}
									$lessonType={lessonType}
									$isLessonCompleted={isLessonCompleted}
									$isDropTarget={isEmptyDropTarget}
									$isInteractive={!isInteractionLocked && (Boolean(blank.value) || isEmptyDropTarget)}
									role={!isInteractionLocked ? 'button' : undefined}
									tabIndex={!isInteractionLocked && (Boolean(blank.value) || isEmptyDropTarget) ? 0 : undefined}
									onKeyDown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											handleBlankClick(blank.id);
										}
									}}>
									{blank.value ? (
										<Item
											$isCorrect={isBlankCorrect}
											$fromQuizQuestionUser={fromQuizQuestionUser}
											$lessonType={lessonType}
											onClick={(event) => {
												event.stopPropagation();
												handleBlankClick(blank.id);
											}}>
											<Typography
												variant='body2'
												component='span'
												sx={{
													display: 'inline-flex',
													fontSize: isMobileSizeSmall ? '0.75rem' : '0.9rem',
													fontFamily: LEARNER_TEXT_FONT_FAMILY,
												}}>
												{blank.value}
											</Typography>
										</Item>
									) : null}
								</DropArea>
							);
						}

						const hoverableSegmentHtml = wrapWordsForHover(segment);
						return (
							<Typography
								key={`text-${index}`}
								variant='body2'
								component='span'
								dangerouslySetInnerHTML={{ __html: hoverableSegmentHtml }}
								sx={{
									lineHeight: '2rem',
									fontSize: isMobileSizeSmall ? '0.75rem' : '0.9rem',
									fontFamily: LEARNER_TEXT_FONT_FAMILY,
									color: questionTextColor,
									'&, & *': {
										color: `${questionTextColor} !important`,
										fontFamily: `${LEARNER_TEXT_FONT_FAMILY} !important`,
									},
									'& .pronounceable-word': {
										cursor: enableWordAssist ? 'pointer' : 'default',
										borderRadius: '0.2rem',
										padding: 0,
										margin: 0,
										transition: 'background-color 0.15s ease',
									},
									'& .pronounceable-word:hover': {
										backgroundColor: enableWordAssist ? 'rgba(1, 67, 90, 0.14)' : 'transparent',
									},
								}}
							/>
						);
					})}
				</TextContainer>
				<WordAssistPopper
					open={Boolean(anchorEl) && enableWordAssist}
					anchorEl={anchorEl}
					activeWord={activeWord}
					wordInfo={wordInfo}
					isLoadingWordInfo={isLoadingWordInfo}
					onPopperMouseOut={handlePopperMouseOut}
				/>
			</Column>

			{showWordBank && (
				<Column
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-start',
						boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
						borderRadius: '0.85rem',
						background: 'rgba(255,255,255,0.78)',
						border: '1px solid rgba(1, 67, 90, 0.12)',
						padding: '1.75rem 1rem',
						marginTop: '5rem',
						marginBottom: '2rem',
					}}>
					<Box sx={{ width: '100%', mb: 1.5 }}>
						<Typography
							variant='h6'
							sx={{
								fontSize: isMobileSizeSmall ? '0.85rem' : '1rem',
								fontWeight: 600,
								color: theme.palette.primary.main,
								fontFamily: LEARNER_TEXT_FONT_FAMILY,
							}}>
							Word bank
						</Typography>
						<Typography
							variant='body2'
							sx={{
								mt: 0.5,
								color: 'text.secondary',
								fontSize: isMobileSizeSmall ? '0.75rem' : '0.85rem',
								fontFamily: LEARNER_TEXT_FONT_FAMILY,
								lineHeight: 1.5,
							}}>
							{getWordBankHint(blankValuePairs?.length ?? 0)}
						</Typography>
					</Box>
					<Box
						sx={{
							borderRadius: '0.35rem',
							display: 'flex',
							justifyContent: 'center',
							flexWrap: 'wrap',
							height: '100%',
							width: '100%',
							minHeight: '4rem',
						}}>
						{responses?.map((response, index) => (
							<Item
								key={`response-${response.id}-${index}`}
								$isCorrect={null}
								$isSelected={!isInteractionLocked && selectedPoolIndex === index}
								$isInteractive={!isInteractionLocked}
								onClick={!isInteractionLocked ? () => handlePoolWordClick(index) : undefined}
								role={!isInteractionLocked ? 'button' : undefined}
								tabIndex={isInteractionLocked ? -1 : 0}
								onKeyDown={
									!isInteractionLocked
										? (event) => {
											if (event.key === 'Enter' || event.key === ' ') {
												event.preventDefault();
												handlePoolWordClick(index);
											}
										}
										: undefined
								}>
								<Typography
									variant='body2'
									component='span'
									sx={{ fontSize: isMobileSizeSmall ? '0.75rem' : '0.9rem', fontFamily: LEARNER_TEXT_FONT_FAMILY }}>
									{response.value}
								</Typography>
							</Item>
						))}
					</Box>
				</Column>
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
						<TextContainer>
							{textWithBlanks?.split?.(/(___\d+___)/g)?.map((segment, index) => {
								const match = segment.match(/___(\d+)___/);
								if (match) {
									const blankIndex = parseInt(match[1], 10) - 1;
									const correctValue = blankValuePairs[blankIndex]?.value;

									if (correctValue !== undefined) {
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
													fontSize: isMobileSize ? '0.75rem' : '0.9rem',
												}}>
												{correctValue}
											</Typography>
										);
									}
								}

								return (
									<Typography
										key={`correct-text-${index}`}
										variant='body2'
										component='span'
										sx={{ lineHeight: 2, fontSize: isMobileSize ? '0.75rem' : '0.9rem' }}>
										{decodeHtmlEntities(segment)
											.replace(/[()]/g, '')
											.replace(/<\/?[^>]+(>|$)/g, '')}
									</Typography>
								);
							})}
						</TextContainer>
					</Box>
				</Box>
			)}
		</Container>
	);
};

export default FillInTheBlanksDragDrop;
