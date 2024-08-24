import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import styled from 'styled-components';
import { Box, Typography } from '@mui/material';
import { BlankValuePair } from '../../../interfaces/question';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';

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
	line-height: 1.5rem;
	width: 100%;
	white-space: pre-wrap;
	margin: 0;
	padding: 0;
`;

const DropArea = styled(Box)<{ $isCorrect: boolean | null }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 4rem;
	height: 1.5rem;
	background-color: ${({ $isCorrect }) => ($isCorrect === null ? '#f0f0f0' : $isCorrect ? 'green' : '#d32f2f')};
	border: 0.1rem solid ${({ $isCorrect }) => ($isCorrect === null ? '#cccccc' : $isCorrect ? '#c3e6cb' : '#f5c6cb')};
	border-radius: 0.25rem;
	padding: 0 0.25rem;
	margin: 0 0.25rem;
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

const Item = styled.div<{ $isCorrect: boolean | null }>`
	padding: 0.25rem 0.5rem;
	margin: 0 0.25rem;
	background-color: ${({ $isCorrect }) => ($isCorrect === null ? '#e0e0e0' : $isCorrect ? '#d4edda' : '#e57373')}; /* Color depends on correctness */
	border: 1px solid ${({ $isCorrect }) => ($isCorrect === null ? '#cccccc' : $isCorrect ? '#c3e6cb' : '#f5c6cb')};
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

