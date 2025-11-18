import { Box, Table, TableBody, TableRow, TableCell, Typography, Snackbar, Alert, DialogActions, DialogContent } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useRef, useState } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import { Delete, Edit, FileCopy, Info, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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
import CreateCourseDialog from '../components/forms/newCourse/CreateCourseDialog';
import CloneCourseDialog from '../components/layouts/courses/CloneCourseDialog';
import { useAuth } from '../hooks/useAuth';

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
		enableCoursesFetch,
		setCoursesPageNumber,
	} = useContext(CoursesContext);
	const { orgId } = useContext(OrganisationContext);
	const { user } = useContext(UserAuthContext);
	const { hasAdminAccess, isInstructor } = useAuth();
	const baseEndpoint = isInstructor ? `/courses/organisation/${orgId}/instructor` : `/courses/organisation/${orgId}`;

	const vertical = 'top';
	const horizontal = 'center';

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const pageSize = 25;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayCourses,
		numberOfPages: coursesNumberOfPages,
		currentPage: coursesCurrentPage,
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
		limit: 100,
		pageSize,
		contextData: courses,
		setContextPageNumber: setCoursesPageNumber,
		fetchMoreContextData: fetchMoreCourses,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	// Helper function to get nested values for sorting
	const getNestedValue = (obj: any, path: string) => {
		return path.split('.').reduce((current, key) => current?.[key], obj) ?? '';
	};

	const sortedCourses = [...(displayCourses || [])]?.sort((a, b) => {
		let aValue: any;
		let bValue: any;

		// Handle special cases for sorting
		if (orderBy === 'isExternal') {
			// For Type column, sort by external status
			aValue = a?.courseManagement?.isExternal ? 'Partner' : 'Platform';
			bValue = b?.courseManagement?.isExternal ? 'Partner' : 'Platform';
		} else if (orderBy === 'instructor.name') {
			// For instructor sorting, use nested property
			aValue = getNestedValue(a, 'instructor.name') || 'N/A';
			bValue = getNestedValue(b, 'instructor.name') || 'N/A';
		} else if (orderBy.includes('.')) {
			// Handle other nested properties
			aValue = getNestedValue(a, orderBy);
			bValue = getNestedValue(b, orderBy);
		} else {
			// Handle regular properties
			aValue = (a as any)[orderBy] ?? '';
			bValue = (b as any)[orderBy] ?? '';
		}

		if (order === 'asc') {
			return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
		} else {
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}
	});
	const paginatedCourses = sortedCourses;

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

	const handleClone = async (courseId: string, index: number) => {
		setIsCloning(true);
		try {
			const response = await axios.post(`${base_url}${isInstructor ? '/courses/instructor' : '/courses'}/${courseId}/clone`, { courseId });
			closeCloneCourseModal(index);

			addNewCourse({
				_id: response.data.clonedCourse._id,
				title: response.data.clonedCourse.title,
				instructor: response.data.clonedCourse.instructor,
				clonedFromId: response.data.clonedCourse.clonedFromId,
				clonedFromTitle: response.data.clonedCourse.clonedFromTitle,
				courseManagement: response.data.clonedCourse.courseManagement,
				isActive: response.data.clonedCourse.isActive,
				createdAt: response.data.clonedCourse.createdAt,
				updatedAt: response.data.clonedCourse.updatedAt,
				createdBy: response.data.clonedCourse.createdBy,
				updatedBy: response.data.clonedCourse.updatedBy,
				createdByName: response.data.clonedCourse.createdByName,
				updatedByName: response.data.clonedCourse.updatedByName,
				createdByImageUrl: response.data.clonedCourse.createdByImageUrl,
				updatedByImageUrl: response.data.clonedCourse.updatedByImageUrl,
				createdByRole: response.data.clonedCourse.createdByRole,
				updatedByRole: response.data.clonedCourse.updatedByRole,
			} as unknown as SingleCourse);

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
				<CreateCourseDialog closeNewCourseModal={closeNewCourseModal} isCourseCreateModalOpen={isCourseCreateModalOpen} />
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
					totalItems={totalItems || courses?.length || 0}
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
						padding: isMobileSize ? '0rem 0.25rem 2rem 0.25rem' : '0rem 0rem 2rem 0rem',
						width: '100%',
					}}>
					<Table
						sx={{
							'mb': '2rem',
							'tableLayout': 'fixed',
							'width': '100%',
							'borderCollapse': 'collapse',
							'borderSpacing': 0,
							'& .MuiTableHead-root': {
								position: 'fixed',
								top:
									(isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim())
										? !isMobileSize
											? '10rem'
											: '12.5rem'
										: isMobileSize
											? '10.25rem'
											: '8rem',
								left: isMobileSize ? 0 : '10rem',
								right: 0,
								zIndex: 99,
								backgroundColor: theme.bgColor?.secondary,
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
								display: 'table',
								tableLayout: 'fixed',
								width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
							},
							'& .MuiTableHead-root .MuiTableCell-root': {
								backgroundColor: theme.bgColor?.secondary,
								padding: '1rem',
								boxSizing: 'border-box',
								margin: 0,
								verticalAlign: 'center',
							},
							'& .MuiTableHead-root .MuiTableCell-root:last-child': {
								borderRight: 'none',
							},
							'& .MuiTableBody-root .MuiTableCell-root': {
								padding: '0.75rem 1rem',
								boxSizing: 'border-box',
								margin: 0,
								verticalAlign: 'center',
							},
							'& .MuiTableBody-root .MuiTableCell-root:last-child': {
								borderRight: 'none',
							},
							// Column widths for mobile (4 columns)
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '150px' : isInstructor ? '100px' : '100px',
								width: isMobileSize ? '30%' : isInstructor ? '14%' : '10%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '200px' : isInstructor ? '200px' : '200px',
								width: isMobileSize ? '30%' : isInstructor ? '30%' : '23%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '80px' : isInstructor ? '100px' : '100px',
								width: isMobileSize ? '17%' : isInstructor ? '15%' : '15%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '100px' : isInstructor ? '100px' : '100px',
								width: isMobileSize ? '23%' : isInstructor ? '13%' : '12%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
								minWidth: isMobileSize ? '0px' : isInstructor ? '100px' : '100px',
								width: isMobileSize ? '0%' : isInstructor ? '13%' : '13%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
								minWidth: isMobileSize ? '0px' : isInstructor ? '80px' : '100px',
								width: isMobileSize ? '0%' : isInstructor ? '15%' : '12%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(7)': {
								minWidth: isMobileSize ? '0px' : isInstructor ? '0px' : '80px',
								width: isMobileSize ? '0%' : isInstructor ? '0%' : '15%',
							},
							// Column widths for body cells - exact same as header
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '150px' : isInstructor ? '100px' : '100px',
								width: isMobileSize ? '30%' : isInstructor ? '14%' : '10%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '200px' : isInstructor ? '200px' : '200px',
								width: isMobileSize ? '30%' : isInstructor ? '30%' : '23%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '80px' : isInstructor ? '100px' : '100px',
								width: isMobileSize ? '17%' : isInstructor ? '15%' : '15%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '100px' : isInstructor ? '100px' : '100px',
								width: isMobileSize ? '23%' : isInstructor ? '13%' : '12%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
								minWidth: isMobileSize ? '0px' : isInstructor ? '100px' : '100px',
								width: isMobileSize ? '0%' : isInstructor ? '13%' : '13%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(6)': {
								minWidth: isMobileSize ? '0px' : isInstructor ? '80px' : '100px',
								width: isMobileSize ? '0%' : isInstructor ? '15%' : '12%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(7)': {
								minWidth: isMobileSize ? '0px' : isInstructor ? '0px' : '80px',
								width: isMobileSize ? '0%' : isInstructor ? '0%' : '15%',
							},
						}}
						size='small'
						aria-label='a dense table'>
						<TableBody>
							{/* Spacer row to ensure header alignment */}
							<TableRow sx={{ height: 0, visibility: 'hidden' }}>
								<TableCell sx={{ width: isMobileSize ? '30%' : isInstructor ? '14%' : '10%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '30%' : isInstructor ? '30%' : '23%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '17%' : isInstructor ? '15%' : '15%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '23%' : isInstructor ? '13%' : '12%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '0%' : isInstructor ? '13%' : '13%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '0%' : isInstructor ? '15%' : '12%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '0%' : isInstructor ? '0%' : '15%', padding: 0, border: 'none' }} />
							</TableRow>
						</TableBody>
						<CustomTableHead<SingleCourse>
							orderBy={orderBy as keyof SingleCourse}
							order={order}
							handleSort={(property: keyof SingleCourse) => handleSort(property as string)}
							columns={
								isMobileSize
									? [
											{ key: 'title', label: 'Title' },
											{ key: 'isActive', label: 'Status' },
											{ key: 'startingDate', label: 'Start' },
											{ key: 'actions', label: 'Actions' },
										]
									: isInstructor
										? [
												{ key: 'isExternal', label: 'Type' },
												{ key: 'title', label: 'Title' },
												{ key: 'isActive', label: 'Status' },
												{ key: 'startingDate', label: 'Starting Date' },
												{ key: 'updatedAt', label: 'Updated On' },
												{ key: 'actions', label: 'Actions' },
											]
										: [
												{ key: 'isExternal', label: 'Type' },
												{ key: 'title', label: 'Title' },
												{ key: 'isActive', label: 'Status' },
												{ key: 'instructor.name', label: 'Instructor' },
												{ key: 'startingDate', label: 'Starting Date' },
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
											{!isMobileSize && <CustomTableCell value={course?.courseManagement?.isExternal ? 'Partner' : 'Platform'} />}
											<CustomTableCell value={course?.title} />
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
											{!isMobileSize && !isInstructor && <CustomTableCell value={course.instructor?.name || 'N/A'} />}
											<CustomTableCell value={dateFormatter(course.startingDate) || 'N/A'} />
											{!isMobileSize && <CustomTableCell value={dateFormatter(course.updatedAt)} />}

											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<CustomActionBtn
													title='Clone'
													onClick={() => openCloneCourseModal(index)}
													icon={
														<FileCopy
															fontSize='small'
															sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: isVerySmallScreen ? '0rem' : '-0.5rem' }}
														/>
													}
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
														icon={
															<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: isMobileSize ? '0rem' : '-0.5rem' }} />
														}
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
														icon={
															<Visibility
																fontSize='small'
																sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: isMobileSize ? '0rem' : '-0.5rem' }}
															/>
														}
													/>
												)}
												<CustomActionBtn
													title='Delete'
													onClick={() => {
														openDeleteCourseModal(index);
													}}
													disabled={(() => {
														// If user is admin, they can delete any course
														if (hasAdminAccess) {
															return false;
														}

														// If user is instructor, they can only delete courses where:
														// 1. They are the instructor of the course
														// 2. The course was not created by an admin
														if (isInstructor) {
															const isInstructorOfCourse = course?.instructor?.userId === user?._id;
															const wasCreatedByAdmin =
																course?.createdByRole === Roles.ADMIN ||
																course?.createdByRole === Roles.OWNER ||
																course?.createdByRole === Roles.SUPER_ADMIN;

															// Can delete if they're the instructor AND course was not created by admin
															return !(isInstructorOfCourse && !wasCreatedByAdmin);
														}

														// Default: disable for other roles
														return true;
													})()}
													icon={
														<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: isMobileSize ? '0rem' : '-0.5rem' }} />
													}
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
														maxWidth='xs'>
														<DialogContent>
															<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
																Are you sure you want to delete "{course.title}"?
															</Typography>
															<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
																This action will permanently delete the course, all learner registrations and progress
															</Typography>

															<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
																Lessons and documents in this course can be reused in other courses
															</Typography>

															<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
																This action cannot be undone.
															</Typography>
														</DialogContent>
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
													<CloneCourseDialog
														isCourseCloneModalOpen={isCourseCloneModalOpen}
														index={index}
														closeCloneCourseModal={closeCloneCourseModal}
														isCloning={isCloning}
														handleClone={handleClone}
														course={course}
													/>
												)}
												<Snackbar
													open={isCourseCloned}
													autoHideDuration={2250}
													anchorOrigin={{ vertical, horizontal }}
													sx={{ mt: '5rem' }}
													onClose={() => setIsCourseCloned(false)}>
													<Alert
														severity='success'
														variant='filled'
														sx={{
															width: isMobileSize ? '60%' : '100%',
															color: theme.textColor?.common.main,
															fontSize: isMobileSize ? '0.75rem' : undefined,
														}}>
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
															'width': isMobileSize ? '60%' : '100%',
															'backgroundColor': theme.bgColor?.greenSecondary,
															'color': theme.textColor?.common.main,
															'fontSize': isMobileSize ? '0.75rem' : undefined,
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
					{displayCourses && displayCourses.length === 0 && (
						<CustomInfoMessageAlignedLeft
							message={isSearchActive ? 'No courses found matching your search criteria.' : 'No courses found.'}
							sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
						/>
					)}
					{isMobileSize && !(displayCourses && displayCourses.length === 0) && (
						<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
					)}
					<CustomTablePagination count={coursesNumberOfPages} page={coursesCurrentPage} onChange={handlePageChange} />
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminCourses;
