import {
	Box,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Pagination,
	Select,
	SelectChangeEvent,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TableSortLabel,
	Typography,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/Dashboard Layout/DashboardPagesLayout';
import CustomTextField from '../components/forms/Custom Fields/CustomTextField';
import CustomSubmitButton from '../components/forms/Custom Buttons/CustomSubmitButton';
import CustomCancelButton from '../components/forms/Custom Buttons/CustomCancelButton';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import { Lesson } from '../interfaces/lessons';
import theme from '../themes';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import CustomDeleteButton from '../components/forms/Custom Buttons/CustomDeleteButton';
import { useNavigate, useParams } from 'react-router-dom';

const AdminLessons = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId } = useParams();
	const navigate = useNavigate();
	const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);
	const [title, setTitle] = useState<string>('');
	const [type, setType] = useState<string>('');

	const lessonTypes: string[] = ['Quiz', 'Instructional Lesson'];

	const { sortData, sortedData, addNewLesson, removeLesson, numberOfPages, pageNumber, setPageNumber } = useContext(LessonsContext);

	const createLesson = async () => {
		try {
			const response = await axios.post(`${base_url}/lessons`, {
				title,
				type,
			});

			addNewLesson({ _id: response.data._id, title, type });
		} catch (error) {
			console.log(error);
		}
	};

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
		<DashboardPagesLayout pageName='Admin Lessons' customSettings={{ justifyContent: 'flex-start' }}>
			<Dialog open={isNewLessonModalOpen} onClose={() => setIsNewLessonModalOpen(false)} fullWidth maxWidth='md'>
				<DialogTitle variant='h3'>Create New Lesson</DialogTitle>
				<form
					onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
						e.preventDefault();
						createLesson();
						setIsNewLessonModalOpen(false);
					}}
					style={{ display: 'flex', flexDirection: 'column' }}>
					<CustomTextField
						fullWidth={false}
						label='Title'
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						sx={{ margin: '1rem 2rem' }}
						InputLabelProps={{
							sx: { fontSize: '0.8rem' },
						}}
					/>
					<FormControl sx={{ margin: '1rem 2rem' }}>
						<InputLabel id='type' sx={{ fontSize: '0.8rem' }}>
							Type
						</InputLabel>
						<Select
							labelId='type'
							id='lesson_type'
							value={type}
							onChange={(event: SelectChangeEvent) => {
								setType(event.target.value);
							}}
							size='medium'
							label='Type'
							required>
							{lessonTypes &&
								lessonTypes.map((type) => (
									<MenuItem value={type} key={type}>
										{type}
									</MenuItem>
								))}
						</Select>
					</FormControl>

					<DialogActions>
						<CustomCancelButton
							onClick={() => setIsNewLessonModalOpen(false)}
							sx={{
								margin: '0 0.5rem 1rem 0',
							}}>
							Cancel
						</CustomCancelButton>
						<CustomSubmitButton
							sx={{
								margin: '0 0.5rem 1rem 0',
							}}>
							Create
						</CustomSubmitButton>
					</DialogActions>
				</form>
			</Dialog>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'flex-end',
					padding: '2rem',
					width: '100%',
				}}>
				<CustomSubmitButton
					onClick={() => {
						setIsNewLessonModalOpen(true);
						setTitle('');
						setType('');
					}}>
					New Lesson
				</CustomSubmitButton>
			</Box>
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
											<IconButton sx={{ color: theme.textColor?.secondary.main }}>
												<FileCopy />
											</IconButton>
											<IconButton
												sx={{ color: theme.textColor?.secondary.main }}
												onClick={() => {
													navigate(`/admin/lesson-edit/user/${userId}/lesson/${lesson._id}`);
												}}>
												<Edit />
											</IconButton>
											<IconButton
												sx={{ color: theme.textColor?.secondary.main }}
												onClick={() => {
													openDeleteLessonModal(index);
												}}>
												<Delete />
											</IconButton>
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
