import { Box, DialogActions, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import axios from '@utils/axiosInstance';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import { Lesson } from '../interfaces/lessons';
import { Delete, Edit, Search } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CreateLessonDialog from '../components/forms/newLesson/CreateLessonDialog';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import theme from '../themes';
import { LessonType } from '../interfaces/enums';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { dateFormatter } from '../utils/dateFormatter';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';

const AdminLessons = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId } = useParams();
	const navigate = useNavigate();

	const { sortLessonsData, sortedLessonsData, removeLesson, fetchLessons } = useContext(LessonsContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const [lessonsPageNumber, setLessonsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const pageSize = 50;

	const filteredLessons = sortedLessonsData.filter((lesson) => {
		if (searchValue) {
			const lowerSearch = searchValue.toLowerCase();
			return lesson?.title?.toLowerCase().includes(lowerSearch);
		}
		if (filterValue) {
			if (filterValue === 'published lessons' && lesson.isActive) return true;
			if (filterValue === 'unpublished lessons' && !lesson.isActive) return true;
			if (filterValue === 'instructional lessons' && lesson.type === LessonType.INSTRUCTIONAL_LESSON) return true;
			if (filterValue === 'practice lessons' && lesson.type === LessonType.PRACTICE_LESSON) return true;
			if (filterValue === 'quizzes' && lesson.type === LessonType.QUIZ) return true;
		}
		return !searchValue && !filterValue;
	});

	const lessonsNumberOfPages = Math.ceil(filteredLessons.length / pageSize);

	const paginatedLessons = filteredLessons.slice((lessonsPageNumber - 1) * pageSize, lessonsPageNumber * pageSize);

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
		setIsLessonDeleteModalOpen(Array(paginatedLessons.length).fill(false));
	}, [sortedLessonsData, lessonsPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchLessons();
		}
	}, []);

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
			fetchLessons();
		} catch (error) {
			console.log(error);
		}
	};
	return (
		<DashboardPagesLayout pageName='Lessons' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
					<Box sx={{ mr: '1rem' }}>
						<FormControl>
							<Select
								size='small'
								value={filterValue}
								onChange={(e) => {
									setSearchValue('');
									setFilterValue(e.target.value);
								}}
								displayEmpty
								sx={{
									backgroundColor: theme.bgColor?.common,
									width: isMobileSizeSmall ? '8rem' : '12rem',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									textTransform: 'capitalize',
								}}>
								<MenuItem
									disabled
									value='filter'
									selected
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										fontStyle: 'italic',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									Filter Lessons
								</MenuItem>
								<MenuItem
									value=''
									selected
									sx={{
										fontSize: isMobileSize ? '0.65rem' : '0.85rem',
										textTransform: 'capitalize',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									All Lessons
								</MenuItem>
								{['Published Lessons', 'Unpublished Lessons'].map((type) => (
									<MenuItem
										value={type.toLowerCase()}
										key={type}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{type}
									</MenuItem>
								))}
								<MenuItem
									disabled
									value='types'
									selected
									sx={{
										fontSize: isMobileSize ? '0.6rem' : '0.7rem',
										textTransform: 'inherit',
										fontWeight: 'lighter',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									----- Filter by Type -----
								</MenuItem>
								{['Instructional Lessons', 'Practice Lessons', 'Quizzes'].map((type) => (
									<MenuItem
										value={type.toLowerCase()}
										key={type}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{type}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
					<Box sx={{ alignSelf: 'flex-start', width: isVerySmallScreen ? '7rem' : isMobileSize ? '15rem' : '17.5rem' }}>
						<CustomTextField
							value={searchValue}
							placeholder={isVerySmallScreen ? 'Search in Title' : 'Search Lesson in Title'}
							onChange={(e) => {
								setSearchValue(e.target.value);
								setFilterValue('filter');
								if (e.target.value === '') {
									setFilterValue('');
								}
							}}
							sx={{ backgroundColor: '#fff' }}
							required={false}
							InputProps={{
								endAdornment: (
									<InputAdornment position='end'>
										<Search
											sx={{
												mr: '-0.5rem',
											}}
											fontSize={isMobileSize ? 'small' : 'medium'}
										/>
									</InputAdornment>
								),
							}}
						/>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						width: isVerySmallScreen ? '5%' : isMobileSize ? '20%' : '25%',
						height: isVerySmallScreen ? '1.75rem' : '2rem',
					}}>
					<CustomSubmitButton onClick={() => setIsNewLessonModalOpen(true)} sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
						{isVerySmallScreen ? 'New' : 'New Lesson'}
					</CustomSubmitButton>
				</Box>
			</Box>
			<CreateLessonDialog isNewLessonModalOpen={isNewLessonModalOpen} createNewLesson={true} setIsNewLessonModalOpen={setIsNewLessonModalOpen} />

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
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
							{ key: 'createdAt', label: 'Created At' },
							{ key: 'updatedAt', label: 'Updated At' },
							{ key: 'clonedFromId', label: 'Origin' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{paginatedLessons &&
							paginatedLessons?.map((lesson: Lesson, index) => {
								return (
									<TableRow key={lesson._id}>
										<CustomTableCell value={lesson.title} />
										<CustomTableCell value={lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)} />
										<CustomTableCell value={lesson.isActive ? 'Published' : 'Unpublished'} />
										<CustomTableCell value={dateFormatter(lesson.createdAt)} />
										<CustomTableCell value={dateFormatter(lesson.updatedAt)} />
										<CustomTableCell value={lesson.clonedFromId ? 'Clone' : 'Original'} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='Edit'
												onClick={() => {
													navigate(`/admin/lesson-edit/user/${userId}/lesson/${lesson._id}`);
												}}
												icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteLessonModal(index);
												}}
												icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
											{isLessonDeleteModalOpen[index] !== undefined && !lesson.isActive && (
												<CustomDialog
													openModal={isLessonDeleteModalOpen[index]}
													closeModal={() => closeDeleteLessonModal(index)}
													title='Delete Lesson'
													content='Are you sure you want to delete this lesson?'
													maxWidth='sm'>
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

											{isLessonDeleteModalOpen[index] !== undefined && lesson.isActive && (
												<CustomDialog
													openModal={isLessonDeleteModalOpen[index]}
													closeModal={() => closeDeleteLessonModal(index)}
													title='Unpublish Lesson'
													content='You cannot delete published lesson. Please unpublish it first.'
													maxWidth='sm'>
													<DialogActions>
														<CustomCancelButton
															onClick={() => closeDeleteLessonModal(index)}
															sx={{
																margin: '0 0.5rem 0.5rem 0',
															}}>
															Cancel
														</CustomCancelButton>
													</DialogActions>
												</CustomDialog>
											)}
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={lessonsNumberOfPages} page={lessonsPageNumber} onChange={setLessonsPageNumber} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminLessons;
