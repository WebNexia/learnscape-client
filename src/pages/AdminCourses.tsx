import {
	Box,
	Table,
	TableBody,
	TableRow,
	TableCell,
	FormControlLabel,
	Checkbox,
	Tooltip,
	Typography,
	DialogContent,
	Snackbar,
	Alert,
	DialogActions,
} from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { Instructor, Price, SingleCourse } from '../interfaces/course';
import { Delete, Edit, FileCopy, Info, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { dateFormatter } from '../utils/dateFormatter';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import axios from '@utils/axiosInstance';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { Roles } from '../interfaces/enums';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CoursesInfoModal from '../components/layouts/courses/CoursesInfoModal';

const AdminCourses = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();

	const {
		courses,
		loading,
		error,
		fetchMoreCourses,
		addNewCourse,
		removeCourse,
		totalItems,
		loadedPages,
		coursesPageNumber,
		setCoursesPageNumber,
		enableCoursesFetch,
	} = useContext(CoursesContext);
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);

	// Role-based endpoint detection
	const isInstructor = user?.role === 'instructor';
	const baseEndpoint = isInstructor ? `/courses/instructor/${user?._id}` : `/courses/organisation/${orgId}`;

	const vertical = 'top';
	const horizontal = 'center';

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [title, setTitle] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [GBP, setGBP] = useState<Price | null>(null);
	const [USD, setUSD] = useState<Price | null>(null);
	const [EUR, setEUR] = useState<Price | null>(null);
	const [TRY, setTRY] = useState<Price | null>(null);

	const [checked, setChecked] = useState<boolean>(false);
	const [isExternal, setIsExternal] = useState<boolean>(false);

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayCourses,
		numberOfPages: coursesNumberOfPages,
		searchResultsPage,
		searchResultsTotalItems,
		searchedValue,
		orderBy,
		order,
		isSearchActive,
		isLoading: isSearchLoading,
		handleSearch,
		handleFilterChange,
		handlePageChange,
		handleSort,
		resetSearch,
		resetFilter,
		resetAll,
		removeFromSearchResults,
	} = useFilterSearch<SingleCourse>({
		getEndpoint: () => `${base_url}${baseEndpoint}`,
		limit: 200,
		pageSize,
		contextData: courses,
		setContextPageNumber: setCoursesPageNumber,
		fetchMoreContextData: fetchMoreCourses,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : coursesPageNumber;
	const sortedCourses = [...(displayCourses || [])]?.sort((a, b) => {
		const aValue = (a as any)[orderBy] ?? '';
		const bValue = (b as any)[orderBy] ?? '';

		if (order === 'asc') {
			return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
		} else {
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}
	});
	const paginatedCourses = sortedCourses?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	// Modal states - moved to top to avoid hooks after early returns
	const [isCourseCreateModalOpen, setIsCourseCreateModalOpen] = useState<boolean>(false);
	const [isCloning, setIsCloning] = useState<boolean>(false);
	const [isCourseDeleteModalOpen, setIsCourseDeleteModalOpen] = useState<boolean[]>([]);
	const [isCourseCloneModalOpen, setIsCourseCloneModalOpen] = useState<boolean[]>([]);
	const [isCourseCloned, setIsCourseCloned] = useState<boolean>(false);

	// Snackbar states for delete operation
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	const [isCourseInfoModalOpen, setIsCourseInfoModalOpen] = useState<boolean[]>([]);

	// Keep track of previous length to avoid unnecessary resets
	const prevLengthRef = useRef<number>(0);

	// useEffect hooks - moved to top to avoid hooks after early returns
	useEffect(() => {
		if (paginatedCourses && paginatedCourses.length !== prevLengthRef.current) {
			prevLengthRef.current = paginatedCourses.length;
			setIsCourseDeleteModalOpen(Array(paginatedCourses.length).fill(false));
			setIsCourseCloneModalOpen(Array(paginatedCourses.length).fill(false));
		}
	}, [displayCourses, coursesPageNumber]);

	useEffect(() => {
		setCoursesPageNumber(1);
		enableCoursesFetch();
	}, []);

	// Early returns AFTER all hooks
	if (error) return <Typography color='error'>{error}</Typography>;

	// Show loading state while courses are being fetched
	if (loading) {
		return (
			<DashboardPagesLayout pageName='Courses' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={6} />
			</DashboardPagesLayout>
		);
	}

	const openNewCourseModal = () => {
		setIsCourseCreateModalOpen(true);
		setTitle('');
		setDescription('');
		setChecked(false);
		setIsExternal(false);

		setGBP({ amount: '', currency: 'gbp' });
		setUSD({ amount: '', currency: 'usd' });
		setEUR({ amount: '', currency: 'eur' });
		setTRY({ amount: '', currency: 'try' });
	};
	const closeNewCourseModal = () => setIsCourseCreateModalOpen(false);

	const openCloneCourseModal = (index: number) => {
		const updatedState = [...isCourseCloneModalOpen];
		updatedState[index] = true;
		setIsCourseCloneModalOpen(updatedState);
	};

	const closeCloneCourseModal = (index: number) => {
		const updatedState = [...isCourseCloneModalOpen];
		updatedState[index] = false;
		setIsCourseCloneModalOpen(updatedState);
	};

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

	const createCourse = async (): Promise<void> => {
		// For instructors, allow creating courses without prices
		// For admins, always include prices
		const prices: Price[] = isInstructor
			? []
			: [
					{ amount: checked ? 'Free' : GBP?.amount!, currency: 'gbp' },
					{ amount: checked ? 'Free' : USD?.amount!, currency: 'usd' },
					{ amount: checked ? 'Free' : EUR?.amount!, currency: 'eur' },
					{ amount: checked ? 'Free' : TRY?.amount!, currency: 'try' },
				];
		try {
			const response = await axios.post(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}`, {
				title: title.trim(),
				description: description.trim(),
				prices,
				startingDate: '',
				orgId,
				imageUrl: '',
				durationWeeks: null,
				durationHours: null,
				format: '',
				courseManagement: {
					isExternal: isExternal,
					externalProvider: '',
					externalUrl: '',
					externalNotes: '',
				},
				instructor: {
					name: `${(user?.firstName ?? '').charAt(0).toUpperCase()}${(user?.firstName ?? '').slice(1)} ${(user?.lastName ?? '').charAt(0).toUpperCase()}${(user?.lastName ?? '').slice(1)}`,
					userId: user?._id,
					imageUrl: user?.imageUrl,
					email: user?.email,
				},
			});

			// Notify context provider to update courses with the new course
			addNewCourse({
				_id: response.data._id,
				title: title.trim(),
				description: description.trim(),
				prices,
				orgId,
				imageUrl: '',
				durationWeeks: null,
				durationHours: null,
				format: '',
				createdAt: response.data.createdAt,
				updatedAt: response.data.updatedAt,
				courseManagement: {
					isExternal: isExternal,
					externalProvider: '',
					externalUrl: '',
					externalNotes: '',
				},
				instructor: {
					name: user?.firstName.toUpperCase() + ' ' + user?.lastName.toUpperCase(),
					userId: user?._id!,
					imageUrl: user?.imageUrl!,
					email: user?.email!,
				} as Instructor,
			} as SingleCourse);
		} catch (error) {
			console.error('Create course error:', error);
		}
	};

	const handleClone = async (courseId: string, index: number) => {
		setIsCloning(true);
		try {
			const response = await axios.post(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}/${courseId}/clone`, { courseId });
			closeCloneCourseModal(index);

			addNewCourse({
				_id: response.data.clonedCourse._id,
				title: response.data.clonedCourse.title,
				clonedFromId: response.data.clonedCourse.clonedFromId,
				clonedFromTitle: response.data.clonedCourse.clonedFromTitle,
				createdAt: response.data.clonedCourse.createdAt,
				updatedAt: response.data.clonedCourse.updatedAt,
			} as SingleCourse);

			setIsCourseCloned(true);
		} catch (error: any) {
			console.error('Clone course error:', error);

			// Show user-friendly error message
			let errorMessage = 'Failed to clone course. Please try again.';

			if (error.response?.status === 500) {
				const serverError = error.response.data?.error;
				if (serverError?.includes('title') && serverError?.includes('longer than')) {
					errorMessage = 'Course title is too long for cloning. Please contact support.';
				} else if (serverError?.includes('validation failed')) {
					errorMessage = 'Course data validation failed. Please check the course details.';
				}
			} else if (error.response?.status === 429) {
				errorMessage = 'Cloning is already in progress for this course. Please wait.';
			} else if (error.response?.status === 404) {
				errorMessage = 'Course not found. It may have been deleted.';
			} else if (error.response?.status === 403) {
				errorMessage = 'You do not have permission to clone courses.';
			}

			// Show error snackbar
			setSnackbarMessage(errorMessage);
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		} finally {
			setIsCloning(false);
		}
	};

	const deleteCourse = async (courseId: string): Promise<void> => {
		try {
			const response = await axios.delete(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}/${courseId}`);

			// Only remove from frontend state if the backend request was successful
			if (response.data.status === 200) {
				removeCourse(courseId);

				// If search is active, remove from search results; otherwise context data is already updated
				if (isSearchActive) {
					removeFromSearchResults(courseId);
				}

				// Show success message
				setSnackbarMessage('Course deleted successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			} else {
				console.error('Delete course failed:', response.data.message);
				setSnackbarMessage(response.data.message || 'Failed to delete course');
				setSnackbarSeverity('error');
				setSnackbarOpen(true);
			}
		} catch (error: any) {
			console.error('Delete course error:', error);
			// Don't remove from frontend state if the request failed
			setSnackbarMessage(error.response?.data?.message || 'Failed to delete course');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	return (
		<AdminPageErrorBoundary pageName='Courses'>
			<DashboardPagesLayout pageName={isInstructor ? 'My Courses' : 'Courses'} customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<CustomDialog openModal={isCourseCreateModalOpen} closeModal={closeNewCourseModal} title='Create New Course' maxWidth='sm'>
					<form
						onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
							e.preventDefault();
							createCourse();
							closeNewCourseModal();
						}}
						style={{ display: 'flex', flexDirection: 'column', marginTop: '-1rem' }}>
						<Tooltip title='Max 50 Characters' placement='top' arrow>
							<CustomTextField
								fullWidth={false}
								label='Title'
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								sx={{ margin: '1rem 2rem' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
								InputProps={{ inputProps: { maxLength: 50 } }}
							/>
						</Tooltip>

						<Tooltip title='Max 500 characters' placement='top' arrow>
							<CustomTextField
								fullWidth={false}
								label='Description'
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								sx={{ margin: '1rem 2rem' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
								InputProps={{ inputProps: { maxLength: 500 } }}
								multiline
								rows={5}
								resizable
							/>
						</Tooltip>

						{!isInstructor && (
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Box sx={{ margin: '1rem 2rem 1rem 2rem', flex: 2 }}>
									<Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
										<Typography variant='h6' sx={{ fontSize: '0.9rem', mb: '0.25rem' }}>
											Prices
										</Typography>
										<Tooltip title='Check to make this course free in all currencies.' placement='top' arrow>
											<FormControlLabel
												control={
													<Checkbox
														checked={checked}
														onChange={(e) => {
															setChecked(e.target.checked);
															setTRY((prevData) => ({ ...prevData!, amount: '' }));
															setEUR((prevData) => ({ ...prevData!, amount: '' }));
															setUSD((prevData) => ({ ...prevData!, amount: '' }));
															setGBP((prevData) => ({ ...prevData!, amount: '' }));
														}}
														sx={{
															'& .MuiSvgIcon-root': {
																fontSize: '1rem',
															},
														}}
													/>
												}
												label='Free Course'
												sx={{
													'mr': '0rem',
													'& .MuiFormControlLabel-label': {
														fontSize: '0.75rem',
													},
												}}
											/>
										</Tooltip>
									</Box>

									<CustomTextField
										label='GBP'
										value={checked ? '' : GBP?.amount}
										onChange={(e) => setGBP((prevData) => ({ ...prevData!, amount: e.target.value }))}
										type='number'
										disabled={checked}
										sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
										InputLabelProps={{
											sx: { fontSize: '0.8rem' },
										}}
									/>
									<CustomTextField
										label='USD'
										value={checked ? '' : USD?.amount}
										onChange={(e) => setUSD((prevData) => ({ ...prevData!, amount: e.target.value }))}
										type='number'
										disabled={checked}
										sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
										InputLabelProps={{
											sx: { fontSize: '0.8rem' },
										}}
									/>
									<CustomTextField
										label='EUR'
										value={checked ? '' : EUR?.amount}
										onChange={(e) => setEUR((prevData) => ({ ...prevData!, amount: e.target.value }))}
										type='number'
										disabled={checked}
										sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
										InputLabelProps={{
											sx: { fontSize: '0.8rem' },
										}}
									/>
									<CustomTextField
										label='TRY'
										value={checked ? '' : TRY?.amount}
										onChange={(e) => setTRY((prevData) => ({ ...prevData!, amount: e.target.value }))}
										type='number'
										disabled={checked}
										sx={{ backgroundColor: checked ? 'transparent' : '#fff' }}
										InputLabelProps={{
											sx: { fontSize: '0.8rem' },
										}}
									/>
								</Box>
							</Box>
						)}

						<Box sx={{ margin: '0 2rem', display: 'flex', alignItems: 'center' }}>
							<Tooltip title='This course will be managed outside the platform.' placement='top' arrow>
								<FormControlLabel
									control={
										<Checkbox
											checked={isExternal}
											onChange={(e) => {
												setIsExternal(e.target.checked);
											}}
											sx={{
												'& .MuiSvgIcon-root': {
													fontSize: '1.25rem',
												},
											}}
										/>
									}
									label='External Course'
									sx={{
										'& .MuiFormControlLabel-label': {
											fontSize: '0.85rem',
										},
									}}
								/>
							</Tooltip>
						</Box>

						<CustomDialogActions onCancel={closeNewCourseModal} actionSx={{ width: '95%', margin: '0.75rem auto' }} />
					</form>
				</CustomDialog>

				<FilterSearchRow
					filterValue={filterValue}
					onFilterChange={handleFilterChange}
					filterOptions={[
						{ value: '', label: 'All Courses' },
						{ value: 'published courses', label: 'Published Courses' },
						{ value: 'unpublished courses', label: 'Unpublished Courses' },
						{ value: 'paid courses', label: 'Paid Courses' },
						{ value: 'free courses', label: 'Free Courses' },
						{ value: 'unpriced courses', label: 'Unpriced Courses' },
						{ value: 'open courses', label: 'Open Courses' },
						{ value: 'closed courses', label: 'Closed Courses' },
						{ value: 'external courses', label: 'External Courses' },
						{ value: 'platform courses', label: 'Platform Courses' },
					]}
					filterPlaceholder='Filter Courses'
					searchValue={searchValue}
					onSearchChange={setSearchValue}
					onSearch={handleSearch}
					onReset={resetAll}
					searchPlaceholder='Search in Title and Description'
					isSearchLoading={isSearchLoading}
					isSearchActive={isSearchActive}
					searchResultsTotalItems={searchResultsTotalItems}
					totalItems={totalItems}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					actionButtons={[
						{
							label: 'New Course',
							onClick: openNewCourseModal,
						},
					]}
					isSticky={true}
				/>

				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 1rem 2rem 1rem',
						width: '100%',
					}}>
					<Table
						sx={{
							'mb': '2rem',
							'tableLayout': 'fixed',
							'width': '100%',
							'& .MuiTableHead-root': {
								position: 'fixed',
								top: (isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim()) ? '11rem' : '8rem',
								left: isMobileSize ? 0 : '10rem',
								right: 0,
								zIndex: 99,
								backgroundColor: theme.palette.background.paper,
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
								display: 'table',
								tableLayout: 'fixed',
								width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
							},
							'& .MuiTableHead-root .MuiTableCell-root': {
								backgroundColor: theme.palette.background.paper,
								padding: '0.25rem 1rem',
							},
						}}
						size='small'
						aria-label='a dense table'>
						{((isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim())) && <Box sx={{ height: '1.5rem' }}></Box>}
						<CustomTableHead<SingleCourse>
							orderBy={orderBy as keyof SingleCourse}
							order={order}
							handleSort={(property: keyof SingleCourse) => handleSort(property as string)}
							columns={
								isVerySmallScreen
									? [
											{ key: 'title', label: 'Title' },
											{ key: 'isActive', label: 'Status' },
											{ key: 'startingDate', label: 'Starting Date' },
											{ key: 'actions', label: 'Actions' },
										]
									: [
											{ key: 'title', label: 'Title' },
											{ key: 'isActive', label: 'Status' },
											{ key: 'startingDate', label: 'Starting Date' },
											{ key: 'durationWeeks', label: 'Weeks #' },
											{ key: 'createdAt', label: 'Created On' },
											{ key: 'updatedAt', label: 'Updated On' },
											{ key: 'actions', label: 'Actions' },
										]
							}
						/>
						<TableBody>
							{paginatedCourses &&
								paginatedCourses?.map((course: SingleCourse, index) => {
									return (
										<TableRow key={course._id} hover>
											<CustomTableCell value={course.title} />
											<CustomTableCell
												value={
													course.isActive
														? course.isExpired
															? 'Published - Closed'
															: 'Published - Open'
														: course.isExpired
															? 'Unpublished - Closed'
															: 'Unpublished - Open'
												}
											/>

											<CustomTableCell value={dateFormatter(course.startingDate) || 'N/A'} />
											{!isVerySmallScreen && <CustomTableCell value={course.durationWeeks || 'N/A'} />}
											{!isVerySmallScreen && <CustomTableCell value={dateFormatter(course.createdAt)} />}
											{!isVerySmallScreen && <CustomTableCell value={dateFormatter(course.updatedAt)} />}

											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<CustomActionBtn
													title='Clone'
													onClick={() => openCloneCourseModal(index)}
													icon={<FileCopy fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: '-0.5rem' }} />}
												/>

												{!course.isExpired ? (
													<CustomActionBtn
														title='Edit'
														onClick={() => {
															if (isInstructor) {
																navigate(`/instructor/course-edit/course/${course._id}`);
															} else {
																navigate(`/admin/course-edit/course/${course._id}`);
															}
														}}
														icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: '-0.5rem' }} />}
													/>
												) : (
													<CustomActionBtn
														title='View'
														onClick={() => {
															if (isInstructor) {
																navigate(`/instructor/course-edit/course/${course._id}`);
															} else {
																navigate(`/admin/course-edit/course/${course._id}`);
															}
														}}
														icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: '-0.5rem' }} />}
													/>
												)}
												<CustomActionBtn
													title='Delete'
													onClick={() => {
														openDeleteCourseModal(index);
													}}
													disabled={(() => {
														// If user is admin, they can delete any course
														if (user?.role === Roles.ADMIN) {
															return false;
														}

														// If user is instructor, they can only delete courses where:
														// 1. They are the instructor of the course
														// 2. The course was not created by an admin
														if (user?.role === Roles.INSTRUCTOR) {
															const isInstructorOfCourse = course?.instructor?.userId === user?._id;
															const wasCreatedByAdmin = course?.createdByRole === Roles.ADMIN;

															// Can delete if they're the instructor AND course was not created by admin
															return !(isInstructorOfCourse && !wasCreatedByAdmin);
														}

														// Default: disable for other roles
														return true;
													})()}
													icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: '-0.5rem' }} />}
												/>
												<CustomActionBtn
													title='More Info'
													onClick={() => {
														setIsCourseInfoModalOpen((prev) => {
															const newState = [...prev];
															newState[index] = true;
															return newState;
														});
													}}
													icon={<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>

												<CoursesInfoModal
													singleCourse={course}
													isCourseInfoDialogOpen={isCourseInfoModalOpen[index]}
													setIsCourseInfoDialogOpen={() =>
														setIsCourseInfoModalOpen((prev) => {
															const newState = [...prev];
															newState[index] = false;
															return newState;
														})
													}
												/>
												{isCourseDeleteModalOpen[index] !== undefined && !course.isActive && (
													<CustomDialog
														openModal={isCourseDeleteModalOpen[index]}
														closeModal={() => closeDeleteCourseModal(index)}
														title='Delete Course'
														content={`Are you sure you want to delete "${course.title}"?`}
														maxWidth='xs'>
														<CustomDialogActions
															onCancel={() => closeDeleteCourseModal(index)}
															deleteBtn={true}
															onDelete={() => {
																deleteCourse(course._id);
																closeDeleteCourseModal(index);
															}}
															actionSx={{ mb: '0.5rem' }}
														/>
													</CustomDialog>
												)}

												{isCourseDeleteModalOpen[index] !== undefined && course.isActive && (
													<CustomDialog
														openModal={isCourseDeleteModalOpen[index]}
														closeModal={() => closeDeleteCourseModal(index)}
														title='Unpublish Course'
														content='You cannot delete published course. Please unpublish it first.'
														maxWidth='xs'>
														<DialogActions>
															<CustomCancelButton
																onClick={() => closeDeleteCourseModal(index)}
																sx={{
																	margin: '0 0.5rem 0.5rem 0',
																}}>
																Cancel
															</CustomCancelButton>
														</DialogActions>
													</CustomDialog>
												)}

												{isCourseCloneModalOpen[index] !== undefined && (
													<CustomDialog
														openModal={isCourseCloneModalOpen[index]}
														closeModal={() => closeCloneCourseModal(index)}
														title='Clone Course'
														content='Are you sure you want to clone the course?'
														maxWidth='sm'>
														<DialogContent sx={{ mt: '-0.75rem' }}>
															<Typography variant='body2'>Cloning this course will:</Typography>
															<ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
																<li>
																	<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																		Create a new course with a copy of all its chapters, lessons, questions, and documents
																	</Typography>
																</li>
																<li>
																	<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																		Preserve the original course and its content without any changes
																	</Typography>
																</li>
																<li>
																	<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																		Allow you to safely edit the new course without affecting previous versions
																	</Typography>
																</li>
																<li>
																	<Typography variant='body2' sx={{ mb: '0.25rem' }}>
																		Keep the original pricing for all currencies
																	</Typography>
																</li>
																<li>
																	<Typography variant='body2'>Mark the cloned course as unpublished by default</Typography>
																</li>
															</ul>
															<Typography variant='body2' sx={{ marginTop: '1rem' }}>
																You can customize the cloned course (including pricing) before publishing it.
															</Typography>
														</DialogContent>

														<CustomDialogActions
															onCancel={() => closeCloneCourseModal(index)}
															submitBtnText={isCloning ? 'Cloning...' : 'Clone'}
															onSubmit={() => handleClone(course._id, index)}
														/>
													</CustomDialog>
												)}
												<Snackbar
													open={isCourseCloned}
													autoHideDuration={2250}
													anchorOrigin={{ vertical, horizontal }}
													sx={{ mt: '5rem' }}
													onClose={() => setIsCourseCloned(false)}>
													<Alert severity='success' variant='filled' sx={{ width: '100%', color: theme.textColor?.common.main }}>
														Course is cloned successfully!
													</Alert>
												</Snackbar>

												{/* Delete operation snackbar */}
												<Snackbar
													open={snackbarOpen}
													autoHideDuration={5000}
													anchorOrigin={{ vertical, horizontal }}
													sx={{ mt: '4rem' }}
													onClose={() => setSnackbarOpen(false)}>
													<Alert
														onClose={() => setSnackbarOpen(false)}
														severity={snackbarSeverity}
														sx={{
															'width': '100%',
															'backgroundColor': theme.bgColor?.greenSecondary,
															'color': theme.textColor?.common.main,
															'& .MuiAlert-icon': {
																color: 'white',
															},
														}}>
														{snackbarMessage}
													</Alert>
												</Snackbar>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
					<CustomTablePagination count={coursesNumberOfPages} page={currentPage} onChange={handlePageChange} />
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminCourses;
