import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import { Lesson } from '../interfaces/lessons';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CreateLessonDialog from '../components/forms/newLesson/CreateLessonDialog';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';

const AdminLessons = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId } = useParams();
	const navigate = useNavigate();

	const { sortLessonsData, sortedLessonsData, removeLesson, numberOfPages, lessonsPageNumber, setLessonsPageNumber, fetchLessons } =
		useContext(LessonsContext);

	const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);

	const [orderBy, setOrderBy] = useState<keyof Lesson>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof Lesson) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortLessonsData(property, isAsc ? 'desc' : 'asc');
	};

	const [isLessonDeleteModalOpen, setIsLessonDeleteModalOpen] = useState<boolean[]>([]);

	useEffect(() => {
		setIsLessonDeleteModalOpen(Array(sortedLessonsData.length).fill(false));
	}, [sortedLessonsData, lessonsPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchLessons(lessonsPageNumber);
		}
	}, [lessonsPageNumber]);

	useEffect(() => {
		setLessonsPageNumber(1);
	}, []);

	const openDeleteLessonModal = (index: number) => {
		const updatedState = [...isLessonDeleteModalOpen];
		updatedState[index] = true;
		setIsLessonDeleteModalOpen(updatedState);
	};
	const closeDeleteLessonModal = (index: number) => {
		const updatedState = [...isLessonDeleteModalOpen];
		updatedState[index] = false;
		setIsLessonDeleteModalOpen(updatedState);
	};

	const deleteLesson = async (lessonId: string): Promise<void> => {
		try {
			removeLesson(lessonId);
			await axios.delete(`${base_url}/lessons/${lessonId}`);
			fetchLessons(lessonsPageNumber);
		} catch (error) {
			console.log(error);
		}
	};
	return (
		<DashboardPagesLayout pageName='Lessons' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '2rem', width: '100%' }}>
				<CustomSubmitButton onClick={() => setIsNewLessonModalOpen(true)}>New Lesson</CustomSubmitButton>
			</Box>
			<CreateLessonDialog isNewLessonModalOpen={isNewLessonModalOpen} createNewLesson={true} setIsNewLessonModalOpen={setIsNewLessonModalOpen} />

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '1rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<Lesson>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'title', label: 'Title' },
							{ key: 'type', label: 'Type' },
							{ key: 'isActive', label: 'Status' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{sortedLessonsData &&
							sortedLessonsData.map((lesson: Lesson, index) => {
								return (
									<TableRow key={lesson._id}>
										<CustomTableCell value={lesson.title} />
										<CustomTableCell value={lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)} />
										<CustomTableCell value={lesson.isActive ? 'Published' : 'Unpublished'} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn title='Clone' onClick={() => {}} icon={<FileCopy />} />
											<CustomActionBtn
												title='Edit'
												onClick={() => {
													navigate(`/admin/lesson-edit/user/${userId}/lesson/${lesson._id}`);
												}}
												icon={<Edit />}
											/>
											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteLessonModal(index);
												}}
												icon={<Delete />}
											/>
											{isLessonDeleteModalOpen[index] !== undefined && (
												<CustomDialog
													openModal={isLessonDeleteModalOpen[index]}
													closeModal={() => closeDeleteLessonModal(index)}
													title='Delete Lesson'
													content='Are you sure you want to delete this lesson?'>
													<CustomDialogActions
														onCancel={() => closeDeleteLessonModal(index)}
														deleteBtn={true}
														onDelete={() => {
															deleteLesson(lesson._id);
															closeDeleteLessonModal(index);
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
				<CustomTablePagination count={numberOfPages} page={lessonsPageNumber} onChange={setLessonsPageNumber} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminLessons;
