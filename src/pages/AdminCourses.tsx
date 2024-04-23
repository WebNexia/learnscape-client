import {
	Box,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	TableSortLabel,
	Typography,
	IconButton,
	Dialog,
	DialogTitle,
	DialogActions,
	FormControlLabel,
	Checkbox,
	DialogContent,
	Stack,
	Pagination,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/Dashboard Layout/DashboardPagesLayout';
import theme from '../themes';
import React, { useContext, useEffect, useState } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import CustomTextField from '../components/forms/Custom Fields/CustomTextField';
import CustomSubmitButton from '../components/forms/Custom Buttons/CustomSubmitButton';
import CustomCancelButton from '../components/forms/Custom Buttons/CustomCancelButton';
import CustomDeleteButton from '../components/forms/Custom Buttons/CustomDeleteButton';

const AdminCourses = () => {
	const { userId } = useParams();
	const navigate = useNavigate();
	const { sortedData, sortData, addNewCourse, removeCourse, numberOfPages, pageNumber, setPageNumber } = useContext(CoursesContext);
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const [isCourseCreateModalOpen, setIsCourseCreateModalOpen] = useState<boolean>(false);

	const openNewCourseModal = () => {
		setIsCourseCreateModalOpen(true);
		setTitle('');
		setDescription('');
		setPrice('');
		setPriceCurrency('');
		setChecked(false);
	};
	const closeNewCourseModal = () => setIsCourseCreateModalOpen(false);

	const [isCourseDeleteModalOpen, setIsCourseDeleteModalOpen] = useState<boolean[]>([]);

	useEffect(() => {
		setIsCourseDeleteModalOpen(Array(sortedData.length).fill(false));
	}, [sortedData]);

	const openDeleteCourseModal = (index: number) => {
		const updatedState = [...isCourseDeleteModalOpen];
		updatedState[index] = true;
		setIsCourseDeleteModalOpen(updatedState);
	};
	const closeDeleteCourseModal = (index: number) => {
		const updatedState = [...isCourseDeleteModalOpen];
		updatedState[index] = false;
		setIsCourseDeleteModalOpen(updatedState);
	};

	const [title, setTitle] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [price, setPrice] = useState<string>('');
	const [priceCurrency, setPriceCurrency] = useState<string>('');
	const [checked, setChecked] = useState<boolean>(false);

	const createCourse = async (): Promise<void> => {
		try {
			const response = await axios.post(`${base_url}/courses`, {
				title,
				description,
				price: checked ? 'Free' : price,
				priceCurrency: checked ? '' : priceCurrency,
				startingDate: '',
			});

			// Notify context provider to update sortedData with the new course
			addNewCourse({
				_id: response.data._id,
				title,
				description,
				price: checked ? 'Free' : price,
				priceCurrency: checked ? '' : priceCurrency,
			});
		} catch (error) {
			console.log(error);
		}
	};

	const deleteCourse = async (courseId: string): Promise<void> => {
		try {
			removeCourse(courseId);
			await axios.delete(`${base_url}/courses/${courseId}`);
		} catch (error) {
			console.log(error);
		}
	};

	const [orderBy, setOrderBy] = useState<keyof SingleCourse>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof SingleCourse) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortData(property, isAsc ? 'desc' : 'asc');
	};

	return (
		<DashboardPagesLayout pageName='Courses' customSettings={{ justifyContent: 'flex-start' }}>
			<Dialog open={isCourseCreateModalOpen} onClose={closeNewCourseModal} fullWidth maxWidth='md'>
				<DialogTitle variant='h3'>Create New Course</DialogTitle>
				<form
					onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
						e.preventDefault();
						createCourse();
						closeNewCourseModal();
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
					<CustomTextField
						fullWidth={false}
						label='Description'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						sx={{ margin: '1rem 2rem' }}
						InputLabelProps={{
							sx: { fontSize: '0.8rem' },
						}}
						multiline
					/>
					<Box sx={{ display: 'flex' }}>
						<CustomTextField
							label='Price Currency'
							value={checked ? '' : priceCurrency}
							onChange={(e) => setPriceCurrency(e.target.value)}
							disabled={checked}
							sx={{ margin: '1rem 2rem' }}
							InputLabelProps={{
								sx: { fontSize: '0.8rem' },
							}}
						/>
						<CustomTextField
							label='Price'
							value={checked ? '' : price}
							onChange={(e) => setPrice(e.target.value)}
							type='number'
							disabled={checked}
							sx={{ margin: '1rem 2rem 0 0 ' }}
							InputLabelProps={{
								sx: { fontSize: '0.8rem' },
							}}
						/>
					</Box>
					<Box sx={{ margin: '2rem' }}>
						<FormControlLabel control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />} label='Free Course' />
					</Box>
					<DialogActions>
						<CustomCancelButton
							onClick={closeNewCourseModal}
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
				<CustomSubmitButton onClick={openNewCourseModal}>New Course</CustomSubmitButton>
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
								<TableSortLabel
									active={orderBy === 'isActive'}
									direction={orderBy === 'isActive' ? order : 'asc'}
									onClick={() => handleSort('isActive')}>
									<Typography variant='h5'>Status</Typography>
								</TableSortLabel>
							</TableCell>
							<TableCell>
								<TableSortLabel
									active={orderBy === 'startingDate'}
									direction={orderBy === 'startingDate' ? order : 'asc'}
									onClick={() => handleSort('startingDate')}>
									<Typography variant='h5'>Starting Date</Typography>
								</TableSortLabel>
							</TableCell>
							<TableCell>
								<TableSortLabel active={orderBy === 'price'} direction={orderBy === 'price' ? order : 'asc'} onClick={() => handleSort('price')}>
									<Typography variant='h5'>Price</Typography>
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
							sortedData.map((course: SingleCourse, index) => {
								let startDate: string = '';
								const options: Intl.DateTimeFormatOptions = {
									year: 'numeric',
									month: 'short',
									day: 'numeric',
								};

								if (course.startingDate !== undefined) {
									const date: Date = new Date(course.startingDate);
									startDate = date.toLocaleString('en-US', options);
								}

								return (
									<TableRow key={course._id}>
										<TableCell>
											<Typography variant='body2'>{course.title}</Typography>
										</TableCell>
										<TableCell>
											<Typography variant='body2'>{course.isActive ? 'Published' : 'Unpublished'}</Typography>
										</TableCell>
										<TableCell>
											<Typography variant='body2'>{startDate}</Typography>
										</TableCell>
										<TableCell>
											<Typography variant='body2'>
												{course.priceCurrency}
												{course.price}
											</Typography>
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
													navigate(`/admin/course-edit/user/${userId}/course/${course._id}`);
												}}>
												<Edit />
											</IconButton>
											<IconButton
												sx={{ color: theme.textColor?.secondary.main }}
												onClick={() => {
													openDeleteCourseModal(index);
												}}>
												<Delete />
											</IconButton>
											{isCourseDeleteModalOpen[index] !== undefined && (
												<Dialog open={isCourseDeleteModalOpen[index]} onClose={() => closeDeleteCourseModal(index)} fullWidth maxWidth='md'>
													<DialogContent>
														<Typography>Are you sure you want to delete this course?</Typography>
													</DialogContent>

													<DialogActions>
														<CustomCancelButton
															onClick={() => closeDeleteCourseModal(index)}
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
																deleteCourse(course._id);
																closeDeleteCourseModal(index);
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

export default AdminCourses;
