import { Box, DialogActions, Table, TableBody, TableCell, TableRow, Typography, Snackbar, Alert } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { Lesson } from '../interfaces/lessons';
import { Delete, Edit, Info } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CreateLessonDialog from '../components/forms/newLesson/CreateLessonDialog';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import theme from '../themes';

import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { dateFormatter } from '../utils/dateFormatter';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import LessonInfoModal from '../components/layouts/lessons/LessonInfoModal';
import { useAuth } from '../hooks/useAuth';
import { Roles } from '../interfaces/enums';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';

// Responsive column configuration
const getColumns = (isVerySmallScreen: boolean) => {
	return isVerySmallScreen
		? [
				{ key: 'title', label: 'Title' },
				{ key: 'type', label: 'Type' },
				{ key: 'isActive', label: 'Status' },
				{ key: 'actions', label: 'Actions' },
			]
		: [
				{ key: 'title', label: 'Title' },
				{ key: 'type', label: 'Type' },
				{ key: 'isActive', label: 'Status' },
				{ key: 'createdAt', label: 'Created On' },
				{ key: 'updatedAt', label: 'Updated On' },
				{ key: 'actions', label: 'Actions' },
			];
};

const AdminLessons = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { user } = useAuth();
	const isInstructor = user?.role === Roles.INSTRUCTOR;

	const {
		lessons,
		loading,
		error,
		fetchMoreLessons,
		removeLesson,
		totalItems,
		loadedPages,
		lessonsPageNumber,
		setLessonsPageNumber,
		enableLessonsFetch,
	} = useContext(LessonsContext);
	const { orgId } = useContext(OrganisationContext);

	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayLessons,
		numberOfPages: lessonsNumberOfPages,
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
	} = useFilterSearch<Lesson>({
		getEndpoint: () => `${base_url}/lessons/organisation/${orgId}`,
		limit: 200,
		pageSize,
		contextData: lessons,
		setContextPageNumber: setLessonsPageNumber,
		fetchMoreContextData: fetchMoreLessons,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : lessonsPageNumber;
	const sortedLessons =
		[...(displayLessons || [])]?.sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		}) || [];
	const paginatedLessons = sortedLessons?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	// Modal states - moved to top to avoid hooks after early returns
	const [isNewLessonModalOpen, setIsNewLessonModalOpen] = useState<boolean>(false);
	const [isLessonDeleteModalOpen, setIsLessonDeleteModalOpen] = useState<boolean[]>([]);
	const [isLessonInfoModalOpen, setIsLessonInfoModalOpen] = useState<boolean[]>([]);

	// Snackbar states for delete operation
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	// useEffect hooks - moved to top to avoid hooks after early returns
	useEffect(() => {
		setIsLessonDeleteModalOpen(Array(paginatedLessons.length).fill(false));
		setIsLessonInfoModalOpen(Array(paginatedLessons.length).fill(false));
	}, [displayLessons, lessonsPageNumber]);

	useEffect(() => {
		setLessonsPageNumber(1);
		enableLessonsFetch(); // 👈 Enable lessons fetching when component mounts
	}, []);

	// Early returns AFTER all hooks
	if (error) return <Typography color='error'>{error}</Typography>;

	// Show loading state while lessons are being fetched or when data is empty and not loading yet
	if (loading) {
		return (
			<DashboardPagesLayout pageName={isInstructor ? 'My Lessons' : 'Lessons'} customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={5} />
			</DashboardPagesLayout>
		);
	}

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
			const response = await axios.delete(`${base_url}/lessons/${lessonId}`);

			// Only remove from frontend state if the backend request was successful
			if (response.data.status === 200) {
				removeLesson(lessonId);

				// Show success message
				setSnackbarMessage('Lesson deleted successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			} else {
				console.error('Delete lesson failed:', response.data.message);
				setSnackbarMessage(response.data.message || 'Failed to delete lesson');
				setSnackbarSeverity('error');
				setSnackbarOpen(true);
			}
		} catch (error: any) {
			console.error('Delete lesson error:', error);
			// Don't remove from frontend state if the request failed
			setSnackbarMessage(error.response?.data?.message || 'Failed to delete lesson');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const openLessonInfoModal = (index: number) => {
		const updatedState = [...isLessonInfoModalOpen];
		updatedState[index] = true;
		setIsLessonInfoModalOpen(updatedState);
	};

	const closeLessonInfoModal = (index: number) => {
		const updatedState = [...isLessonInfoModalOpen];
		updatedState[index] = false;
		setIsLessonInfoModalOpen(updatedState);
	};

	return (
		<AdminPageErrorBoundary pageName={isInstructor ? 'My Lessons' : 'Lessons'}>
			<DashboardPagesLayout pageName={isInstructor ? 'My Lessons' : 'Lessons'} customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<FilterSearchRow
					filterValue={filterValue}
					onFilterChange={handleFilterChange}
					filterOptions={[
						{ value: '', label: 'All Lessons' },
						{ value: 'published lessons', label: 'Published Lessons' },
						{ value: 'unpublished lessons', label: 'Unpublished Lessons' },
						{ value: 'instructional lessons', label: 'Instructional Lessons' },
						{ value: 'practice lessons', label: 'Practice Lessons' },
						{ value: 'quizzes', label: 'Quizzes' },
					]}
					filterPlaceholder='Filter Lessons'
					searchValue={searchValue}
					onSearchChange={setSearchValue}
					onSearch={handleSearch}
					onReset={resetAll}
					searchPlaceholder='Search in Title and Instructions'
					isSearchLoading={isSearchLoading}
					isSearchActive={isSearchActive}
					searchResultsTotalItems={searchResultsTotalItems}
					totalItems={totalItems}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					actionButtons={[
						{
							label: isVerySmallScreen ? 'New' : 'New Lesson',
							onClick: () => setIsNewLessonModalOpen(true),
						},
					]}
					isSticky={true}
				/>
				<CreateLessonDialog isNewLessonModalOpen={isNewLessonModalOpen} createNewLesson={true} setIsNewLessonModalOpen={setIsNewLessonModalOpen} />

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
						{(isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim() && <Box sx={{ height: '1.5rem' }}></Box>)}
						<CustomTableHead<Lesson>
							orderBy={orderBy as keyof Lesson}
							order={order}
							handleSort={handleSort}
							columns={getColumns(isVerySmallScreen)}
						/>
						<TableBody>
							{paginatedLessons &&
								paginatedLessons?.map((lesson: Lesson, index) => {
									return (
										<TableRow key={lesson._id} hover>
											<CustomTableCell value={lesson.title} />
											<CustomTableCell value={lesson.type} />
											<CustomTableCell value={lesson.isActive ? 'Published' : 'Unpublished'} />
											{!isVerySmallScreen && <CustomTableCell value={dateFormatter(lesson.createdAt)} />}
											{!isVerySmallScreen && <CustomTableCell value={dateFormatter(lesson.updatedAt)} />}

											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<CustomActionBtn
													title='Edit'
													onClick={() => {
														if (isInstructor) {
															navigate(`/instructor/lesson-edit/lesson/${lesson._id}`);
														} else {
															navigate(`/admin/lesson-edit/lesson/${lesson._id}`);
														}
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
												<CustomActionBtn
													title='More Info'
													onClick={() => {
														openLessonInfoModal(index);
													}}
													icon={<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
												{isLessonDeleteModalOpen[index] !== undefined && !lesson.isActive && (
													<CustomDialog
														openModal={isLessonDeleteModalOpen[index]}
														closeModal={() => closeDeleteLessonModal(index)}
														title='Delete Lesson'
														content={`Are you sure you want to delete "${lesson.title}"?`}
														maxWidth='xs'>
														<CustomDialogActions
															onCancel={() => closeDeleteLessonModal(index)}
															deleteBtn={true}
															onDelete={() => {
																deleteLesson(lesson._id);
																closeDeleteLessonModal(index);
															}}
															actionSx={{ mb: '0.5rem' }}
														/>
													</CustomDialog>
												)}

												{isLessonDeleteModalOpen[index] !== undefined && lesson.isActive && (
													<CustomDialog
														openModal={isLessonDeleteModalOpen[index]}
														closeModal={() => closeDeleteLessonModal(index)}
														title='Unpublish Lesson'
														content='You cannot delete published lesson. Please unpublish it first.'
														maxWidth='xs'>
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
					{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
					<CustomTablePagination count={lessonsNumberOfPages} page={currentPage} onChange={handlePageChange} />
				</Box>

				{isLessonInfoModalOpen?.map(
					(isOpen, index) =>
						isOpen && (
							<CustomDialog
								key={index}
								openModal={isOpen}
								closeModal={() => closeLessonInfoModal(index)}
								title={paginatedLessons[index].title}
								maxWidth='sm'>
								<LessonInfoModal lesson={paginatedLessons[index]} onClose={() => closeLessonInfoModal(index)} />
							</CustomDialog>
						)
				)}

				{/* Delete operation snackbar */}
				<Snackbar
					open={snackbarOpen}
					autoHideDuration={5000}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminLessons;
