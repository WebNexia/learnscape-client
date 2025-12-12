import { useState, useEffect, useContext } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import styled from 'styled-components';
import { MatchingPair } from '../../../interfaces/question';
import { Box, Typography } from '@mui/material';
import theme from '../../../themes';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
import { QuizQuestionAnswer } from '../../../pages/LessonPage';
import { UserMatchingPairAnswers } from '../../../interfaces/userQuestion';
import { LessonType } from '../../../interfaces/enums';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

const Container = styled(Box)`
	display: flex;
	justify-content: space-between;
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
}>`
	padding: ${({ $isMobileSize }) => ($isMobileSize ? '0.5rem' : '0.75rem')};
	margin: ${({ $isMobileSize }) => ($isMobileSize ? '0.35rem 0.5rem' : '0.5rem 0.75rem')};
	background-color: ${({ $isCorrect, $fromQuizQuestionUser, $isLessonCompleted, $lessonType }) =>
		$isLessonCompleted
			? $isCorrect
				? theme.palette.success.main
				: '#ef5350'
			: ($fromQuizQuestionUser || $lessonType === LessonType.QUIZ) && !$isLessonCompleted
				? '#f4f4f4'
				: $isCorrect === null
					? '#f4f4f4'
					: $isCorrect
						? theme.palette.success.main
						: '#ef5350'};
	border: 1px solid
		${({ $isCorrect, $fromQuizQuestionUser, $isLessonCompleted, $lessonType }) =>
			$isLessonCompleted
				? $isCorrect
					? '#c3e6cb'
					: '#f5c6cb'
				: ($fromQuizQuestionUser || $lessonType === LessonType.QUIZ) && !$isLessonCompleted
					? '#ccc'
					: $isCorrect === null
						? '#ccc'
						: $isCorrect
							? '#c3e6cb'
							: '#f5c6cb'};
	border-radius: 0.25rem;
	cursor: ${({ $isLessonCompleted }) => ($isLessonCompleted ? 'default' : 'pointer')};
	text-align: center;
`;

const DropArea = styled(Box)<{ isMobileSize: boolean }>`
	padding: ${({ isMobileSize }) => (isMobileSize ? '0.65rem' : '0.75rem')};
	margin: 0.5rem 0;
	background-color: #e0e0e0;
	border-radius: 0.35rem;
	min-height: ${({ isMobileSize }) => (isMobileSize ? '5rem' : '6rem')};
	box-shadow: 0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2);
	flex-grow: 1;
