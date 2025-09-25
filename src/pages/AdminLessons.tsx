import {
	Box,
	DialogActions,
	FormControl,
	InputAdornment,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
	Chip,
	Snackbar,
	Alert,
} from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { LessonsContext } from '../contexts/LessonsContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { Lesson } from '../interfaces/lessons';
import { Delete, Edit, Info, Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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

import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { dateFormatter } from '../utils/dateFormatter';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import LessonInfoModal from '../components/lessons/LessonInfoModal';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import { useAuth } from '../hooks/useAuth';
import { Roles } from '../interfaces/enums';
import { useFilterSearch } from '../hooks/useFilterSearch';

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

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

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
		searchButtonClicked,
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
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'space-between',
						padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
						width: '100%',
						mb: '1.25rem',
					}}>
					<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
						<Box sx={{ mr: '1rem' }}>
							<FormControl>
								<Select
									size='small'
									value={filterValue}
									onChange={(e) => handleFilterChange(e.target.value)}
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
									{['Published Lessons', 'Unpublished Lessons']?.map((type) => (
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
									{['Instructional Lessons', 'Practice Lessons', 'Quizzes']?.map((type) => (
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

						<CustomTextField
							value={searchValue}
							placeholder={'Search in Title and Instructions'}
							onChange={(e) => {
								setSearchValue(e.target.value);
							}}
							sx={{ backgroundColor: '#fff', minWidth: isVerySmallScreen ? '10rem' : '17.5rem' }}
							required={false}
							InputProps={{
								onKeyDown: (e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										if (searchValue.trim() && !loading) {
											handleSearch();
										}
									}
								},
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
						<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue || isSearchLoading}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton onClick={resetAll}>Reset</CustomDeleteButton>
						<Box sx={{ ml: '1rem', display: 'flex', alignItems: 'center', height: '2rem' }}>
							{isSearchActive ? (
								<Typography
									variant='body2'
									sx={{
										color: 'text.secondary',
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',
										whiteSpace: 'nowrap',
									}}>
									{searchResultsTotalItems} {searchResultsTotalItems === 1 ? 'result' : 'results'}
								</Typography>
							) : (
								<Typography
									variant='body2'
									sx={{
										color: 'text.secondary',
										fontSize: isMobileSize ? '0.7rem' : '0.85rem',
										whiteSpace: 'nowrap',
									}}>
									{totalItems} {totalItems === 1 ? 'item' : 'items'}
								</Typography>
							)}
						</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem', alignItems: 'center' }}>
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
					{((isSearchActive && searchedValue && searchButtonClicked) || (isSearchActive && filterValue && filterValue.trim())) && (
						<Box
							sx={{
								display: 'flex',
								gap: 1,
								flexWrap: 'wrap',
								justifyContent: 'center',
								borderRadius: '4px',
								alignSelf: 'flex-start',
								marginBottom: '1rem',
								marginTop: '-1rem',
							}}>
							{isSearchActive && filterValue && filterValue.trim() && (
								<Chip
									label={`Filter: "${filterValue}"`}
									onDelete={resetFilter}
									variant='outlined'
									color='secondary'
									size='small'
									sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
								/>
							)}
							{isSearchActive && searchedValue && searchButtonClicked && (
								<Chip
									label={`Search: "${searchedValue}"`}
									onDelete={resetSearch}
									color='primary'
									variant='filled'
									size='small'
									sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
								/>
							)}
						</Box>
					)}
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<Lesson>
							orderBy={orderBy as keyof Lesson}
							order={order}
							handleSort={handleSort}
							columns={[
								{ key: 'clonedFromId', label: 'Cloned' },
								{ key: 'title', label: 'Title' },
								{ key: 'type', label: 'Type' },
								{ key: 'isActive', label: 'Status' },
								{ key: 'createdAt', label: 'Created On' },
								{ key: 'updatedAt', label: 'Updated On' },
								{ key: 'actions', label: 'Actions' },
							]}
						/>
						<TableBody>
							{paginatedLessons &&
								paginatedLessons?.map((lesson: Lesson, index) => {
									return (
										<TableRow key={lesson._id} hover>
											<TableCell sx={{ textAlign: 'center', width: '0px' }}>
												{lesson.clonedFromId && (
													<Box
														sx={{
															backgroundColor: theme.palette.info.main,
															color: 'white',
															borderRadius: '50%',
															width: '15px',
															height: '15px',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															fontSize: '0.65rem',
															margin: '0 auto',
														}}>
														C
													</Box>
												)}
											</TableCell>
											<CustomTableCell value={lesson.title} />
											<CustomTableCell value={lesson.type} />
											<CustomTableCell value={lesson.isActive ? 'Published' : 'Unpublished'} />
											<CustomTableCell value={dateFormatter(lesson.createdAt)} />
											<CustomTableCell value={dateFormatter(lesson.updatedAt)} />

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
