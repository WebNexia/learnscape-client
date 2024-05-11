import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog2/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog2/CustomDialogActions';
import CustomTableHead from '../components/layouts/table2/CustomTableHead';
import CustomTableCell from '../components/layouts/table2/CustomTableCell';
import CustomTablePagination from '../components/layouts/table2/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table2/CustomActionBtn';
import { QuestionsContext } from '../contexts/QuestionsContextProvider';
import { QuestionInterface } from '../interfaces/question';

const AdminLessons = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId } = useParams();
	const navigate = useNavigate();

	const { sortQuestionsData, sortedQuestionsData, removeQuestion, numberOfPages, pageNumber, setPageNumber } = useContext(QuestionsContext);

	// const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState<boolean>(false);

	const [orderBy, setOrderBy] = useState<keyof QuestionInterface>('questionType');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof QuestionInterface) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortQuestionsData(property, isAsc ? 'desc' : 'asc');
	};

	const [isQuestionDeleteModalOpen, setIsQuestionDeleteModalOpen] = useState<boolean[]>([]);

	useEffect(() => {
		setIsQuestionDeleteModalOpen(Array(sortedQuestionsData.length).fill(false));
	}, [sortedQuestionsData, pageNumber]);

	const openQuestionLessonModal = (index: number) => {
		const updatedState = [...isQuestionDeleteModalOpen];
		updatedState[index] = true;
		setIsQuestionDeleteModalOpen(updatedState);
	};
	const closeDeleteQuestionModal = (index: number) => {
		const updatedState = [...isQuestionDeleteModalOpen];
		updatedState[index] = false;
		setIsQuestionDeleteModalOpen(updatedState);
	};

	const deleteLesson = async (lessonId: string): Promise<void> => {
		try {
			removeQuestion(lessonId);
			await axios.delete(`${base_url}/lessons/${lessonId}`);
		} catch (error) {
			console.log(error);
		}
	};
	return (
		<DashboardPagesLayout pageName='Lessons' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '2rem', width: '100%' }}>
				<CustomSubmitButton>New Question</CustomSubmitButton>
			</Box>

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
													navigate(`/admin/question-edit/user/${userId}/question/${question._id}`);
												}}
												icon={<Edit />}
											/>
											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openQuestionLessonModal(index);
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
															deleteLesson(question._id);
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

export default AdminLessons;
