import React, { useContext, useEffect, useRef, useState } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { QuestionsContext } from '../../contexts/QuestionsContextProvider';
import { QuestionInterface } from '../../interfaces/question';
import { Lesson } from '../../interfaces/lessons';
import { Box, Checkbox, DialogContent, FormControlLabel, Table, TableBody, TableCell, TableRow } from '@mui/material';
import CustomTableHead from '../layouts/table/CustomTableHead';
import CustomTablePagination from '../layouts/table/CustomTablePagination';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import CustomTableCell from '../layouts/table/CustomTableCell';
import { stripHtml } from '../../utils/stripHtml';
import { truncateText } from '../../utils/utilText';
import { QuestionUpdateTrack } from '../../pages/AdminLessonEditPage';
import { LessonType, QuestionType } from '../../interfaces/enums';

interface AddNewQuestionDialogProps {
	addNewQuestionModalOpen: boolean;
	singleLessonBeforeSave: Lesson;
	setAddNewQuestionModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setIsLessonUpdated: React.Dispatch<React.SetStateAction<boolean>>;
	setSingleLessonBeforeSave: React.Dispatch<React.SetStateAction<Lesson>>;
	setIsQuestionUpdated: React.Dispatch<React.SetStateAction<QuestionUpdateTrack[]>>;
}

const AddNewQuestionDialog = ({
	addNewQuestionModalOpen,
	singleLessonBeforeSave,
	setAddNewQuestionModalOpen,
	setIsLessonUpdated,
	setSingleLessonBeforeSave,
	setIsQuestionUpdated,
}: AddNewQuestionDialogProps) => {
	const { sortQuestionsData, sortedQuestionsData, numberOfPages, questionsPageNumber, setQuestionsPageNumber, fetchQuestions } =
		useContext(QuestionsContext);
	const closeAddNewQuestionModal = () => setAddNewQuestionModalOpen(false);

	const [selectedQuestions, setSelectedQuestions] = useState<QuestionInterface[]>([]);
	const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
	const [orderBy, setOrderBy] = useState<keyof QuestionInterface>('questionType');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	useEffect(() => {
		if (addNewQuestionModalOpen) {
			setQuestionsPageNumber(1);
		}
	}, [addNewQuestionModalOpen, setQuestionsPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchQuestions(questionsPageNumber);
		}
	}, [questionsPageNumber]);

	const handleSort = (property: keyof QuestionInterface) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortQuestionsData(property, isAsc ? 'desc' : 'asc');
	};

	const handleCheckboxChange = (question: QuestionInterface) => {
		const selectedIndex = selectedQuestionIds.indexOf(question._id);
		let newSelectedQuestionIds: string[] = [];
		let newSelectedQuestions: QuestionInterface[] = [];

		if (selectedIndex === -1) {
			newSelectedQuestionIds = [...selectedQuestionIds, question._id];
			newSelectedQuestions = [...selectedQuestions, question];
		} else {
			newSelectedQuestionIds = selectedQuestionIds?.filter((id) => id !== question._id);
			newSelectedQuestions = selectedQuestions?.filter((selectedQuestion) => selectedQuestion._id !== question._id);
		}

		setSelectedQuestionIds(newSelectedQuestionIds);
		setSelectedQuestions(newSelectedQuestions);

		setIsLessonUpdated(true);
	};

	const handleAddQuestions = () => {
		setSingleLessonBeforeSave((prevData) => {
			return {
				...prevData,
				questions: prevData.questions.concat(selectedQuestions),
				questionIds: prevData.questionIds.concat(selectedQuestionIds),
			};
		});

		const addedQuestionsUpdateData: QuestionUpdateTrack[] = selectedQuestions?.reduce((acc: QuestionUpdateTrack[], value: QuestionInterface) => {
			acc.push({ questionId: value?._id, isUpdated: false });
			return acc;
		}, []);

		setIsQuestionUpdated((prevData) => {
			return [...prevData, ...addedQuestionsUpdateData];
		});

		setIsLessonUpdated(true);

		setSelectedQuestions([]);
		setSelectedQuestionIds([]);
		closeAddNewQuestionModal();
	};

	const handleResetCheckboxes = () => {
		setSelectedQuestions([]);
		setSelectedQuestionIds([]);
	};

	return (
		<CustomDialog openModal={addNewQuestionModalOpen} closeModal={closeAddNewQuestionModal} title='Add New Question'>
			<DialogContent>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: '2rem',
						mt: '1rem',
						width: '100%',
					}}>
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<QuestionInterface>
							orderBy={orderBy}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'questionType', label: 'Question Type' },
								{ key: 'question', label: 'Question' },
								{ key: 'actions', label: 'Add Questions' },
							]}
						/>
						<TableBody>
							{sortedQuestionsData &&
								sortedQuestionsData
									?.filter((question) => {
										const questionTypeName = question.questionType as QuestionType;
										if (singleLessonBeforeSave.type === LessonType.QUIZ) {
											return [
												QuestionType.MULTIPLE_CHOICE,
												QuestionType.TRUE_FALSE,
												QuestionType.OPEN_ENDED,
												QuestionType.AUDIO_VIDEO,
												QuestionType.MATCHING,
												QuestionType.FITB_TYPING,
												QuestionType.FITB_DRAG_DROP,
											].includes(questionTypeName);
										} else if (singleLessonBeforeSave.type === LessonType.PRACTICE_LESSON) {
											return [
												QuestionType.MULTIPLE_CHOICE,
												QuestionType.TRUE_FALSE,
												QuestionType.OPEN_ENDED,
												QuestionType.MATCHING,
												QuestionType.FITB_TYPING,
												QuestionType.FITB_DRAG_DROP,
												QuestionType.FLIP_CARD,
											].includes(questionTypeName);
										}
										return true;
									})
									?.filter((question) => !singleLessonBeforeSave.questionIds.includes(question._id))
									?.map((question: QuestionInterface) => {
										const isSelected = selectedQuestionIds.indexOf(question._id) !== -1;
										return (
											<TableRow key={question._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
												<CustomTableCell value={question.questionType} />
												<CustomTableCell value={truncateText(stripHtml(question.question), 15)} />

												<TableCell
													sx={{
														textAlign: 'center',
													}}>
													<FormControlLabel
														control={
															<Checkbox
																checked={isSelected}
																onChange={() => handleCheckboxChange(question)}
																sx={{
																	'& .MuiSvgIcon-root': {
																		fontSize: '1.25rem',
																	},
																}}
															/>
														}
														label=''
													/>
												</TableCell>
											</TableRow>
										);
									})}
						</TableBody>
					</Table>
					<CustomTablePagination count={numberOfPages} page={questionsPageNumber} onChange={setQuestionsPageNumber} />
				</Box>
			</DialogContent>
			<CustomDialogActions
				onCancel={() => {
					setAddNewQuestionModalOpen(false);
					handleResetCheckboxes();
				}}
				onSubmit={handleAddQuestions}
				submitBtnText='Add'
				actionSx={{ margin: '1.5rem 1rem 1.5rem 0' }}>
				<CustomCancelButton
					onClick={() => {
						handleResetCheckboxes();
					}}
					sx={{
						margin: '0 0.5rem 0.5rem 0',
					}}>
					Deselect All
				</CustomCancelButton>
			</CustomDialogActions>
		</CustomDialog>
	);
};

export default AddNewQuestionDialog;
