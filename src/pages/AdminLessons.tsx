import {
	Box,
	Dialog,
	DialogActions,
	DialogContent,
	IconButton,
	Pagination,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TableSortLabel,
	Tooltip,
	Typography,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/Dashboard Layout/DashboardPagesLayout';
import CustomCancelButton from '../components/forms/Custom Buttons/CustomCancelButton';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import { Lesson } from '../interfaces/lessons';
import theme from '../themes';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import CustomDeleteButton from '../components/forms/Custom Buttons/CustomDeleteButton';
import { useNavigate, useParams } from 'react-router-dom';
import CreateLessonDialog from '../components/layouts/New Lesson/CreateLessonDialog';
import CustomSubmitButton from '../components/forms/Custom Buttons/CustomSubmitButton';

const AdminLessons = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId } = useParams();
	const navigate = useNavigate();

	const { sortData, sortedData, removeLesson, numberOfPages, pageNumber, setPageNumber } = useContext(LessonsContext);

	const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);

	const [orderBy, setOrderBy] = useState<keyof Lesson>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof Lesson) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortData(property, isAsc ? 'desc' : 'asc');
	};

	const [isLessonDeleteModalOpen, setIsLessonDeleteModalOpen] = useState<boolean[]>([]);

	useEffect(() => {
		setIsLessonDeleteModalOpen(Array(sortedData.length).fill(false));
	}, [sortedData, pageNumber]);

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
		} catch (error) {
			console.log(error);
		}
	};
	return (
		<DashboardPagesLayout pageName='Lessons' customSettings={{ justifyContent: 'flex-start' }}>
			<CreateLessonDialog
				isNewLessonModalOpen={isNewLessonModalOpen}
				createNewLesson={true}
				setIsNewLessonModalOpen={setIsNewLessonModalOpen}
				containerStyle={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'flex-end',
					padding: '2rem',
					width: '100%',
				}}
				triggerButton={
					<CustomSubmitButton
						onClick={() => {
							setIsNewLessonModalOpen(true);
						}}>
						New Lesson
					</CustomSubmitButton>
				}
			/>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '2rem',
					mt: '1rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }}>
					<TableHead>
						<TableRow>
							<TableCell>
								<TableSortLabel active={orderBy === 'title'} direction={orderBy === 'title' ? order : 'asc'} onClick={() => handleSort('title')}>
									<Typography variant='h5'>Title</Typography>
								</TableSortLabel>
							</TableCell>
							<TableCell>
								<TableSortLabel active={orderBy === 'type'} direction={orderBy === 'type' ? order : 'asc'} onClick={() => handleSort('type')}>
									<Typography variant='h5'>Type</Typography>
								</TableSortLabel>
							</TableCell>
							<TableCell>
								<TableSortLabel
									active={orderBy === 'isActive'}
									direction={orderBy === 'isActive' ? order : 'asc'}
									onClick={() => handleSort('isActive')}>
									<Typography variant='h5'>Status</Typography>
								</TableSortLabel>
							</TableCell>
							<TableCell
								sx={{
									textAlign: 'center',
								}}>
								<TableSortLabel>
									<Typography
										variant='h5'
										sx={{
											textAlign: 'center',
										}}>
										Action
									</Typography>
								</TableSortLabel>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{sortedData &&
							sortedData.map((lesson: Lesson, index) => {
								return (
									<TableRow key={lesson._id}>
										<TableCell>
											<Typography variant='body2'>{lesson.title}</Typography>
										</TableCell>
										<TableCell>
											<Typography variant='body2'>{lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}</Typography>
										</TableCell>
										<TableCell>
											<Typography variant='body2'>{lesson.isActive ? 'Published' : 'Unpublished'}</Typography>
										</TableCell>

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<Tooltip title='Clone' placement='top'>
												<IconButton sx={{ color: theme.textColor?.secondary.main }}>
													<FileCopy />
												</IconButton>
											</Tooltip>
											<Tooltip title='Edit' placement='top'>
												<IconButton
													sx={{ color: theme.textColor?.secondary.main }}
													onClick={() => {
														navigate(`/admin/lesson-edit/user/${userId}/lesson/${lesson._id}`);
													}}>
													<Edit />
												</IconButton>
											</Tooltip>
											<Tooltip title='Delete' placement='top'>
												<IconButton
													sx={{ color: theme.textColor?.secondary.main }}
													onClick={() => {
														openDeleteLessonModal(index);
													}}>
													<Delete />
												</IconButton>
											</Tooltip>
											{isLessonDeleteModalOpen[index] !== undefined && (
												<Dialog open={isLessonDeleteModalOpen[index]} onClose={() => closeDeleteLessonModal(index)} fullWidth maxWidth='md'>
													<DialogContent>
														<Typography>Are you sure you want to delete this lesson?</Typography>
													</DialogContent>

													<DialogActions>
														<CustomCancelButton
															onClick={() => closeDeleteLessonModal(index)}
															sx={{
																margin: '0 0.5rem 1rem 0',
															}}>
															Cancel
														</CustomCancelButton>
														<CustomDeleteButton
															sx={{
																margin: '0 0.5rem 1rem 0',
															}}
															onClick={() => {
																deleteLesson(lesson._id);
																closeDeleteLessonModal(index);
															}}>
															Delete
														</CustomDeleteButton>
													</DialogActions>
												</Dialog>
											)}
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<Stack spacing={3}>
					<Pagination
						showFirstButton
						showLastButton
						count={numberOfPages}
						page={pageNumber}
						onChange={(_: React.ChangeEvent<unknown>, value: number) => {
							setPageNumber(value);
						}}
					/>
				</Stack>
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminLessons;
