import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import { QuestionInterface } from '../interfaces/question';

import useNewQuestion from '../hooks/useNewQuestion';
import CreateQuestionDialog from '../components/forms/newQuestion/CreateQuestionDialog';
import EditQuestionDialog from '../components/forms/editQuestion/EditQuestionDialog';

const AdminQuestions = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { sortQuestionsData, sortedQuestionsData, removeQuestion, numberOfPages, pageNumber, setPageNumber } = useContext(QuestionsContext);

	const [orderBy, setOrderBy] = useState<keyof QuestionInterface>('questionType');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof QuestionInterface) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortQuestionsData(property, isAsc ? 'desc' : 'asc');
	};

	const [questionType, setQuestionType] = useState<string>('');

	const [isQuestionDeleteModalOpen, setIsQuestionDeleteModalOpen] = useState<boolean[]>([]);
	const [editQuestionModalOpen, setEditQuestionModalOpen] = useState<boolean[]>([]);
	const [isQuestionCreateModalOpen, setIsQuestionCreateModalOpen] = useState<boolean>(false);

	const {
		options,
		setOptions,
		correctAnswerIndex,
		setCorrectAnswerIndex,
		correctAnswer,
		setCorrectAnswer,
		isDuplicateOption,
		setIsDuplicateOption,
		setIsMinimumOptions,
		isMinimumOptions,
		addOption,
		removeOption,
		handleCorrectAnswerChange,
		handleOptionChange,
	} = useNewQuestion();

	useEffect(() => {
		setIsQuestionDeleteModalOpen(Array(sortedQuestionsData.length).fill(false));
		setEditQuestionModalOpen(Array(sortedQuestionsData.length).fill(false));
	}, [sortedQuestionsData, pageNumber]);

	const openDeleteQuestionModal = (index: number) => {
		const updatedState = [...isQuestionDeleteModalOpen];
		updatedState[index] = true;
		setIsQuestionDeleteModalOpen(updatedState);
	};
	const closeDeleteQuestionModal = (index: number) => {
		const updatedState = [...isQuestionDeleteModalOpen];
		updatedState[index] = false;
		setIsQuestionDeleteModalOpen(updatedState);
	};

	const deleteQuestion = async (questionId: string): Promise<void> => {
		try {
			removeQuestion(questionId);
			await axios.delete(`${base_url}/questions/${questionId}`);
		} catch (error) {
			console.log(error);
		}
	};

	// Function to toggle edit modal for a specific question
	const toggleQuestionEditModal = (index: number) => {
		const newEditModalOpen = [...editQuestionModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setEditQuestionModalOpen(newEditModalOpen);
	};
	const closeQuestionEditModal = (index: number) => {
		const newEditModalOpen = [...editQuestionModalOpen];
		newEditModalOpen[index] = false;
		setEditQuestionModalOpen(newEditModalOpen);
	};

	return (
		<DashboardPagesLayout pageName='Lessons' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '2rem', width: '100%' }}>
				<CustomSubmitButton
					onClick={() => {
						setIsQuestionCreateModalOpen(true);
						setQuestionType('');
						setOptions(['']);
						setCorrectAnswer('');
						setIsDuplicateOption(false);
						setIsMinimumOptions(true);
						setCorrectAnswerIndex(-1);
					}}
					type='button'>
					New Question
				</CustomSubmitButton>
			</Box>

			<CreateQuestionDialog
				createNewQuestion={true}
				questionType={questionType}
				options={options}
				correctAnswer={correctAnswer}
				correctAnswerIndex={correctAnswerIndex}
				isQuestionCreateModalOpen={isQuestionCreateModalOpen}
				setQuestionType={setQuestionType}
				setOptions={setOptions}
				setCorrectAnswer={setCorrectAnswer}
				setCorrectAnswerIndex={setCorrectAnswerIndex}
				setIsQuestionCreateModalOpen={setIsQuestionCreateModalOpen}
				addOption={addOption}
				removeOption={removeOption}
				handleCorrectAnswerChange={handleCorrectAnswerChange}
				handleOptionChange={handleOptionChange}
				isMinimumOptions={isMinimumOptions}
				isDuplicateOption={isDuplicateOption}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '1rem 2rem 2rem 2rem',
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
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{sortedQuestionsData &&
							sortedQuestionsData.map((question: QuestionInterface, index) => {
								return (
									<TableRow key={question._id}>
										<CustomTableCell value={question.questionType} />
										<CustomTableCell value={question.question} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn title='Clone' onClick={() => {}} icon={<FileCopy />} />
											<CustomActionBtn
												title='Edit'
												onClick={() => {
													setOptions(question.options);
													setCorrectAnswer(question.correctAnswer);
													const correctAnswerIndex = question.options.indexOf(question.correctAnswer);
													setCorrectAnswerIndex(correctAnswerIndex);
													toggleQuestionEditModal(index);
													setIsDuplicateOption(false);
													setIsMinimumOptions(true);
												}}
												icon={<Edit />}
											/>

											<EditQuestionDialog
												fromLessonEditPage={false}
												question={question}
												correctAnswerIndex={correctAnswerIndex}
												index={index}
												options={options}
												correctAnswer={question.correctAnswer}
												questionType={question.questionType}
												isMinimumOptions={isMinimumOptions}
												isDuplicateOption={isDuplicateOption}
												handleCorrectAnswerChange={handleCorrectAnswerChange}
												setCorrectAnswerIndex={setCorrectAnswerIndex}
												handleOptionChange={handleOptionChange}
												closeQuestionEditModal={closeQuestionEditModal}
												editQuestionModalOpen={editQuestionModalOpen}
												addOption={addOption}
												removeOption={removeOption}
												setCorrectAnswer={setCorrectAnswer}
												setIsDuplicateOption={setIsDuplicateOption}
												setIsMinimumOptions={setIsMinimumOptions}
											/>
											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteQuestionModal(index);
												}}
												icon={<Delete />}
											/>
											{isQuestionDeleteModalOpen[index] !== undefined && (
												<CustomDialog
													openModal={isQuestionDeleteModalOpen[index]}
													closeModal={() => closeDeleteQuestionModal(index)}
													title='Delete Question'
													content='Are you sure you want to delete this question?'>
													<CustomDialogActions
														onCancel={() => closeDeleteQuestionModal(index)}
														deleteBtn={true}
														onDelete={() => {
															deleteQuestion(question._id);
															closeDeleteQuestionModal(index);
														}}
													/>
												</CustomDialog>
											)}
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={numberOfPages} page={pageNumber} onChange={setPageNumber} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminQuestions;
