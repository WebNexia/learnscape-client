import { Box, Table, TableBody, TableRow, TableCell, FormControlLabel, Checkbox } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/Dashboard_Layout/DashboardPagesLayout';
import React, { useContext, useEffect, useState } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import { Delete, Edit, FileCopy } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import CustomTextField from '../components/forms/Custom_Fields/CustomTextField';
import CustomSubmitButton from '../components/forms/Custom_Buttons/CustomSubmitButton';
import CustomDialog from '../components/layouts/Dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/Dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/Table/CustomTableHead';
import CustomTableCell from '../components/layouts/Table/CustomTableCell';
import CustomTablePagination from '../components/layouts/Table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/Table/CustomActionBtn';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

const AdminCourses = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId } = useParams();
	const navigate = useNavigate();
	const { sortedCoursesData, sortCoursesData, addNewCourse, removeCourse, numberOfPages, pageNumber, setPageNumber } = useContext(CoursesContext);
	const { orgId } = useContext(OrganisationContext);

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
		setIsCourseDeleteModalOpen(Array(sortedCoursesData.length).fill(false));
	}, [sortedCoursesData]);

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
				orgId,
			});

			// Notify context provider to update sortedCoursesData with the new course
			addNewCourse({
				_id: response.data._id,
				title,
				description,
				price: checked ? 'Free' : price,
				priceCurrency: checked ? '' : priceCurrency,
				orgId,
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
		sortCoursesData(property, isAsc ? 'desc' : 'asc');
	};

	return (
		<DashboardPagesLayout pageName='Courses' customSettings={{ justifyContent: 'flex-start' }}>
			<CustomDialog openModal={isCourseCreateModalOpen} closeModal={closeNewCourseModal} title='Create New Course'>
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
					<CustomDialogActions onCancel={closeNewCourseModal} />
				</form>
			</CustomDialog>

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
					padding: '1rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }}>
					<CustomTableHead<SingleCourse>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'title', label: 'Title' },
							{ key: 'isActive', label: 'Status' },
							{ key: 'startingDate', label: 'Starting Date' },
							{ key: 'price', label: 'Price' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{sortedCoursesData &&
							sortedCoursesData.map((course: SingleCourse, index) => {
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
										<CustomTableCell value={course.title} />
										<CustomTableCell value={course.isActive ? 'Published' : 'Unpublished'} />
										<CustomTableCell value={startDate} />
										<CustomTableCell value={`${course.priceCurrency}${course.price}`} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn title='Clone' onClick={() => {}} icon={<FileCopy />} />
											<CustomActionBtn
												title='Edit'
												onClick={() => {
													navigate(`/admin/course-edit/user/${userId}/course/${course._id}`);
												}}
												icon={<Edit />}
											/>
											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteCourseModal(index);
												}}
												icon={<Delete />}
											/>
											{isCourseDeleteModalOpen[index] !== undefined && (
												<CustomDialog
													openModal={isCourseDeleteModalOpen[index]}
													closeModal={() => closeDeleteCourseModal(index)}
													title='Delete'
													content='Are you sure you want to delete this course?'>
													<CustomDialogActions
														onCancel={() => closeDeleteCourseModal(index)}
														deleteBtn={true}
														onDelete={() => {
															deleteCourse(course._id);
															closeDeleteCourseModal(index);
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

export default AdminCourses;
