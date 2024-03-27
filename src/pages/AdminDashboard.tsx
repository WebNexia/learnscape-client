import {
	Box,
	Button,
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
	TextField,
	FormControlLabel,
	Checkbox,
	DialogContent,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import theme from '../themes';
import React, { useContext, useEffect, useState } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { Course } from '../interfaces/course';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
	const { userId } = useParams();
	const navigate = useNavigate();
	const { sortedData, sortData, addNewCourse, removeCourse } = useContext(CoursesContext);
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
			console.log(response.data._id);

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
			const response = await axios.delete(`${base_url}/courses/${courseId}`);
			removeCourse(response.data._id);
		} catch (error) {
			console.log(error);
		}
	};

	const [orderBy, setOrderBy] = useState<keyof Course>('title');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof Course) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortData(property, isAsc ? 'desc' : 'asc');
	};

	return (
		<DashboardPagesLayout
			pageName='Admin Dashboard'
			customSettings={{ justifyContent: 'flex-start' }}>
			<Dialog
				open={isCourseCreateModalOpen}
				onClose={closeNewCourseModal}
				fullWidth
				maxWidth='md'>
				<DialogTitle variant='h3'>Create New Course</DialogTitle>
				<form
					onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
						e.preventDefault();
						createCourse();
						closeNewCourseModal();
					}}
					style={{ display: 'flex', flexDirection: 'column' }}>
					<TextField
						required
						name='title'
						label='Title'
						value={title}
						size='small'
						onChange={(e) => setTitle(e.target.value)}
						sx={{ margin: '1rem 2rem' }}
						InputLabelProps={{
							sx: { fontSize: '0.8rem' },
						}}
					/>
					<TextField
						multiline
						required
						name='description'
						label='Description'
						value={description}
						size='small'
						onChange={(e) => setDescription(e.target.value)}
						maxRows={4}
						sx={{ margin: '1rem 2rem' }}
						InputLabelProps={{
							sx: { fontSize: '0.8rem' },
						}}
					/>
					<Box sx={{ display: 'flex' }}>
						<TextField
							required
							name='priceCurrency'
							label='Price Currency'
							value={checked ? '' : priceCurrency}
							size='small'
							onChange={(e) => setPriceCurrency(e.target.value)}
							disabled={checked}
							sx={{ margin: '1rem 2rem' }}
							fullWidth
							InputLabelProps={{
								sx: { fontSize: '0.8rem' },
							}}
						/>
						<TextField
							required
							name='price'
							label='Price'
							value={checked ? '' : price}
							size='small'
							fullWidth
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
						<FormControlLabel
							control={
								<Checkbox
									checked={checked}
									onChange={(e) => setChecked(e.target.checked)}
								/>
							}
							label='Free Course'
						/>
					</Box>
					<DialogActions>
						<Button
							onClick={closeNewCourseModal}
							variant='contained'
							sx={{
								backgroundColor: theme.bgColor?.greenPrimary,
								margin: '0 0.5rem 1rem 0',
								':hover': {
									backgroundColor: theme.bgColor?.common,
									color: theme.textColor?.greenPrimary.main,
								},
							}}
							type='reset'>
							Cancel
						</Button>
						<Button
							type='submit'
							variant='contained'
							sx={{
								backgroundColor: theme.bgColor?.greenPrimary,
								margin: '0 0.5rem 1rem 0',
								':hover': {
									backgroundColor: theme.bgColor?.common,
									color: theme.textColor?.greenPrimary.main,
								},
							}}>
							Create
						</Button>
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
				<Button
					variant='contained'
					sx={{
						backgroundColor: theme.bgColor?.greenPrimary,
						':hover': {
							backgroundColor: theme.bgColor?.common,
							color: theme.textColor?.greenPrimary.main,
						},
					}}
					onClick={openNewCourseModal}>
					New Course
				</Button>
			</Box>
			<Box sx={{ padding: '2rem', mt: '1rem', width: '100%' }}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>
								<TableSortLabel
									active={orderBy === 'title'}
									direction={orderBy === 'title' ? order : 'asc'}
									onClick={() => handleSort('title')}>
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
								<TableSortLabel
									active={orderBy === 'price'}
									direction={orderBy === 'price' ? order : 'asc'}
									onClick={() => handleSort('price')}>
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
						{sortedData.map((course: Course, index) => {
							console.log(course.title);
							console.log(course.isActive);
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
										<Typography variant='body2'>
											{course.isActive ? 'Published' : 'Unpublished'}
										</Typography>
									</TableCell>
									<TableCell>
										<Typography variant='body2'>{startDate}</Typography>
									</TableCell>
									<TableCell>
										<Typography variant='body2'>{course.price}</Typography>
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
												navigate(
													`/admin/course-edit/user/${userId}/course/${course._id}`
												);
											}}>
											<Edit />
										</IconButton>
										<IconButton
											sx={{ color: theme.textColor?.secondary.main }}
											onClick={() => {
												openDeleteCourseModal(index);
												console.log(course._id);
											}}>
											<Delete />
										</IconButton>
										<Dialog
											open={isCourseDeleteModalOpen[index]}
											onClose={() => closeDeleteCourseModal(index)}
											fullWidth
											maxWidth='md'>
											<DialogContent>
												<Typography>
													Are you sure you want to delete this course?
												</Typography>
											</DialogContent>

											<DialogActions>
												<Button
													onClick={() => closeDeleteCourseModal(index)}
													variant='contained'
													sx={{
														backgroundColor:
															theme.bgColor?.greenPrimary,
														margin: '0 0.5rem 1rem 0',
														':hover': {
															backgroundColor: theme.bgColor?.common,
															color: theme.textColor?.greenPrimary
																.main,
														},
													}}>
													Cancel
												</Button>
												<Button
													type='submit'
													variant='contained'
													sx={{
														backgroundColor:
															theme.bgColor?.greenPrimary,
														margin: '0 0.5rem 1rem 0',
														':hover': {
															backgroundColor: theme.bgColor?.common,
															color: theme.textColor?.greenPrimary
																.main,
														},
													}}
													onClick={() => {
														deleteCourse(course._id);
														closeDeleteCourseModal(index);
													}}>
													Delete
												</Button>
											</DialogActions>
										</Dialog>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminDashboard;