const FillInTheBlanksDragDrop = ({
	fromPracticeQuestionUser,
	textWithBlanks,
	blankValuePairs,
	onComplete,
	setAllPairsMatched,
	displayedQuestionNumber,
	numberOfQuestions,
	setIsLessonCompleted,
	setShowQuestionSelector,
}: FillInTheBlanksDragDropProps) => {
	const [blanks, setBlanks] = useState<BlankValuePair[]>([]);
	const [responses, setResponses] = useState<BlankValuePair[]>([]);
	const [textSegments, setTextSegments] = useState<string[]>([]);

	const { updateLastQuestion, getLastQuestion, handleNextLesson } = useUserCourseLessonData();

	useEffect(() => {
		const sanitizedHtml = sanitizeHtml(textWithBlanks).replace(/[()]/g, '');
		const segments = sanitizedHtml.split(/___\d+___/g).map((segment) => segment.replace(/<\/?[^>]+(>|$)/g, '').trim()); // Strip HTML tags
		setTextSegments(segments);

		const initializedBlanks = blankValuePairs.map((pair) => ({
			...pair,
			value: '',
		}));
		setBlanks(initializedBlanks);

		// Create a shuffled copy of blankValuePairs
		const shuffledResponses = [...blankValuePairs].sort(() => Math.random() - 0.5);
		setResponses(shuffledResponses);
	}, [textWithBlanks, blankValuePairs]);

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) {
			return;
		}

		const { source, destination } = result;
		const newBlanks = [...blanks];
		const newResponses = [...responses];

		const getBlankIndex = (id: string) => newBlanks.findIndex((blank) => `blank-${blank.id}` === id);

		try {
			// Handle dragging from responses to blanks
			if (source.droppableId === 'responses' && destination.droppableId.startsWith('blank-')) {
				const blankIndex = getBlankIndex(destination.droppableId);
				if (blankIndex !== -1 && !newBlanks[blankIndex].value) {
					newBlanks[blankIndex].value = newResponses[source.index].value;
					newResponses.splice(source.index, 1);
				}
			}

			// Handle dragging from blanks back to responses
			if (source.droppableId.startsWith('blank-') && destination.droppableId === 'responses') {
				const blankIndex = getBlankIndex(source.droppableId);
				const movedResponse = newBlanks[blankIndex].value;
				newBlanks[blankIndex].value = '';

				// Always insert the item back to the responses array, even if it's empty
				newResponses.splice(destination.index, 0, {
					id: `response-${newBlanks[blankIndex].id}`,
					blank: newBlanks[blankIndex].blank,
					value: movedResponse,
				});
			}

			// Handle reordering within responses
			if (source.droppableId === 'responses' && destination.droppableId === 'responses') {
				const [movedResponse] = newResponses.splice(source.index, 1);
				newResponses.splice(destination.index, 0, movedResponse);
			}

			// Handle moving items between blanks
			if (source.droppableId.startsWith('blank-') && destination.droppableId.startsWith('blank-')) {
				const blankIndexSource = getBlankIndex(source.droppableId);
				const blankIndexDestination = getBlankIndex(destination.droppableId);

				if (blankIndexSource !== -1 && blankIndexDestination !== -1 && !newBlanks[blankIndexDestination].value) {
					newBlanks[blankIndexDestination].value = newBlanks[blankIndexSource].value;
					newBlanks[blankIndexSource].value = '';
				}
			}

			// Update the state with the new arrays
			setBlanks(newBlanks);
			setResponses(newResponses);

			// Check if all answers are correct
			const allCorrect = newBlanks.every((blank) => blank.value === blankValuePairs.find((p) => p.blank === blank.blank)?.value);

			if (setAllPairsMatched) {
				setAllPairsMatched(allCorrect);
			}

			if (onComplete) {
				onComplete(allCorrect);
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
		} catch (error) {
			console.error('Error during handleDragEnd operation:', error);
		}
	};

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<Container>
				<Column sx={{ marginBottom: '3rem' }}>
					<TextContainer>
						{textSegments.map((segment, index) => (
							<React.Fragment key={`text-${index}`}>
								<Typography variant='body2' component='span' dangerouslySetInnerHTML={{ __html: segment }} sx={{ lineHeight: '2.25' }} />
								{blanks[index] && (
									<Droppable key={`blank-${blanks[index].id}`} droppableId={`blank-${blanks[index].id}`}>
										{(provided) => (
											<DropArea
												key={`drop-area-${blanks[index].id}-${blanks[index].value}`}
												ref={provided.innerRef}
												{...provided.droppableProps}
												$isCorrect={
													blanks[index].value ? blanks[index].value === blankValuePairs.find((p) => p.blank === blanks[index].blank)?.value : null
												}>
												{blanks[index].value ? (
													<Draggable key={`draggable-blank-${blanks[index].id}`} draggableId={`draggable-blank-${blanks[index].id}`} index={index}>
														{(provided, snapshot) => (
															<Item
																ref={provided.innerRef}
																{...provided.draggableProps}
																{...provided.dragHandleProps}
																$isCorrect={blanks[index].value === blankValuePairs.find((p) => p.blank === blanks[index].blank)?.value}
																style={{
																	...provided.draggableProps.style,
																	boxShadow: snapshot.isDragging ? '0px 5px 10px rgba(0, 0, 0, 0.2)' : 'none',
																	backgroundColor: snapshot.isDragging ? '#f0f0f0' : '#e0e0e0',
																}}>
																<Typography variant='body2' component='span' sx={{ display: 'inline-flex' }}>
																	{blanks[index].value}
																</Typography>
															</Item>
														)}
													</Draggable>
												) : null}
												{provided.placeholder}
											</DropArea>
										)}
									</Droppable>
								)}
							</React.Fragment>
						))}
					</TextContainer>
				</Column>

				<Column
					sx={{
						display: 'flex',
						alignItems: 'flex-start',
						boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
						borderRadius: '0.35rem',
						padding: '1rem',
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
								{responses.map((response, index) => (
									<Draggable
										key={`draggable-response-${response.id}-${index}`}
										draggableId={`draggable-response-${response.id}-${index}`}
										index={index}>
										{(provided) => (
											<Item ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} $isCorrect={null}>
												<Typography variant='body2' component='span'>
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
			</Container>
		</DragDropContext>
	);
};

export default FillInTheBlanksDragDrop;
