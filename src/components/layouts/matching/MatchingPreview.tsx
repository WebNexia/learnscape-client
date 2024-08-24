import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import styled from 'styled-components';
import { MatchingPair } from '../../../interfaces/question';
import { Box, Typography } from '@mui/material';
import theme from '../../../themes';
import { useUserCourseLessonData } from '../../../hooks/useUserCourseLessonData';

const Container = styled(Box)`
	display: flex;
	justify-content: space-between;
	width: 90%;
	margin-top: 0.5rem;
	flex-grow: 1;
`;

const Column = styled(Box)`
	display: flex;
	flex-direction: column;
	width: 47.5%;
	flex-grow: 1;
`;

const Item = styled.div<{ $isCorrect: boolean | null }>`
	padding: 1rem;
	margin: 0.5rem 0.75rem;
	background-color: ${({ $isCorrect }) => ($isCorrect === null ? '#f4f4f4' : $isCorrect ? 'green' : '#d32f2f')};
	border: 1px solid ${({ $isCorrect }) => ($isCorrect === null ? '#ccc' : $isCorrect ? '#c3e6cb' : '#f5c6cb')};
	border-radius: 0.25rem;
	cursor: pointer;
	text-align: center;
`;

const DropArea = styled(Box)`
	padding: 1rem;
	margin: 0.5rem 0;
	background-color: #e0e0e0;
	border-radius: 0.35rem;
	min-height: 6rem;
	box-shadow: 0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2);
	flex-grow: 1;
`;

interface MatchingPreviewProps {
	fromPracticeQuestionUser?: boolean;
	initialPairs: MatchingPair[];
	displayedQuestionNumber?: number;
	numberOfQuestions?: number;
	setAllPairsMatched?: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLessonCompleted?: React.Dispatch<React.SetStateAction<boolean>>;
	setShowQuestionSelector?: React.Dispatch<React.SetStateAction<boolean>>;
}

const MatchingPreview = ({
	fromPracticeQuestionUser,
	initialPairs,
	displayedQuestionNumber,
	numberOfQuestions,
	setAllPairsMatched,
	setIsLessonCompleted,
	setShowQuestionSelector,
}: MatchingPreviewProps) => {
	const initialResponses = initialPairs.map((pair) => ({ id: pair.id, answer: pair.answer })).sort(() => Math.random() - 0.5);

	const [pairs, setPairs] = useState<MatchingPair[]>([]);
	const [responses, setResponses] = useState(initialResponses);

	const { updateLastQuestion, getLastQuestion, handleNextLesson } = useUserCourseLessonData();

	useEffect(() => {
		setPairs(initialPairs.map((pair) => ({ ...pair, answer: '' })));
		setResponses(initialPairs.map((pair) => ({ id: pair.id, answer: pair.answer })).sort(() => Math.random() - 0.5));
	}, [initialPairs]);

	useEffect(() => {
		const allCorrect = pairs.every((pair) => pair.answer === initialPairs.find((p) => p.id === pair.id)?.answer);
		if (setAllPairsMatched) setAllPairsMatched(allCorrect);

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
	}, [pairs, initialPairs]);

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) return;

		const { source, destination } = result;

		const newPairs = pairs.map((pair) => ({ ...pair }));
		const newResponses = responses.map((response) => ({ ...response }));

		if (source.droppableId === 'responses' && destination.droppableId.startsWith('prompt-')) {
			const pairIndex = parseInt(destination.droppableId.split('-')[1], 10);
			if (!newPairs[pairIndex].answer) {
				newPairs[pairIndex].answer = newResponses[source.index].answer;
				newResponses.splice(source.index, 1);
			}
		} else if (source.droppableId.startsWith('prompt-') && destination.droppableId === 'responses') {
			const pairIndex = parseInt(source.droppableId.split('-')[1], 10);
			const movedResponse = newPairs[pairIndex].answer;
			newPairs[pairIndex].answer = '';
			// Ensure the response is not added back with a duplicate key
			if (!newResponses.some((response) => response.answer === movedResponse)) {
				newResponses.splice(destination.index, 0, { id: `${newPairs[pairIndex].id}-response-${destination.index}`, answer: movedResponse });
			}
		} else if (source.droppableId === 'responses' && destination.droppableId === 'responses') {
			const [movedResponse] = newResponses.splice(source.index, 1);
			newResponses.splice(destination.index, 0, movedResponse);
		} else if (source.droppableId.startsWith('prompt-') && destination.droppableId.startsWith('prompt-')) {
			const pairIndexSource = parseInt(source.droppableId.split('-')[1], 10);
			const pairIndexDestination = parseInt(destination.droppableId.split('-')[1], 10);
			if (!newPairs[pairIndexDestination].answer) {
				const movedResponse = newPairs[pairIndexSource].answer;
				newPairs[pairIndexSource].answer = '';
				newPairs[pairIndexDestination].answer = movedResponse;
			}
		}

		setPairs(newPairs);
		setResponses(newResponses);
	};

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<Container>
				<Column sx={{ marginRight: '2rem' }}>
					{pairs.map((pair, index) => (
						<Droppable key={`prompt-${index}`} droppableId={`prompt-${index}`}>
							{(provided) => (
								<DropArea ref={provided.innerRef} {...provided.droppableProps}>
									<Typography variant='body2'>{pair.question}</Typography>
									{pair.answer ? (
										<Draggable key={`draggable-prompt-${pair.id}`} draggableId={`draggable-prompt-${pair.id}`} index={index}>
											{(provided) => (
												<Item
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
													$isCorrect={pair.answer === initialPairs.find((p) => p.id === pair.id)?.answer}>
													<Typography variant='body2' sx={{ color: 'white' }}>
														{pair.answer}
													</Typography>
												</Item>
											)}
										</Draggable>
									) : (
										<Box
											style={{
												minHeight: '2.5rem',
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
								{responses.map((response, index) => (
									<Draggable
										key={`draggable-response-${response.id}-${index}`}
										draggableId={`draggable-response-${response.id}-${index}`}
										index={index}>
										{(provided) => (
											<Item ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} $isCorrect={null}>
												<Typography variant='body2'>{response.answer}</Typography>
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

export default MatchingPreview;
