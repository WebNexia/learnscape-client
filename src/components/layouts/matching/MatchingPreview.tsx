import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { MatchingPair, QuizMatchingOption } from '../../../interfaces/question';
import { Box, Typography } from '@mui/material';
import { LinkOutlined } from '@mui/icons-material';
import theme from '../../../themes';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import { QuizQuestionAnswer } from '../../../pages/LessonPage';
import { UserMatchingPairAnswers } from '../../../interfaces/userQuestion';
import { LessonType } from '../../../interfaces/enums';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import FitbInteractionModeBadge from '../fitb/FitbInteractionModeBadge';

const Container = styled(Box)`
	display: flex;
	justify-content: space-between;
	align-items: stretch;
	width: 100%;
	margin: 0.5rem auto 0 auto;
	flex-grow: 1;
`;

const Column = styled(Box)`
	display: flex;
	flex-direction: column;
	width: 47.5%;
	flex-grow: 1;
`;

const Item = styled.div<{
	$isCorrect: boolean | null;
	$fromQuizQuestionUser?: boolean;
	$isLessonCompleted?: boolean;
	$lessonType?: string;
	$isMobileSize?: boolean;
	$isResponseItem?: boolean;
	$isSelected?: boolean;
	$isInteractive?: boolean;
}>`
	padding: ${({ $isMobileSize }) => ($isMobileSize ? '0.5rem' : '0.75rem')};
	margin: ${({ $isMobileSize, $isResponseItem }) =>
		$isResponseItem ? ($isMobileSize ? '1rem 0.6rem' : '1.1rem 0.75rem') : $isMobileSize ? '0.35rem 0.5rem' : '0.5rem 0.75rem'};
	background: ${({ $isCorrect, $fromQuizQuestionUser, $isLessonCompleted, $lessonType, $isSelected }) =>
		$isSelected
			? 'linear-gradient(135deg, #e8f4f8 0%, #d4ebf2 100%)'
			: $isLessonCompleted
				? $isCorrect
					? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
					: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
				: ($fromQuizQuestionUser || $lessonType === LessonType.QUIZ) && !$isLessonCompleted
					? 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)'
					: $isCorrect === null
						? 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)'
						: $isCorrect
							? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
							: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
	border: ${({ $isCorrect, $fromQuizQuestionUser, $isLessonCompleted, $lessonType, $isSelected }) =>
		$isSelected
			? `2px solid ${theme.palette.primary.main}`
			: `1px solid ${
					$isLessonCompleted
						? $isCorrect
							? '#b7e4c7'
							: '#f1b8bd'
						: ($fromQuizQuestionUser || $lessonType === LessonType.QUIZ) && !$isLessonCompleted
							? 'rgba(1, 67, 90, 0.16)'
							: $isCorrect === null
								? 'rgba(1, 67, 90, 0.16)'
								: $isCorrect
									? '#b7e4c7'
									: '#f1b8bd'
				}`};
	border-radius: 0.62rem;
	cursor: ${({ $isLessonCompleted, $isInteractive }) =>
		$isLessonCompleted ? 'default' : $isInteractive === false ? 'default' : 'pointer'};
	text-align: center;
	box-shadow: ${({ $isSelected }) => ($isSelected ? '0 0 0 2px rgba(1, 67, 90, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.06)')};
	transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;

	&:hover {
		transform: ${({ $isLessonCompleted, $isInteractive }) =>
			$isLessonCompleted || $isInteractive === false ? 'none' : 'translateY(-1px)'};
	}
`;

const PromptDropArea = styled(Box)<{ isMobileSize: boolean }>`
	padding: ${({ isMobileSize }) => (isMobileSize ? '0.65rem' : '0.75rem')};
	margin: 0.5rem 0;
	background: rgba(255, 255, 255, 0.78);
	border-radius: 0.8rem;
	min-height: ${({ isMobileSize }) => (isMobileSize ? '4rem' : '5rem')};
	box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
	border: 2px solid rgba(1, 67, 90, 0.1);
	flex-grow: 1;
`;

const DashedSlot = styled(Box)<{ $isDropTarget?: boolean; $isInteractive?: boolean; $isMobileSize?: boolean }>`
	min-height: ${({ $isMobileSize }) => ($isMobileSize ? '2rem' : '2.5rem')};
	border: ${({ $isDropTarget }) =>
		$isDropTarget ? `dashed 0.12rem ${theme.palette.primary.main}` : `dashed 0.1rem ${theme.bgColor?.lessonInProgress}`};
	background: ${({ $isDropTarget }) => ($isDropTarget ? 'rgba(1, 67, 90, 0.08)' : 'rgba(1, 67, 90, 0.04)')};
	border-radius: 0.55rem;
	margin-top: 0.5rem;
	cursor: ${({ $isInteractive }) => ($isInteractive ? 'pointer' : 'default')};
	box-shadow: ${({ $isDropTarget }) => ($isDropTarget ? '0 0 0 2px rgba(1, 67, 90, 0.2)' : 'none')};
	transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
`;

