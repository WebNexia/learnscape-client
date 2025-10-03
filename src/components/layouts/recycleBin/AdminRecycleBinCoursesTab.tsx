import { Box, Table, TableBody, TableRow, TableCell, Typography, DialogContent, Snackbar, Alert, IconButton } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { Restore, DeleteForever, Info } from '@mui/icons-material';

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
import { ArchivedCourse } from '../../../interfaces/course';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { useRecycleBinCourses } from '../../../contexts/RecycleBinCoursesContextProvider';
import { useFilterSearch } from '../../../hooks/useFilterSearch';
import FilterSearchRow from '../FilterSearchRow';

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
		removeFromSearchResults,
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

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Use appropriate page number for pagination
	const currentPageNumber = isSearchActive ? searchResultsPage : currentPage;

	// Apply client-side sorting when not in search mode
	const sortedCourses = [...(displayCourses || [])]?.sort((a, b) => {
		// Handle nested properties like 'instructor.name'
		const getNestedValue = (obj: any, path: string) => {
			return path.split('.').reduce((current, key) => current?.[key], obj) ?? '';
		};

		let aValue, bValue;

		// Special handling for Auto-Remove On column - sort by calculated deletion date
		if (orderBy === 'autoRemoveDate') {
			const getDeletionDate = (archivedAt: string) => {
				const archivedDate = new Date(archivedAt);
				return new Date(archivedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
			};
			aValue = getDeletionDate(a.archivedAt || '');
			bValue = getDeletionDate(b.archivedAt || '');
		} else {
			aValue = getNestedValue(a, orderBy as string);
			bValue = getNestedValue(b, orderBy as string);
		}

		if (order === 'asc') {
			return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
		} else {
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}
	});

	const paginatedCourses = sortedCourses?.slice((currentPageNumber - 1) * pageSize, currentPageNumber * pageSize) || [];

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

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				removeFromSearchResults(courseId);
			}

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

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				removeFromSearchResults(courseId);
			}

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

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				selectedItems.forEach((courseId) => removeFromSearchResults(courseId));
			}

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

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				selectedItems.forEach((courseId) => removeFromSearchResults(courseId));
			}

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
			<FilterSearchRow
				filterValue={filterValue}
				onFilterChange={handleFilterChange}
				filterOptions={[
					{ value: '', label: 'All deleted courses' },
					{ value: 'recently deleted', label: 'Recently deleted' },
					{ value: 'expired courses', label: 'Expired Courses' },
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
					...(selectedItems && selectedItems.length > 0
						? [
								{
									label: `Restore (${selectedItems.length})`,
									onClick: () => setIsBulkRestoreModalOpen(true),
								},
								{
									label: `Delete (${selectedItems.length})`,
									onClick: () => setIsBulkDeleteModalOpen(true),
								},
							]
						: []),
				]}
				isSticky={true}
				isRecycleBin={true}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isMobileSize ? '0rem 0rem 2rem 0rem' : '0rem 0rem 2rem 0rem',
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
							top: !((isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()))
								? isMobileSize
									? '13.5rem'
									: '11rem'
								: isMobileSize
									? '16rem'
									: '13.25rem',
							left: isMobileSize ? 0 : '10rem',
							right: 0,
							zIndex: 98,
							backgroundColor: theme.palette.background.paper,
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							display: 'table',
							tableLayout: 'fixed',
							width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
						},
						'& .MuiTableHead-root .MuiTableCell-root': {
							backgroundColor: theme.palette.background.paper,
							padding: isMobileSize ? '0.25rem 0.25rem' : '0.25rem 1rem',
							boxSizing: 'border-box',
							margin: 0,
							verticalAlign: 'center',
						},
						'& .MuiTableHead-root .MuiTableCell-root:last-child': {
							borderRight: 'none',
						},
						'& .MuiTableBody-root .MuiTableCell-root': {
							padding: '0.25rem 1rem',
							boxSizing: 'border-box',
							margin: 0,
							verticalAlign: 'center',
						},
						'& .MuiTableBody-root .MuiTableCell-root:last-child': {
							borderRight: 'none',
						},
						// Column widths for mobile (4 columns)
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
							minWidth: isMobileSize ? '50px' : '50px',
							width: isMobileSize ? '10%' : '5%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
							minWidth: isMobileSize ? '200px' : '300px',
							width: isMobileSize ? '45%' : '25%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
							minWidth: isMobileSize ? '120px' : '150px',
							width: isMobileSize ? '25%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
							minWidth: isMobileSize ? '80px' : '100px',
							width: isMobileSize ? '20%' : '15%',
						},
						// Desktop columns (6 columns)
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
							minWidth: isMobileSize ? '0px' : '150px',
							width: isMobileSize ? '0%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
							minWidth: isMobileSize ? '0px' : '120px',
							width: isMobileSize ? '0%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(7)': {
							minWidth: isMobileSize ? '0px' : '100px',
							width: isMobileSize ? '0%' : '10%',
						},
					}}
					size='small'
					aria-label='a dense table'>
					{/* Spacer row to ensure header alignment */}
					<TableRow sx={{ height: 0, visibility: 'hidden' }}>
						<TableCell sx={{ width: isMobileSize ? '10%' : '5%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '45%' : '25%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '25%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '20%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '10%', padding: 0, border: 'none' }} />
					</TableRow>
					<CustomTableHead<ArchivedCourse>
						orderBy={orderBy as keyof ArchivedCourse}
						order={order}
						handleSort={handleSort}
						selectAll={selectAll}
						onSelectAll={handleSelectAll}
						columns={
							isMobileSize
								? [
										{ key: 'checkbox', label: '' },
										{ key: 'title', label: 'Title' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{ key: 'actions', label: 'Actions' },
									]
								: [
										{ key: 'checkbox', label: '' },
										{ key: 'title', label: 'Title' },
										{ key: 'instructor.name', label: 'Instructor' },
										{ key: 'archivedByName', label: 'Deleted By' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{
											key: 'autoRemoveDate',
											label: 'Auto-Remove',
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
										<TableCell padding='checkbox' sx={{ textAlign: 'center' }}>
											<input type='checkbox' checked={isSelected} onChange={() => handleSelectItem(course._id)} />
										</TableCell>
										<CustomTableCell value={course.title} />
										{!isMobileSize && <CustomTableCell value={course.instructor?.name || 'N/A'} />}
										{!isMobileSize && <CustomTableCell value={course.archivedByName || 'N/A'} />}
										<CustomTableCell value={course.archivedAt ? dateFormatter(course.archivedAt) : 'N/A'} />
										{!isMobileSize && <CustomTableCell value={deletionDateStatus.label} />}
										<TableCell sx={{ textAlign: 'center' }}>
											<CustomActionBtn
												title='Restore Course'
												onClick={() => openRestoreCourseModal(index)}
												icon={
													<Restore fontSize='small' sx={{ mr: isMobileSize ? '0rem' : '-0.6rem', fontSize: isMobileSize ? '1rem' : undefined }} />
												}
											/>
											<CustomActionBtn
												title='Delete Permanently'
												onClick={() => openDeleteCourseModal(index)}
												icon={<DeleteForever fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />}
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
				{isMobileSize && <CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />}
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
						<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : undefined }}>
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
						<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : undefined }}>
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
					<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : undefined }}>
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
					<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : undefined }}>
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
					<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : undefined }}>
						Courses in the recycle bin are automatically permanently deleted after 7 days. This action cannot be undone.
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2, fontSize: isMobileSize ? '0.75rem' : undefined }}>
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
		</>
	);
};

export default AdminRecycleBinCoursesTab;