`;

interface MatchingPreviewProps {
	questionId?: string;
	fromPracticeQuestionUser?: boolean;
	isLessonCompleted?: boolean;
	fromQuizQuestionUser?: boolean;
	initialPairs: MatchingPair[];
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

	const { updateLastQuestion, getLastQuestion } = useUserCourseLessonData();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

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
				const unusedResponses =
					initialPairs
						?.filter((pair) => !usedAnswers?.includes(pair.answer))
						?.map((pair) => ({ id: pair.id, question: pair.question, answer: pair.answer })) || [];
				setResponses(unusedResponses);
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
		isLessonCompleted,
		fromQuizQuestionUser,
		userMatchingPairsAfterSubmission,
		questionId,
		displayedQuestionNumber,
		hasInteracted,
		getLastQuestion(),
	]);

	// Add a useEffect to reset `allCorrect` state when question changes
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

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) return;

		if (isLessonCompleted && fromQuizQuestionUser) return; // Prevent dragging if lesson is completed for quiz

		setHasInteracted(true);

		const { source, destination } = result;

		const newPairs = pairs?.map((pair) => ({ ...pair })) || [];
		const newResponses = responses?.map((response) => ({ ...response })) || [];

		if (source.droppableId === 'responses' && destination.droppableId.startsWith('prompt-')) {
			const pairIndex = parseInt(destination.droppableId.split('-')[1], 10);
			if (!newPairs[pairIndex].answer) {
				const matchedAnswer = newResponses[source.index].answer;
				newPairs[pairIndex].answer = matchedAnswer;
				newResponses.splice(source.index, 1);

				// Check if match is correct and play sound
				const originalPair = initialPairs?.find((pair) => pair.id === newPairs[pairIndex].id);
				if (originalPair) {
					if (originalPair.answer === matchedAnswer) {
						onCorrectMatch?.();
					} else {
						onWrongMatch?.();
					}
				}
			}
		} else if (source.droppableId.startsWith('prompt-') && destination.droppableId === 'responses') {
			const pairIndex = parseInt(source.droppableId.split('-')[1], 10);
			const movedResponse = newPairs[pairIndex].answer;
			newPairs[pairIndex].answer = '';

			if (!newResponses?.some((response) => response.answer === movedResponse)) {
				const originalPair = initialPairs?.find((pair) => pair.id === newPairs[pairIndex].id);
				if (originalPair) {
					newResponses.splice(destination.index, 0, {
						id: originalPair.id,
						question: originalPair.question,
						answer: movedResponse,
					});
				}
			}
		} else if (source.droppableId === 'responses' && destination.droppableId === 'responses') {
			const [movedResponse] = newResponses.splice(source.index, 1);
			newResponses.splice(destination.index, 0, movedResponse);
		} else if (source.droppableId.startsWith('prompt-') && destination.droppableId.startsWith('prompt-')) {
			const pairIndexSource = parseInt(source.droppableId.split('-')[1], 10);
			const pairIndexDestination = parseInt(destination.droppableId.split('-')[1], 10);

			if (!newPairs[pairIndexDestination].answer || isLessonCompleted) {
				const movedResponse = newPairs[pairIndexSource].answer;
				newPairs[pairIndexSource].answer = '';
				newPairs[pairIndexDestination].answer = movedResponse;
			}
		}

		setPairs(newPairs);
		setResponses(newResponses);

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
	};

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
				{!isLessonCompleted && (
					<CustomInfoMessageAlignedLeft
						message='Drag the correct cards from the right into the dashed areas to match the pairs'
						sx={{ margin: '0 rem auto 0 auto', width: isMobileSize ? '100%' : '90%' }}
					/>
				)}
				<Container>
					<Column sx={{ marginRight: isMobileSize ? '1rem' : '2rem' }}>
						{pairs?.map((pair, index) => (
							<Droppable key={`prompt-${index}`} droppableId={`prompt-${index}`}>
								{(provided) => (
									<DropArea ref={provided.innerRef} {...provided.droppableProps} isMobileSize={isMobileSize}>
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											{pair.question}
										</Typography>
										{pair.answer ? (
											<Draggable key={`draggable-prompt-${pair.id}`} draggableId={`draggable-prompt-${pair.id}`} index={index}>
												{(provided) => (
													<Item
														ref={provided.innerRef}
														{...provided.draggableProps}
														{...provided.dragHandleProps}
														$isCorrect={pair.answer === initialPairs?.find((p) => p.id === pair.id)?.answer}
														$fromQuizQuestionUser={fromQuizQuestionUser}
														$lessonType={lessonType}
														$isLessonCompleted={isLessonCompleted}>
														<Typography
															variant='body2'
															sx={{
																color: (!isLessonCompleted && fromQuizQuestionUser) || lessonType === LessonType.QUIZ ? null : '#fff',
																fontSize: isMobileSize ? '0.75rem' : '0.85rem',
																margin: isMobileSize ? '-0.35rem 0rem' : '0rem',
															}}>
															{pair.answer}
														</Typography>
													</Item>
												)}
											</Draggable>
										) : (
											<Box
												style={{
													minHeight: isMobileSize ? '2rem' : '2.5rem',
													border: `dashed 0.1rem ${theme.bgColor?.lessonInProgress}`,
													backgroundColor: theme.bgColor?.commonTwo,
													borderRadius: '0.35rem',
													marginTop: '0.5rem',
												}}></Box>
										)}
										{provided.placeholder}
									</DropArea>
								)}
							</Droppable>
						))}
					</Column>
					<Column>
						<Droppable droppableId='responses'>
							{(provided) => (
								<Box
									ref={provided.innerRef}
									{...provided.droppableProps}
									sx={{
										boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
										borderRadius: '0.35rem',
										display: 'flex',
										flexDirection: 'column',
										height: '100%',
										margin: '0.5rem 0',
									}}>
									{responses?.map((response, index) => (
										<Draggable
											key={`draggable-response-${response.id}-${index}`}
											draggableId={`draggable-response-${response.id}-${index}`}
											index={index}
											isDragDisabled={isLessonCompleted && fromQuizQuestionUser}>
											{(provided) => (
												<Item
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
													$isCorrect={null}
													$fromQuizQuestionUser={fromQuizQuestionUser}
													$lessonType={lessonType}
													$isLessonCompleted={isLessonCompleted}
													$isMobileSize={isMobileSize}>
													<Typography
														variant='body2'
														sx={{ color: isLessonCompleted ? '#fff' : null, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
														{response.answer}
													</Typography>
												</Item>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</Box>
							)}
						</Droppable>
					</Column>
				</Container>
				{isLessonCompleted && fromQuizQuestionUser && (
					<Box sx={{ margin: isMobileSize ? '2rem 0 1.5rem 0' : '3rem 0 1.5rem 0' }}>
						<Box sx={{ margin: '1rem 0 1rem 0' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem' }}>
								Correct Matching
							</Typography>
						</Box>
						<Box
							sx={{
								borderRadius: '0.5rem',
								overflow: 'hidden',
								boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
								border: '1px solid rgba(0,0,0,0.1)',
							}}>
							{initialPairs?.map((pair, index) => {
								return (
									<Box
										sx={{
											'display': 'flex',
											'backgroundColor': index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
											'transition': 'background-color 0.2s ease',
											'&:hover': {
												backgroundColor: 'rgba(0,0,0,0.04)',
											},
										}}
										key={pair.id}>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'center',
												alignItems: 'center',
												flex: 1,
												borderRight: '1px solid rgba(0,0,0,0.1)',
												borderBottom: index < initialPairs.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none',
												padding: isMobileSize ? '0.35rem 0.5rem' : '0.75rem 1rem',
												backgroundColor: 'rgba(255,255,255,0.5)',
											}}>
											<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>{pair.question}</Typography>
										</Box>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'center',
												alignItems: 'center',
												flex: 1,
												borderBottom: index < initialPairs.length - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none',
												padding: isMobileSize ? '0.35rem 0.5rem' : '0.75rem 1rem',
												backgroundColor: 'rgba(255,255,255,0.5)',
											}}>
											<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>{pair.answer}</Typography>
										</Box>
									</Box>
								);
							})}
						</Box>
					</Box>
				)}
			</Box>
		</DragDropContext>
	);
};

export default MatchingPreview;