interface MatchingPreviewProps {
	questionId?: string;
	fromPracticeQuestionUser?: boolean;
	isLessonCompleted?: boolean;
	fromQuizQuestionUser?: boolean;
	initialPairs: MatchingPair[];
	quizMatchingOptions?: QuizMatchingOption[];
	displayedQuestionNumber?: number;
	numberOfQuestions?: number;
	userMatchingPairsAfterSubmission?: UserMatchingPairAnswers[];
	lessonType?: string | undefined;
	userQuizAnswers?: QuizQuestionAnswer[];
	setAllPairsMatchedMatching?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLessonCompleted?: React.Dispatch<React.SetStateAction<boolean>>;
	setShowQuestionSelector?: React.Dispatch<React.SetStateAction<boolean>>;
	setUserQuizAnswers?: React.Dispatch<React.SetStateAction<QuizQuestionAnswer[]>>;
	onCorrectMatch?: () => void;
	onWrongMatch?: () => void;
}

const MatchingPreview = ({
	questionId,
	fromPracticeQuestionUser,
	isLessonCompleted,
	fromQuizQuestionUser,
	initialPairs,
	quizMatchingOptions,
	displayedQuestionNumber,
	numberOfQuestions,
	userMatchingPairsAfterSubmission,
	lessonType,
	userQuizAnswers,
	setAllPairsMatchedMatching,
	setIsLessonCompleted,
	setShowQuestionSelector,
	setUserQuizAnswers,
	onCorrectMatch,
	onWrongMatch,
}: MatchingPreviewProps) => {
	const [pairs, setPairs] = useState<MatchingPair[]>([]);
	const [responses, setResponses] = useState<MatchingPair[]>([]);
	const [hasInteracted, setHasInteracted] = useState(false);
	const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null);
	const previousQuestionIdRef = useRef<string | undefined>(questionId);

	const { updateLastQuestion, getLastQuestion } = useUserCourseLessonData();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isInteractionLocked = Boolean(isLessonCompleted);

	useEffect(() => {
		if (previousQuestionIdRef.current !== questionId) {
			previousQuestionIdRef.current = questionId;
			setSelectedResponseIndex(null);
		}
	}, [questionId]);

	useEffect(() => {
		// For admin preview mode, always initialize with initialPairs
		if (!fromPracticeQuestionUser && !fromQuizQuestionUser) {
			if (initialPairs && initialPairs.length > 0) {
				setPairs(initialPairs?.map((pair) => ({ ...pair, answer: '' })) || []);
				setResponses(
					initialPairs?.map((pair) => ({ id: pair.id, question: pair.question, answer: pair.answer }))?.sort(() => Math.random() - 0.5) || []
				);
			}
			return;
		}

		if (isLessonCompleted && fromQuizQuestionUser && userMatchingPairsAfterSubmission) {
			const matchedPairs = initialPairs?.map((pair) => {
				const userMatch = userMatchingPairsAfterSubmission?.find((match) => match.id === pair.id);
				return {
					...pair,
					answer: userMatch ? userMatch.answer : '',
				};
			});
			setPairs(matchedPairs);

			const usedAnswers = userMatchingPairsAfterSubmission?.map((match) => match.answer) || [];
			const unusedResponses =
				initialPairs
					?.filter((pair) => !usedAnswers?.includes(pair.answer))
					?.map((pair) => ({ id: pair.id, question: pair.question, answer: pair.answer })) || [];
			setResponses(unusedResponses);
		} else if (!isLessonCompleted && fromQuizQuestionUser) {
			const userAnswer = userQuizAnswers?.find((quiz) => quiz.questionId === questionId);
			const availableQuizResponses =
				quizMatchingOptions?.map((option, index) => ({
					id: option.id || `quiz-matching-option-${index}`,
					question: '',
					answer: option.answer,
				})) || [];

			if (userAnswer && userAnswer.userMatchingPairAnswers) {
				const matchedPairs = initialPairs?.map((pair) => {
					const userMatch = userAnswer.userMatchingPairAnswers?.find((match) => match.id === pair.id);
					return {
						...pair,
						answer: userMatch ? userMatch.answer : '',
					};
				});
				setPairs(matchedPairs);

				const usedAnswers = userAnswer.userMatchingPairAnswers?.map((match) => match.answer) || [];
				const unusedResponses = availableQuizResponses.filter((pair) => !usedAnswers?.includes(pair.answer));
				setResponses(unusedResponses);
			} else if (!hasInteracted) {
				setPairs(initialPairs?.map((pair) => ({ ...pair, answer: '' })) || []);
				setResponses(availableQuizResponses);
			}
		} else if ((isLessonCompleted && !fromQuizQuestionUser && initialPairs) || (!isLessonCompleted && displayedQuestionNumber! < getLastQuestion())) {
			const correctPairs = initialPairs?.map((pair) => ({
				...pair,
				answer: pair.answer,
			}));
			setPairs(correctPairs);

			const usedAnswers = initialPairs?.map((pair) => pair.answer) || [];
			const unusedResponses =
				initialPairs
					?.filter((pair) => !usedAnswers?.includes(pair.answer))
					?.map((pair) => ({ id: pair.id, question: pair.question, answer: pair.answer })) || [];
			setResponses(unusedResponses);
		} else if (!hasInteracted) {
			setPairs(initialPairs?.map((pair) => ({ ...pair, answer: '' })) || []);
			setResponses(
				initialPairs?.map((pair) => ({ id: pair.id, question: pair.question, answer: pair.answer }))?.sort(() => Math.random() - 0.5) || []
			);
		}
	}, [
		initialPairs,
		quizMatchingOptions,
		isLessonCompleted,
		fromQuizQuestionUser,
		fromPracticeQuestionUser,
		userMatchingPairsAfterSubmission,
		questionId,
		displayedQuestionNumber,
		hasInteracted,
		getLastQuestion(),
	]);

	useEffect(() => {
		if (hasInteracted && fromPracticeQuestionUser) {
			const allCorrect = pairs?.every((pair) => pair.answer === initialPairs?.find((p) => p.id === pair.id)?.answer) || false;

			if (setAllPairsMatchedMatching) setAllPairsMatchedMatching(allCorrect);

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
	}, [pairs, hasInteracted]);

	useEffect(() => {
		setUserQuizAnswers?.((prevData) => {
			const matchingPairsWithIds: UserMatchingPairAnswers[] = initialPairs?.map((pair) => ({
				id: pair.id,
				answer: '',
			}));

			if (prevData) {
				return prevData?.map((data) => {
					if (data.questionId === questionId) {
						return { ...data, userMatchingPairAnswers: matchingPairsWithIds };
					}
					return data;
				});
			}

			return prevData;
		});
	}, [initialPairs, questionId]);

	const persistQuizAnswers = useCallback(
		(newPairs: MatchingPair[]) => {
			if (fromQuizQuestionUser && !isLessonCompleted) {
				setUserQuizAnswers?.((prevData) => {
					const updatedAnswers = newPairs?.map((pair) => ({
						id: pair.id,
						answer: pair.answer,
					}));

					if (prevData) {
						return prevData?.map((data) => {
							if (data.questionId === questionId) {
								return { ...data, userMatchingPairAnswers: updatedAnswers };
							}
							return data;
						});
					}

					return prevData;
				});
			}
		},
		[fromQuizQuestionUser, isLessonCompleted, questionId, setUserQuizAnswers]
	);

	const commitBoardUpdate = useCallback(
		(newPairs: MatchingPair[], newResponses: MatchingPair[]) => {
			setPairs(newPairs);
			setResponses(newResponses);
			persistQuizAnswers(newPairs);
		},
		[persistQuizAnswers]
	);

	const playMatchFeedback = useCallback(
		(pairId: string, matchedAnswer: string) => {
			const originalPair = initialPairs?.find((pair) => pair.id === pairId);
			if (originalPair) {
				if (originalPair.answer === matchedAnswer) {
					onCorrectMatch?.();
				} else {
					onWrongMatch?.();
				}
			}
		},
		[initialPairs, onCorrectMatch, onWrongMatch]
	);

	const handleResponseClick = (index: number) => {
		if (isInteractionLocked) return;
		setSelectedResponseIndex((prev) => (prev === index ? null : index));
	};

	const handlePromptClick = (pairIndex: number) => {
		if (isInteractionLocked) return;

		const pair = pairs[pairIndex];
		if (!pair) return;

		if (pair.answer) {
			setHasInteracted(true);
			setSelectedResponseIndex(null);

			const newPairs = pairs?.map((p) => ({ ...p })) || [];
			const newResponses = responses?.map((response) => ({ ...response })) || [];
			const movedResponse = newPairs[pairIndex].answer;
			newPairs[pairIndex].answer = '';

			if (!newResponses?.some((response) => response.answer === movedResponse)) {
				const originalPair = initialPairs?.find((p) => p.id === newPairs[pairIndex].id);
				if (originalPair) {
					newResponses.push({
						id: originalPair.id,
						question: originalPair.question,
						answer: movedResponse,
					});
				}
			}

			commitBoardUpdate(newPairs, newResponses);
			return;
		}

		if (selectedResponseIndex === null || selectedResponseIndex >= responses.length) return;

		setHasInteracted(true);

		const newPairs = pairs?.map((p) => ({ ...p })) || [];
		const newResponses = responses?.map((response) => ({ ...response })) || [];
		const matchedAnswer = newResponses[selectedResponseIndex].answer;
		newPairs[pairIndex].answer = matchedAnswer;
		newResponses.splice(selectedResponseIndex, 1);

		playMatchFeedback(newPairs[pairIndex].id, matchedAnswer);
		setSelectedResponseIndex(null);
		commitBoardUpdate(newPairs, newResponses);
	};

	const hasSelectedResponse = selectedResponseIndex !== null && !isInteractionLocked;

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
			{!isLessonCompleted && <FitbInteractionModeBadge mode='tap' compact={isMobileSize} />}
			<Container>
				<Column sx={{ marginRight: isMobileSize ? '1rem' : '2rem' }}>
					{pairs?.map((pair, index) => {
						const isCorrect = pair.answer ? pair.answer === initialPairs?.find((p) => p.id === pair.id)?.answer : null;
						const isEmptyDropTarget = hasSelectedResponse && !pair.answer;
						const canInteractWithPrompt = !isInteractionLocked && (Boolean(pair.answer) || isEmptyDropTarget);

						return (
							<PromptDropArea key={`prompt-${pair.id}-${index}`} isMobileSize={isMobileSize}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 600, color: theme.textColor?.secondary.main }}>
									{pair.question}
								</Typography>
								{pair.answer ? (
									<Item
										$isCorrect={isCorrect}
										$fromQuizQuestionUser={fromQuizQuestionUser}
										$lessonType={lessonType}
										$isLessonCompleted={isLessonCompleted}
										$isInteractive={canInteractWithPrompt}
										onClick={() => handlePromptClick(index)}
										role={canInteractWithPrompt ? 'button' : undefined}
										tabIndex={canInteractWithPrompt ? 0 : undefined}
										onKeyDown={(event) => {
											if (event.key === 'Enter' || event.key === ' ') {
												event.preventDefault();
												handlePromptClick(index);
											}
										}}>
										<Typography
											variant='body2'
											sx={{
												color:
													(!isLessonCompleted && fromQuizQuestionUser) || lessonType === LessonType.QUIZ
														? theme.textColor?.secondary.main
														: '#fff',
												fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												margin: isMobileSize ? '-0.35rem 0rem' : '0rem',
												fontWeight: 600,
											}}>
											{pair.answer}
										</Typography>
									</Item>
								) : (
									<DashedSlot
										$isDropTarget={isEmptyDropTarget}
										$isInteractive={canInteractWithPrompt}
										$isMobileSize={isMobileSize}
										onClick={() => handlePromptClick(index)}
										role={canInteractWithPrompt ? 'button' : undefined}
										tabIndex={canInteractWithPrompt ? 0 : undefined}
										onKeyDown={(event) => {
											if (event.key === 'Enter' || event.key === ' ') {
												event.preventDefault();
												handlePromptClick(index);
											}
										}}
									/>
								)}
							</PromptDropArea>
						);
					})}
				</Column>
				<Column>
					<Box
						sx={{
							width: '100%',
							display: 'flex',
							flexDirection: 'column',
							height: '100%',
							alignItems: 'center',
							justifyContent: 'center',
						}}>
						<Box
							sx={{
								borderRadius: '0.8rem',
								display: 'flex',
								flexDirection: 'column',
								width: '100%',
								height: '100%',
								minHeight: '100%',
								justifyContent: 'center',
								overflowY: 'auto',
								scrollbarGutter: 'stable',
								margin: '0.5rem 0',
								padding: '0.5rem 0',
								background: 'rgba(255, 255, 255, 0.78)',
							}}>
							{responses?.map((response, index) => (
								<Item
									key={`response-${response.id}-${index}`}
									$isCorrect={null}
									$fromQuizQuestionUser={fromQuizQuestionUser}
									$lessonType={lessonType}
									$isLessonCompleted={isLessonCompleted}
									$isMobileSize={isMobileSize}
									$isResponseItem={true}
									$isSelected={!isInteractionLocked && selectedResponseIndex === index}
									$isInteractive={!isInteractionLocked}
									onClick={!isInteractionLocked ? () => handleResponseClick(index) : undefined}
									role={!isInteractionLocked ? 'button' : undefined}
									tabIndex={!isInteractionLocked ? 0 : undefined}
									onKeyDown={(event) => {
										if (!isInteractionLocked && (event.key === 'Enter' || event.key === ' ')) {
											event.preventDefault();
											handleResponseClick(index);
										}
									}}>
									<Typography
										variant='body2'
										sx={{
											color: isLessonCompleted ? '#fff' : theme.textColor?.secondary.main,
											fontSize: isMobileSize ? '0.75rem' : '0.85rem',
											fontWeight: 600,
										}}>
										{response.answer}
									</Typography>
								</Item>
							))}
						</Box>
					</Box>
				</Column>
			</Container>
			{isLessonCompleted && fromQuizQuestionUser && (
				<Box sx={{ margin: isMobileSize ? '2rem 0 1.5rem 0' : '3rem 0 1.5rem 0' }}>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							mb: '0.85rem',
						}}>
						<LinkOutlined sx={{ color: theme.bgColor?.greenPrimary, fontSize: isMobileSize ? '1.1rem' : '1.25rem' }} />
						<Typography
							variant='subtitle1'
							sx={{
								fontWeight: 600,
								fontSize: isMobileSize ? '0.88rem' : '1rem',
								color: theme.textColor?.primary?.main,
							}}>
							Correct Matching
						</Typography>
					</Box>
					<Box
						sx={{
							borderRadius: '0.55rem',
							overflow: 'hidden',
							border: '1.5px solid rgba(1, 67, 90, 0.28)',
							borderLeft: `4px solid ${theme.bgColor?.greenPrimary}`,
							boxShadow: '0 0.1rem 0.3rem rgba(1, 67, 90, 0.1)',
							background: 'linear-gradient(135deg, rgba(30, 194, 139, 0.05) 0%, rgba(255, 255, 255, 1) 40%)',
						}}>
						<Box
							sx={{
								display: 'flex',
								backgroundColor: 'rgba(1, 67, 90, 0.06)',
								borderBottom: '1.5px solid rgba(1, 67, 90, 0.24)',
							}}>
							{['Prompt', 'Match'].map((label, colIndex) => (
								<Box
									key={label}
									sx={{
										flex: 1,
										py: isMobileSize ? '0.45rem' : '0.6rem',
										px: isMobileSize ? '0.5rem' : '1rem',
										textAlign: 'center',
										borderRight: colIndex === 0 ? '1.5px solid rgba(1, 67, 90, 0.22)' : 'none',
									}}>
									<Typography
										variant='caption'
										sx={{
											fontWeight: 700,
											letterSpacing: '0.05em',
											textTransform: 'uppercase',
											fontSize: isMobileSize ? '0.58rem' : '0.65rem',
											color: theme.textColor?.secondary?.main,
										}}>
										{label}
									</Typography>
								</Box>
							))}
						</Box>
						{initialPairs?.map((pair, index) => {
							return (
								<Box
									sx={{
										display: 'flex',
										backgroundColor: index % 2 === 0 ? 'rgba(30, 194, 139, 0.06)' : 'rgba(255, 255, 255, 0.9)',
										transition: 'background-color 0.2s ease',
									}}
									key={pair.id}>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'center',
											alignItems: 'center',
											flex: 1,
											borderRight: '1.5px solid rgba(1, 67, 90, 0.22)',
											borderBottom: index < initialPairs.length - 1 ? '1.5px solid rgba(1, 67, 90, 0.18)' : 'none',
											padding: isMobileSize ? '0.5rem 0.65rem' : '0.8rem 1rem',
										}}>
										<Typography
											sx={{
												fontSize: isMobileSize ? '0.78rem' : '0.88rem',
												fontWeight: 600,
												color: theme.textColor?.primary?.main,
											}}>
											{pair.question}
										</Typography>
									</Box>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'center',
											alignItems: 'center',
											flex: 1,
											borderBottom: index < initialPairs.length - 1 ? '1.5px solid rgba(1, 67, 90, 0.18)' : 'none',
											padding: isMobileSize ? '0.5rem 0.65rem' : '0.8rem 1rem',
										}}>
										<Typography
											sx={{
												fontSize: isMobileSize ? '0.78rem' : '0.88rem',
												fontWeight: 600,
												color: theme.bgColor?.greenPrimary,
											}}>
											{pair.answer}
										</Typography>
									</Box>
								</Box>
							);
						})}
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default MatchingPreview;
