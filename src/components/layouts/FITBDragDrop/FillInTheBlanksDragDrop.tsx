import React, { useState, useEffect, useContext, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import styled from 'styled-components';
import { Box, Typography } from '@mui/material';
import { BlankValuePair } from '../../../interfaces/question';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';
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

const TextContainer = styled(Box)`
	display: inline;
	flex-wrap: wrap;
	align-items: baseline;
	line-height: 1.5rem;
	width: 100%;
	white-space: pre-wrap;
	margin: 0;
	padding: 0;
`;

const DropArea = styled(Box)<{ $isCorrect: boolean | null; $fromQuizQuestionUser?: boolean; $isLessonCompleted?: boolean; $lessonType?: string }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 4rem;
	height: 1.75rem;
	background-color: ${({ $isCorrect, $fromQuizQuestionUser, $isLessonCompleted, $lessonType }) =>
		$isLessonCompleted
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
		${({ $isCorrect, $fromQuizQuestionUser, $isLessonCompleted, $lessonType }) =>
			$isLessonCompleted
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
	padding: 0 0.25rem;
	margin: 0.1rem 0.35rem;
	font-size: 0.75rem;
	color: #495057;
	overflow: hidden;
	white-space: nowrap;
	text-align: center;
	vertical-align: middle;
	line-height: 1.5rem;
	flex-shrink: 0;
	width: auto;
`;

const Item = styled.div<{ $isCorrect: boolean | null; $fromQuizQuestionUser?: boolean; $lessonType?: string }>`
	padding: 0.25rem 0.5rem;
	margin: 0.5rem 0.35rem;
	background-color: ${({ $isCorrect, $fromQuizQuestionUser, $lessonType }) =>
		$fromQuizQuestionUser || $lessonType === LessonType.QUIZ ? '#e0e0e0' : $isCorrect === null ? '#e0e0e0' : $isCorrect ? '#d4edda' : '#e57373'};
	border: 1px solid
		${({ $isCorrect, $fromQuizQuestionUser, $lessonType }) =>
			$fromQuizQuestionUser || $lessonType === LessonType.QUIZ ? '#cccccc' : $isCorrect === null ? '#cccccc' : $isCorrect ? '#c3e6cb' : '#f5c6cb'};
	border-radius: 0.25rem;
	cursor: pointer;
	text-align: center;
	font-size: 0.75rem;
	color: #495057;
	position: relative;
	line-height: 1rem;
	width: auto;
	height: fit-content;
	max-width: 100%;
	display: inline-block;
	white-space: nowrap;
	&:hover {
		background-color: #ccc;
	}

	&[data-rbd-drag-handle-context-id] {
		box-shadow: 0px 0.2rem 0.1rem 0rem rgba(0, 0, 0, 0.3);
	}
`;

interface FillInTheBlanksDragDropProps {
	questionId?: string;
	fromPracticeQuestionUser?: boolean;
	fromQuizQuestionUser?: boolean;
	isLessonCompleted?: boolean;
	textWithBlanks: string;
	blankValuePairs: BlankValuePair[];
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
}

// Function to decode HTML entities
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
}: FillInTheBlanksDragDropProps) => {
	const [blanks, setBlanks] = useState<BlankValuePair[]>([]);
	const [responses, setResponses] = useState<BlankValuePair[]>([]);
	const [textSegments, setTextSegments] = useState<string[]>([]);
	const [hasInteracted, setHasInteracted] = useState(false);
	const responsesInitializedRef = useRef<boolean>(false);
	const previousQuestionIdRef = useRef<string | undefined>(questionId);

	const { updateLastQuestion, getLastQuestion } = useUserCourseLessonData();

	// Reset responses initialization when questionId changes
	useEffect(() => {
		if (previousQuestionIdRef.current !== questionId) {
			responsesInitializedRef.current = false;
			previousQuestionIdRef.current = questionId;
		}
	}, [questionId]);

	const { isRotated, isVerySmallScreen, isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	useEffect(() => {
		const sanitizedHtml = sanitizeHtml(decode(textWithBlanks))
			.replace(/[()]/g, '')
			.replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
			.replace(/&nbsp;/g, ' ') // Replace &nbsp; with a regular space
			.replace(/\n/g, '<br />') // Preserve line breaks by converting them to <br /> tags
			.replace(/^\s*[\r\n]/gm, ''); // Remove empty lines

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
		} else if (
			(isLessonCompleted && fromPracticeQuestionUser) ||
			(!isLessonCompleted && fromPracticeQuestionUser && displayedQuestionNumber! < getLastQuestion())
		) {
			populateBlanks(blankValuePairs);

			// Only set responses once, not on every update
			if (!responsesInitializedRef.current) {
				const remainingResponses = blankValuePairs?.filter((pair) => !initializedBlanks?.some((blank) => blank.value === pair.value)) || [];
				const randomWords = shuffle(words)?.slice(0, 5) || [];
				setResponses(shuffle([...remainingResponses, ...(randomWords?.map((word) => ({ id: `random-${word}`, value: word, blank: -1 })) || [])]));
				responsesInitializedRef.current = true;
			}
		}

		setBlanks(initializedBlanks);

		// Only set responses once, not on every update
		if (!isLessonCompleted && !responsesInitializedRef.current) {
			const wordCount = fromQuizQuestionUser || lessonType === LessonType.QUIZ ? 15 : 5;
			const randomWords = shuffle(words)?.slice(0, wordCount) || [];
			setResponses(shuffle([...blankValuePairs, ...(randomWords?.map((word) => ({ id: `random-${word}`, value: word, blank: -1 })) || [])]));
			responsesInitializedRef.current = true;
		}
	}, [
		textWithBlanks,
		blankValuePairs,
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

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) {
			return;
		}

		setHasInteracted(true);

		if (isLessonCompleted && lessonType !== LessonType.PRACTICE_LESSON) return;

		const { source, destination } = result;
		const newBlanks = [...blanks];
		const newResponses = [...responses];

		if (source.droppableId === 'responses' && destination.droppableId.startsWith('blank-')) {
			const blankIndex = newBlanks.findIndex((blank) => `blank-${blank.id}` === destination.droppableId);
			if (blankIndex !== -1 && !newBlanks[blankIndex].value) {
				const matchedValue = newResponses[source.index].value;
				newBlanks[blankIndex].value = matchedValue;
				newResponses.splice(source.index, 1);

				// Check if match is correct and play sound
				const correctValue = blankValuePairs?.find((p) => p.blank === newBlanks[blankIndex].blank)?.value;
				if (correctValue) {
					if (correctValue === matchedValue) {
						onCorrectMatch?.();
					} else {
						onWrongMatch?.();
					}
				}
			}
		}

		if (source.droppableId.startsWith('blank-') && destination.droppableId === 'responses') {
			const blankIndex = newBlanks.findIndex((blank) => `blank-${blank.id}` === source.droppableId);
			const movedResponse = newBlanks[blankIndex].value;
			newBlanks[blankIndex].value = '';

			newResponses.splice(destination.index, 0, {
				id: `response-${newBlanks[blankIndex].id}`,
				blank: newBlanks[blankIndex].blank,
				value: movedResponse,
			});
		}

		if (source.droppableId === 'responses' && destination.droppableId === 'responses') {
			const [movedResponse] = newResponses.splice(source.index, 1);
			newResponses.splice(destination.index, 0, movedResponse);
		}

		if (source.droppableId.startsWith('blank-') && destination.droppableId.startsWith('blank-')) {
			const blankIndexSource = newBlanks.findIndex((blank) => `blank-${blank.id}` === source.droppableId);
			const blankIndexDestination = newBlanks.findIndex((blank) => `blank-${blank.id}` === destination.droppableId);

			if (blankIndexSource !== -1 && blankIndexDestination !== -1 && !newBlanks[blankIndexDestination].value) {
				newBlanks[blankIndexDestination].value = newBlanks[blankIndexSource].value;
				newBlanks[blankIndexSource].value = '';
			}
		}

		setBlanks(newBlanks);
		setResponses(newResponses);

		if (fromQuizQuestionUser && !isLessonCompleted) {
			setUserQuizAnswers?.((prevData) => {
				const updatedAnswers = newBlanks?.map((blank) => ({
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

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<Container>
				<Column>
					<TextContainer>
						{textSegments?.map((segment, index) => {
							const match = segment.match(/___(\d+)___/);
							if (match) {
								const blankIndex = parseInt(match[1], 10) - 1;
								return (
									<Droppable key={`blank-${blanks[blankIndex].id}`} droppableId={`blank-${blanks[blankIndex].id}`}>
										{(provided) => (
											<DropArea
												key={`drop-area-${blanks[blankIndex].id}-${blanks[blankIndex].value}`}
												ref={provided.innerRef}
												{...provided.droppableProps}
												$isCorrect={
													blanks[blankIndex].value
														? blanks[blankIndex].value === blankValuePairs?.find((p) => p.blank === blanks[blankIndex].blank)?.value
														: null
												}
												$fromQuizQuestionUser={fromQuizQuestionUser}
												$lessonType={lessonType}
												$isLessonCompleted={isLessonCompleted}>
												{blanks[blankIndex].value ? (
													<Draggable
														key={`draggable-blank-${blanks[blankIndex].id}`}
														draggableId={`draggable-blank-${blanks[blankIndex].id}`}
														index={index}>
														{(provided, snapshot) => (
															<Item
																ref={provided.innerRef}
																{...provided.draggableProps}
																{...provided.dragHandleProps}
																$isCorrect={blanks[blankIndex].value === blankValuePairs?.find((p) => p.blank === blanks[blankIndex].blank)?.value}
																$fromQuizQuestionUser={fromQuizQuestionUser}
																$lessonType={lessonType}
																style={{
																	...provided.draggableProps.style,
																	boxShadow: snapshot.isDragging ? '0px 5px 10px rgba(0, 0, 0, 0.2)' : 'none',
																	backgroundColor: snapshot.isDragging ? '#f0f0f0' : '#e0e0e0',
																}}>
																<Typography
																	variant='body2'
																	component='span'
																	sx={{ display: 'inline-flex', fontSize: isMobileSizeSmall ? '0.75rem' : '0.85rem' }}>
																	{blanks[blankIndex].value}
																</Typography>
															</Item>
														)}
													</Draggable>
												) : null}
												{provided.placeholder}
											</DropArea>
										)}
									</Droppable>
								);
							}

							return (
								<Typography
									key={`text-${index}`}
									variant='body2'
									component='span'
									dangerouslySetInnerHTML={{ __html: segment }}
									sx={{ lineHeight: '2.25', fontSize: isMobileSizeSmall ? '0.75rem' : '0.85rem' }}
								/>
							);
						})}
					</TextContainer>
				</Column>

				{(!isLessonCompleted || lessonType === LessonType.PRACTICE_LESSON) && (
					<>
						<Box sx={{ width: '100%', flex: 1, mt: '2rem' }}>
							<CustomInfoMessageAlignedLeft message='Select and drag the correct word cards into the blanks to complete the sentence(s)' />
						</Box>
						<Column
							sx={{
								display: 'flex',
								alignItems: 'flex-start',
								boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
								borderRadius: '0.35rem',
								padding: '1rem',
								marginBottom: '2rem',
							}}>
							<Droppable droppableId='responses'>
								{(provided) => (
									<Box
										ref={provided.innerRef}
										{...provided.droppableProps}
										sx={{
											borderRadius: '0.35rem',
											display: 'flex',
											flexWrap: 'wrap',
											height: '100%',
											width: '100%',
											minHeight: '4rem',
										}}>
										{responses?.map((response, index) => (
											<Draggable
												key={`draggable-response-${response.id}-${index}`}
												draggableId={`draggable-response-${response.id}-${index}`}
												index={index}>
												{(provided) => (
													<Item ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} $isCorrect={null}>
														<Typography variant='body2' component='span' sx={{ fontSize: isMobileSizeSmall ? '0.75rem' : '0.85rem' }}>
															{response.value}
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
					</>
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
														fontSize: isMobileSize ? '0.75rem' : '0.85rem',
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
											sx={{ lineHeight: 2, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
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
		</DragDropContext>
	);
};

export default FillInTheBlanksDragDrop;
