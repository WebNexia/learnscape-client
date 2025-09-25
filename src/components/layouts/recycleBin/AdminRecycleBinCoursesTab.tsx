import {
	Box,
	Table,
	TableBody,
	TableRow,
	TableCell,
	Typography,
	FormControl,
	Select,
	MenuItem,
	InputAdornment,
	DialogContent,
	Snackbar,
	Alert,
	Chip,
	IconButton,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { Restore, DeleteForever, Search, Info } from '@mui/icons-material';

import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomTablePagination from '../table/CustomTablePagination';
import CustomActionBtn from '../table/CustomActionBtn';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { dateFormatter } from '../../../utils/dateFormatter';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import axios from '@utils/axiosInstance';
import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';
import { ArchivedCourse } from '../../../interfaces/course';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { useRecycleBinCourses } from '../../../contexts/RecycleBinCoursesContextProvider';
import { useFilterSearch } from '../../../hooks/useFilterSearch';

const AdminRecycleBinCoursesTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { addNewCourse } = useContext(CoursesContext);
	const {
		archivedCourses,
		totalItems,
		currentPage,
		loadedPages,
		fetchArchivedCourses,
		setCurrentPage,
		setArchivedCourses,
		setTotalItems,
		setLoadedPages,
	} = useRecycleBinCourses();

	const pageSize = 50;

	// Create a wrapper function for fetchArchivedCourses to match the hook's expected signature
	const fetchMoreContextData = async (startPage: number, endPage: number) => {
		for (let page = startPage; page <= endPage; page++) {
			await fetchArchivedCourses(page);
		}
	};

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayCourses,
		numberOfPages: coursesNumberOfPages,
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
	} = useFilterSearch<ArchivedCourse>({
		getEndpoint: () => `${base_url}/courses/organisation/${orgId}/archived`,
		limit: 200,
		pageSize,
		contextData: archivedCourses || [],
		setContextPageNumber: setCurrentPage,
		fetchMoreContextData,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'archivedAt',
		defaultOrder: 'desc',
	});

	const vertical = 'top';
	const horizontal = 'center';

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	// Use appropriate page number for pagination
	const currentPageNumber = isSearchActive ? searchResultsPage : currentPage;
	const paginatedCourses = displayCourses?.slice((currentPageNumber - 1) * pageSize, currentPageNumber * pageSize) || [];

	// Modal states
	const [isCourseRestoreModalOpen, setIsCourseRestoreModalOpen] = useState<boolean[]>([]);
	const [isCourseDeleteModalOpen, setIsCourseDeleteModalOpen] = useState<boolean[]>([]);
	const [isBulkRestoreModalOpen, setIsBulkRestoreModalOpen] = useState<boolean>(false);
	const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

	// Selection states
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState<boolean>(false);

	// Snackbar states
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	// Info dialog state
	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	// Load initial data when component mounts
	useEffect(() => {
		fetchArchivedCourses(1);
		setLoadedPages([1]);
	}, []);

	// Keep track of previous length to avoid unnecessary resets
	useEffect(() => {
		if (paginatedCourses && paginatedCourses && paginatedCourses.length !== 0) {
			setIsCourseRestoreModalOpen(Array(paginatedCourses.length).fill(false));
			setIsCourseDeleteModalOpen(Array(paginatedCourses.length).fill(false));
		}
	}, [displayCourses, currentPageNumber]);

	useEffect(() => {
		setCurrentPage(1);
	}, []);

	const openRestoreCourseModal = (index: number) => {
		const updatedState = [...isCourseRestoreModalOpen];
		updatedState[index] = true;
		setIsCourseRestoreModalOpen(updatedState);
	};

	const closeRestoreCourseModal = (index: number) => {
		const updatedState = [...isCourseRestoreModalOpen];
		updatedState[index] = false;
		setIsCourseRestoreModalOpen(updatedState);
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

	const restoreCourse = async (courseId: string): Promise<void> => {
		try {
			const response = await axios.patch(`${base_url}/courses/${courseId}/restore`);
			addNewCourse(response.data.data);
			setSelectedItems([]);
			setSelectAll(false);

			// Remove the course from the list
			setArchivedCourses((prev) => prev?.filter((course) => course._id !== courseId) || []);
			setTotalItems((prev) => prev - 1);

			// Note: Search results will be automatically updated by the hook

			setSnackbarMessage('Course restored successfully');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Restore course error:', error);
			setSnackbarMessage('Failed to restore course');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const hardDeleteCourse = async (courseId: string): Promise<void> => {
		try {
			await axios.delete(`${base_url}/courses/${courseId}/hard`);

			// Remove the course from the list
			setArchivedCourses((prev) => prev?.filter((course) => course._id !== courseId) || []);
			setTotalItems((prev) => prev - 1);

			// Note: Search results will be automatically updated by the hook

			setSnackbarMessage('Course permanently deleted');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
			setSelectedItems([]);
			setSelectAll(false);
		} catch (error) {
			console.error('Hard delete course error:', error);
			setSnackbarMessage('Failed to delete course');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	// Handle bulk selection
	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedItems(paginatedCourses?.map((course) => course._id) || []);
			setSelectAll(true);
		} else {
			setSelectedItems([]);
			setSelectAll(false);
		}
	};

	const handleSelectItem = (courseId: string) => {
		setSelectedItems((prev) => {
			if (prev?.includes(courseId)) {
				const updatedItems = prev?.filter((id) => id !== courseId) || [];
				setSelectAll(false);
				return updatedItems;
			} else {
				const updatedItems = [...prev, courseId];
				if (updatedItems.length === paginatedCourses.length) {
					setSelectAll(true);
				}
				return updatedItems;
			}
		});
	};

	// Handle bulk operations
	const handleBulkRestore = async () => {
		try {
			await Promise.all(
				selectedItems?.map((courseId) => {
					return (async () => {
						const response = await axios.patch(`${base_url}/courses/${courseId}/restore`);
						addNewCourse(response.data.data);
					})();
				}) || []
			);

			// Remove the courses from the list
			setArchivedCourses((prev) => prev?.filter((course) => !selectedItems?.includes(course._id)) || []);
			setTotalItems((prev) => prev - selectedItems.length);

			// Note: Search results will be automatically updated by the hook

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkRestoreModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} course(s) restored successfully`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk restore error:', error);
			setSnackbarMessage('Failed to restore courses');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const handleBulkDelete = async () => {
		try {
			await Promise.all(selectedItems?.map((courseId) => axios.delete(`${base_url}/courses/${courseId}/hard`)) || []);

			// Remove the courses from the list
			setArchivedCourses((prev) => prev?.filter((course) => !selectedItems?.includes(course._id)) || []);
			setTotalItems((prev) => prev - selectedItems.length);

			// Note: Search results will be automatically updated by the hook

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkDeleteModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} course(s) permanently deleted`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk delete error:', error);
			setSnackbarMessage('Failed to delete courses');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	// Get deletion date status
	const getDeletionDateStatus = (archivedAt: string) => {
		const archivedDate = new Date(archivedAt);
		const deletionDate = new Date(archivedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
		const now = new Date();
		const daysUntilDeletion = Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

		if (daysUntilDeletion <= 0) {
			return { label: `${dateFormatter(deletionDate)}`, color: 'error' as const };
		} else if (daysUntilDeletion <= 1) {
			return { label: `${dateFormatter(deletionDate)}`, color: 'warning' as const };
		} else if (daysUntilDeletion <= 3) {
			return { label: `${dateFormatter(deletionDate)}`, color: 'warning' as const };
		} else {
			return { label: `${dateFormatter(deletionDate)}`, color: 'default' as const };
		}
	};

	return (
		<>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
					<Box>
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
									mr: '1rem',
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
									Filter Courses
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
									All deleted courses
								</MenuItem>
								{[
									'Recently deleted',
									'Expired Courses',
									'Paid Courses',
									'Free Courses',
									'Unpriced Courses',
									'Open Courses',
									'Closed Courses',
									'External Courses',
									'Platform Courses',
								]?.map((type) => (
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
						placeholder={'Search in Title and Description'}
						onChange={(e) => {
							setSearchValue(e.target.value);
						}}
						sx={{ backgroundColor: '#fff', minWidth: isVerySmallScreen ? '10rem' : '17.5rem' }}
						required={false}
						InputProps={{
							onKeyDown: (e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									if (searchValue.trim() && !isSearchLoading) {
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
					<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue || !searchValue.trim() || isSearchLoading}>
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
					{selectedItems && selectedItems.length > 0 && (
						<>
							<CustomSubmitButton onClick={() => setIsBulkRestoreModalOpen(true)} sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
								Restore ({selectedItems.length})
							</CustomSubmitButton>
							<CustomDeleteButton onClick={() => setIsBulkDeleteModalOpen(true)} sx={{ fontSize: isMobileSize ? '0.7rem' : undefined }}>
								Delete ({selectedItems.length})
							</CustomDeleteButton>
						</>
					)}
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				{((isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim())) && (
					<Box
						sx={{
							mb: '1rem',
							display: 'flex',
							gap: 1,
							flexWrap: 'wrap',
							justifyContent: 'center',
							borderRadius: '4px',
							alignSelf: 'flex-start',
							marginBottom: '1rem',
						}}>
						{filterValue && filterValue.trim() && (
							<Chip
								label={`Filter: ${filterValue}`}
								onDelete={resetFilter}
								color='secondary'
								variant='outlined'
								size='small'
								sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
						{searchedValue && searchButtonClicked && (
							<Chip
								label={`Search: "${searchedValue}"`}
								onDelete={resetSearch}
								variant='outlined'
								color='secondary'
								size='small'
								sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
					</Box>
				)}

				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<ArchivedCourse>
						orderBy={orderBy as keyof ArchivedCourse}
						order={order}
						handleSort={handleSort}
						selectAll={selectAll}
						onSelectAll={handleSelectAll}
						columns={
							isVerySmallScreen
								? [
										{ key: 'checkbox', label: '' },
										{ key: 'title', label: 'Title' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{ key: 'actions', label: 'Actions' },
									]
								: [
										{ key: 'checkbox', label: '' },
										{ key: 'title', label: 'Title' },
										{ key: 'instructor', label: 'Instructor' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{ key: 'archivedByName', label: 'Deleted By' },
										{
											key: 'expiresIn',
											label: 'Auto-Remove On',
											infoIcon: (
												<IconButton
													size='small'
													onClick={(e) => {
														e.stopPropagation();
														setIsInfoDialogOpen(true);
													}}
													sx={{ 'p': 0.5, 'ml': 0.5, '&:hover': { backgroundColor: 'transparent' } }}>
													<Info
														sx={{
															fontSize: '1rem',
															color: 'text.secondary',
														}}
													/>
												</IconButton>
											),
										},
										{ key: 'actions', label: 'Actions' },
									]
						}
					/>
					<TableBody>
						{paginatedCourses &&
							paginatedCourses?.map((course: ArchivedCourse, index) => {
								const deletionDateStatus = getDeletionDateStatus(course.archivedAt || '');
								const isSelected = selectedItems?.includes(course._id);

								return (
									<TableRow key={course._id} hover selected={isSelected}>
										<TableCell padding='checkbox'>
											<input type='checkbox' checked={isSelected} onChange={() => handleSelectItem(course._id)} />
										</TableCell>
										<CustomTableCell value={course.title} />
										{!isVerySmallScreen && <CustomTableCell value={course.instructor?.name || 'N/A'} />}
										<CustomTableCell value={course.archivedAt ? dateFormatter(course.archivedAt) : 'N/A'} />
										{!isVerySmallScreen && <CustomTableCell value={course.archivedByName || 'N/A'} />}
										{!isVerySmallScreen && <CustomTableCell value={deletionDateStatus.label} />}
										<TableCell sx={{ textAlign: 'center' }}>
											<CustomActionBtn title='Restore Course' onClick={() => openRestoreCourseModal(index)} icon={<Restore fontSize='small' />} />
											<CustomActionBtn
												title='Delete Permanently'
												onClick={() => openDeleteCourseModal(index)}
												icon={<DeleteForever fontSize='small' />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{paginatedCourses && paginatedCourses.length === 0 && (
					<CustomInfoMessageAlignedLeft
						message={isSearchActive ? 'No deleted courses found matching your search criteria.' : 'No deleted courses found.'}
						sx={{ marginTop: '5rem' }}
					/>
				)}

				<CustomTablePagination count={coursesNumberOfPages} page={currentPageNumber} onChange={handlePageChange} />
			</Box>

			{/* Restore Course Modal */}
			{paginatedCourses?.map((course, index) => (
				<CustomDialog
					key={`restore-${course._id}`}
					openModal={isCourseRestoreModalOpen[index]}
					closeModal={() => closeRestoreCourseModal(index)}
					title='Restore Course'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
							Are you sure you want to restore "{course.title}"? This will make the course available again.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeRestoreCourseModal(index)}
						onSubmit={() => {
							restoreCourse(course._id);
							closeRestoreCourseModal(index);
						}}
						submitBtnText='Restore'
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>
			))}

			{/* Delete Course Modal */}
			{paginatedCourses?.map((course, index) => (
				<CustomDialog
					key={`delete-${course._id}`}
					openModal={isCourseDeleteModalOpen[index]}
					closeModal={() => closeDeleteCourseModal(index)}
					title='Delete Course Permanently'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
							Are you sure you want to permanently delete "{course.title}"? This action cannot be undone.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeDeleteCourseModal(index)}
						onDelete={() => {
							hardDeleteCourse(course._id);
							closeDeleteCourseModal(index);
						}}
						deleteBtn={true}
						deleteBtnText='Delete Permanently'
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>
			))}

			{/* Bulk Restore Modal */}
			<CustomDialog
				openModal={isBulkRestoreModalOpen}
				closeModal={() => setIsBulkRestoreModalOpen(false)}
				title='Restore Multiple Courses'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
						Are you sure you want to restore {selectedItems.length} selected course(s)? This will make them available again.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsBulkRestoreModalOpen(false)}
					onSubmit={handleBulkRestore}
					submitBtnText='Restore All'
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</CustomDialog>

			{/* Bulk Delete Modal */}
			<CustomDialog
				openModal={isBulkDeleteModalOpen}
				closeModal={() => setIsBulkDeleteModalOpen(false)}
				title='Delete Multiple Courses Permanently'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
						Are you sure you want to permanently delete {selectedItems.length} selected course(s)? This action cannot be undone.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsBulkDeleteModalOpen(false)}
					onDelete={handleBulkDelete}
					deleteBtn={true}
					deleteBtnText='Delete All Permanently'
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</CustomDialog>

			{/* Info Dialog */}
			<CustomDialog openModal={isInfoDialogOpen} closeModal={() => setIsInfoDialogOpen(false)} title='Auto-Removal Information' maxWidth='sm'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
						Courses in the recycle bin are automatically permanently deleted after 7 days. This action cannot be undone.
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2 }}>
						You can restore courses before this date or manually delete them immediately using the "Delete Permanently" button.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => setIsInfoDialogOpen(false)}
					onSubmit={() => setIsInfoDialogOpen(false)}
					submitBtnText='Got it'
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</CustomDialog>

			{/* Snackbar */}
			<Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical, horizontal }}>
				<Alert
					onClose={() => setSnackbarOpen(false)}
					severity={snackbarSeverity}
					sx={{
						'mt': '8.5rem',
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
		</>
	);
};

export default AdminRecycleBinCoursesTab;
