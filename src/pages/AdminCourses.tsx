import { Box, Table, TableBody, TableRow, TableCell, Typography, DialogContent, Snackbar, Alert, DialogActions } from '@mui/material';
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
						padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 0rem 2rem 0rem',
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
											{!isVerySmallScreen && <CustomTableCell value={course?.courseManagement?.isExternal ? 'Partner' : 'Platform'} />}
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
											{!isVerySmallScreen && !isInstructor && <CustomTableCell value={course.instructor?.name || 'N/A'} />}
											<CustomTableCell value={dateFormatter(course.startingDate) || 'N/A'} />
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
