import { Box, DialogActions, Table, TableBody, TableCell, TableRow, Typography, Snackbar, Alert, DialogContent } from '@mui/material';
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
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';

const AdminLessons = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { isInstructor } = useAuth();

	// Responsive column configuration
	const getColumns = (isMobileSize: boolean) => {
		return isMobileSize
			? [
					{ key: 'type', label: 'Type' },
					{ key: 'title', label: 'Title' },
					{ key: 'isActive', label: 'Status' },
					{ key: 'actions', label: 'Actions' },
				]
			: isInstructor
				? [
						{ key: 'type', label: 'Type' },
						{ key: 'title', label: 'Title' },
						{ key: 'isActive', label: 'Status' },
						{ key: 'createdAt', label: 'Created On' },
						{ key: 'updatedAt', label: 'Updated On' },
						{ key: 'actions', label: 'Actions' },
					]
				: [
						{ key: 'type', label: 'Type' },
						{ key: 'title', label: 'Title' },
						{ key: 'isActive', label: 'Status' },
						{ key: 'createdByName', label: 'Created By' },
						{ key: 'updatedAt', label: 'Updated On' },
						{ key: 'actions', label: 'Actions' },
					];
	};

	const { lessons, loading, error, fetchMoreLessons, removeLesson, totalItems, loadedPages, enableLessonsFetch, setLessonsPageNumber } =
		useContext(LessonsContext);
	const { orgId } = useContext(OrganisationContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayLessons,
		numberOfPages: lessonsNumberOfPages,
		currentPage: lessonsCurrentPage,
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
	} = useFilterSearch<Lesson>({
		getEndpoint: () => `${base_url}/lessons/organisation/${orgId}`,
		limit: 200,
		pageSize,
		contextData: lessons,
		setContextPageNumber: setLessonsPageNumber,
		fetchMoreContextData: fetchMoreLessons,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	// Use appropriate page number for pagination
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
	const paginatedLessons = sortedLessons;

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
	}, [lessonsCurrentPage, filterValue, searchValue]);

	useEffect(() => {
		enableLessonsFetch();
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

				// If search is active, remove from search results; otherwise context data is already updated
				if (isSearchActive) {
					removeFromSearchResults(lessonId);
				}

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
					totalItems={totalItems || lessons?.length || 0}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					actionButtons={[
						{
							label: isMobileSize ? 'New' : 'New Lesson',
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
								padding: '0.75rem 1rem',
								boxSizing: 'border-box',
								margin: 0,
								verticalAlign: 'center',
							},
							'& .MuiTableHead-root .MuiTableCell-root:last-child': {
								borderRight: 'none',
							},
							'& .MuiTableBody-root .MuiTableCell-root': {
								padding: '0.5rem 1rem',
								boxSizing: 'border-box',
								margin: 0,
								verticalAlign: 'center',
							},
							'& .MuiTableBody-root .MuiTableCell-root:last-child': {
								borderRight: 'none',
							},
							// Column widths for header cells
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '80px' : '100px',
								width: isMobileSize ? '18%' : '15%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '200px' : '200px',
								width: isMobileSize ? '30%' : '33%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '80px' : '100px',
								width: isMobileSize ? '15%' : '12%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '0px' : '100px',
								width: isMobileSize ? '17%' : '15%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
								minWidth: isMobileSize ? '0px' : '100px',
								width: isMobileSize ? '0%' : '15%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
								minWidth: isMobileSize ? '0px' : '80px',
								width: isMobileSize ? '0%' : '15%',
							},
							// Column widths for body cells - exact same as header
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '80px' : '100px',
								width: isMobileSize ? '18%' : '15%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '200px' : '200px',
								width: isMobileSize ? '30%' : '33%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '80px' : '100px',
								width: isMobileSize ? '15%' : '12%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '0px' : '100px',
								width: isMobileSize ? '17%' : '15%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
								minWidth: isMobileSize ? '0px' : '100px',
								width: isMobileSize ? '0%' : '15%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(6)': {
								minWidth: isMobileSize ? '0px' : '80px',
								width: isMobileSize ? '0%' : '15%',
							},
						}}
						size='small'
						aria-label='a dense table'>
						<TableBody>
							{/* Spacer row to ensure header alignment */}
							<TableRow sx={{ height: 0, visibility: 'hidden' }}>
								<TableCell sx={{ width: isMobileSize ? '18%' : '15%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '30%' : '33%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '15%' : '12%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '17%' : '15%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
							</TableRow>
						</TableBody>
						<CustomTableHead<Lesson> orderBy={orderBy as keyof Lesson} order={order} handleSort={handleSort} columns={getColumns(isMobileSize)} />
						<TableBody>
							{paginatedLessons &&
								paginatedLessons?.map((lesson: Lesson, index) => {
									return (
										<TableRow key={lesson._id} hover>
											<CustomTableCell value={lesson.type} />
											<CustomTableCell value={lesson.title} />
											<CustomTableCell value={lesson.isActive ? 'Published' : 'Unpublished'} />
											{!isMobileSize && !isInstructor && <CustomTableCell value={lesson.createdByName || 'N/A'} />}
											{!isMobileSize && isInstructor && <CustomTableCell value={dateFormatter(lesson.createdAt)} />}
											{!isMobileSize && <CustomTableCell value={dateFormatter(lesson.updatedAt)} />}

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
														maxWidth='xs'>
														<DialogContent>
															<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
																Are you sure you want to delete "{lesson.title}"?
															</Typography>
															<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
																This action will permanently delete the lesson and all learner progress
															</Typography>

															<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
																Questions and documents in this lesson can be reused in other lessons
															</Typography>

															<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
																This action cannot be undone.
															</Typography>
														</DialogContent>
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
					{displayLessons && displayLessons.length === 0 && (
						<CustomInfoMessageAlignedLeft
							message={isSearchActive ? 'No lessons found matching your search criteria.' : 'No lessons found.'}
							sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
						/>
					)}
					{isMobileSize && !(displayLessons && displayLessons.length === 0) && (
						<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
					)}
					<CustomTablePagination count={lessonsNumberOfPages} page={lessonsCurrentPage} onChange={handlePageChange} />
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
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminLessons;
