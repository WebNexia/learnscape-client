import { useState, useEffect, useContext } from 'react';
import { Box, Table, TableBody, TableCell, TableRow, Typography, IconButton, DialogContent, Snackbar, Alert } from '@mui/material';
import { Restore, DeleteForever, Info } from '@mui/icons-material';
import axios from '@utils/axiosInstance';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { LessonsContext } from '../../../contexts/LessonsContextProvider';
import { useRecycleBinLessons } from '../../../contexts/RecycleBinLessonsContextProvider';
import { ArchivedLesson } from '../../../interfaces/lessons';
import { useFilterSearch } from '../../../hooks/useFilterSearch';
import { dateFormatter } from '../../../utils/dateFormatter';
import FilterSearchRow from '../FilterSearchRow';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomActionBtn from '../table/CustomActionBtn';
import CustomTablePagination from '../table/CustomTablePagination';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';

const AdminRecycleBinLessonsTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { addNewLesson } = useContext(LessonsContext);
	const {
		archivedLessons,
		totalItems,
		currentPage,
		fetchArchivedLessons,
		setCurrentPage,
		setArchivedLessons,
		setTotalItems,
		loadedPages,
		setLoadedPages,
		snackbarOpen,
		snackbarMessage,
		snackbarSeverity,
		setSnackbarOpen,
		setSnackbarMessage,
		setSnackbarSeverity,
	} = useRecycleBinLessons();

	const pageSize = 50;

	// Create a wrapper function for fetchArchivedLessons to match the hook's expected signature
	const fetchMoreContextData = async (startPage: number, endPage: number) => {
		for (let page = startPage; page <= endPage; page++) {
			await fetchArchivedLessons(page);
		}
	};

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
		removeFromSearchResults,
	} = useFilterSearch<ArchivedLesson>({
		getEndpoint: () => `${base_url}/lessons/organisation/${orgId}/archived`,
		limit: 200,
		pageSize,
		contextData: archivedLessons || [],
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
	const sortedLessons = [...(displayLessons || [])]?.sort((a, b) => {
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

	const paginatedLessons = sortedLessons?.slice((currentPageNumber - 1) * pageSize, currentPageNumber * pageSize) || [];

	// Modal states
	const [restoreModalOpen, setRestoreModalOpen] = useState<boolean[]>([]);
	const [deleteModalOpen, setDeleteModalOpen] = useState<boolean[]>([]);
	const [isBulkRestoreModalOpen, setIsBulkRestoreModalOpen] = useState<boolean>(false);
	const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

	// Selection states
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [selectAll, setSelectAll] = useState<boolean>(false);

	// Load initial data when component mounts
	useEffect(() => {
		fetchArchivedLessons(1);
		setLoadedPages([1]);
	}, []);

	// Info dialog state
	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	// Keep track of previous length to avoid unnecessary resets
	useEffect(() => {
		if (displayLessons && displayLessons && displayLessons.length !== 0) {
			setRestoreModalOpen(Array(displayLessons.length).fill(false));
			setDeleteModalOpen(Array(displayLessons.length).fill(false));
		}
	}, [displayLessons]);

	useEffect(() => {
		setCurrentPage(1);
	}, []);

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		if (checked) {
			setSelectedItems(displayLessons?.map((lesson) => lesson._id) || []);
			setSelectAll(true);
		} else {
			setSelectedItems([]);
			setSelectAll(false);
		}
	};

	const handleSelectItem = (lessonId: string) => {
		setSelectedItems((prev) => {
			if (prev?.includes(lessonId)) {
				const updatedItems = prev?.filter((id) => id !== lessonId) || [];
				setSelectAll(false);
				return updatedItems;
			} else {
				const updatedItems = [...prev, lessonId];
				if (updatedItems.length === paginatedLessons.length) {
					setSelectAll(true);
				}
				return updatedItems;
			}
		});
	};

	const openRestoreModal = (index: number) => {
		const newModalState = [...restoreModalOpen];
		newModalState[index] = true;
		setRestoreModalOpen(newModalState);
	};

	const closeRestoreModal = (index: number) => {
		const newModalState = [...restoreModalOpen];
		newModalState[index] = false;
		setRestoreModalOpen(newModalState);
	};

	const openDeleteModal = (index: number) => {
		const newModalState = [...deleteModalOpen];
		newModalState[index] = true;
		setDeleteModalOpen(newModalState);
	};

	const closeDeleteModal = (index: number) => {
		const newModalState = [...deleteModalOpen];
		newModalState[index] = false;
		setDeleteModalOpen(newModalState);
	};

	const restoreLesson = async (lessonId: string) => {
		try {
			const response = await axios.patch(`${base_url}/lessons/${lessonId}/restore`);

			if (response.data.status === 200) {
				// Remove from archived lessons
				setArchivedLessons((prev) => prev?.filter((lesson) => lesson._id !== lessonId) || []);
				setTotalItems((prev) => prev - 1);

				// Clear search if currently viewing filtered data to show updated context data
				if (isSearchActive) {
					removeFromSearchResults(lessonId);
				}

				// Add to lessons context
				if (response.data.data) {
					addNewLesson(response.data.data);
				}

				setSnackbarMessage('Lesson restored successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
				setSelectedItems([]);
				setSelectAll(false);
			}
		} catch (error) {
			console.error('Restore error:', error);
			setSnackbarMessage('Failed to restore lesson');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const hardDeleteLesson = async (lessonId: string) => {
		try {
			const response = await axios.delete(`${base_url}/lessons/${lessonId}/hard`);

			if (response.data.status === 200) {
				// Remove from archived lessons
				setArchivedLessons((prev) => prev?.filter((lesson) => lesson._id !== lessonId) || []);
				setTotalItems((prev) => prev - 1);

				// Clear search if currently viewing filtered data to show updated context data
				if (isSearchActive) {
					removeFromSearchResults(lessonId);
				}

				setSnackbarMessage('Lesson permanently deleted');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
				setSelectedItems([]);
				setSelectAll(false);
			}
		} catch (error) {
			console.error('Delete error:', error);
			setSnackbarMessage('Failed to delete lesson');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	// Handle bulk operations
	const handleBulkRestore = async () => {
		try {
			await Promise.all(
				selectedItems?.map((lessonId) => {
					return (async () => {
						const response = await axios.patch(`${base_url}/lessons/${lessonId}/restore`);
						if (response.data.data) {
							addNewLesson(response.data.data);
						}
					})();
				}) || []
			);

			// Remove the lessons from the list
			setArchivedLessons((prev) => prev?.filter((lesson) => !selectedItems?.includes(lesson._id)) || []);
			setTotalItems((prev) => prev - selectedItems.length);

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				selectedItems.forEach((lessonId) => removeFromSearchResults(lessonId));
			}

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkRestoreModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} lesson(s) restored successfully`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk restore error:', error);
			setSnackbarMessage('Failed to restore lessons');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const handleBulkDelete = async () => {
		try {
			await Promise.all(selectedItems?.map((lessonId) => axios.delete(`${base_url}/lessons/${lessonId}/hard`)) || []);

			// Remove the lessons from the list
			setArchivedLessons((prev) => prev?.filter((lesson) => !selectedItems?.includes(lesson._id)) || []);
			setTotalItems((prev) => prev - selectedItems.length);

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				selectedItems.forEach((lessonId) => removeFromSearchResults(lessonId));
			}

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkDeleteModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} lesson(s) permanently deleted`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk delete error:', error);
			setSnackbarMessage('Failed to delete lessons');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

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
					{ value: '', label: 'All deleted lessons' },
					{ value: 'recently deleted', label: 'Recently deleted' },
					{ value: 'instructional lessons', label: 'Instructional Lessons' },
					{ value: 'practice lessons', label: 'Practice Lessons' },
					{ value: 'quiz lessons', label: 'Quizzes' },
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
					<CustomTableHead<ArchivedLesson>
						orderBy={orderBy as keyof ArchivedLesson}
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
										{ key: 'type', label: 'Type' },
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
						{paginatedLessons &&
							paginatedLessons?.map((lesson: ArchivedLesson, index) => {
								const deletionDateStatus = getDeletionDateStatus(lesson.archivedAt || '');
								const isSelected = selectedItems?.includes(lesson._id);

								return (
									<TableRow key={lesson._id} hover selected={isSelected}>
										<TableCell padding='checkbox' sx={{ textAlign: 'center' }}>
											<input type='checkbox' checked={isSelected} onChange={() => handleSelectItem(lesson._id)} />
										</TableCell>
										<CustomTableCell value={lesson.title || 'N/A'} />
										{!isMobileSize && <CustomTableCell value={typeof lesson.type === 'string' ? lesson.type : (lesson.type as any)?.name || 'N/A'} />}
										{!isMobileSize && <CustomTableCell value={lesson.archivedByName || 'N/A'} />}
										<CustomTableCell value={lesson.archivedAt ? dateFormatter(lesson.archivedAt) : 'N/A'} />
										{!isMobileSize && <CustomTableCell value={deletionDateStatus.label} />}
										<TableCell sx={{ textAlign: 'center' }}>
											<CustomActionBtn
												title='Restore Lesson'
												onClick={() => openRestoreModal(index)}
												icon={
													<Restore fontSize='small' sx={{ mr: isMobileSize ? '0rem' : '-0.6rem', fontSize: isMobileSize ? '1rem' : undefined }} />
												}
											/>
											<CustomActionBtn
												title='Delete Permanently'
												onClick={() => openDeleteModal(index)}
												icon={<DeleteForever fontSize='small' sx={{ fontSize: isMobileSize ? '1rem' : undefined }} />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{paginatedLessons && paginatedLessons.length === 0 && (
					<CustomInfoMessageAlignedLeft
						message={isSearchActive ? 'No deleted lessons found matching your search criteria.' : 'No deleted lessons found.'}
						sx={{ marginTop: '5rem' }}
					/>
				)}

				{isMobileSize && <CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />}
				<CustomTablePagination count={lessonsNumberOfPages} page={currentPageNumber} onChange={handlePageChange} />
			</Box>

			{/* Restore Modal */}
			{paginatedLessons?.map((lesson, index) => (
				<CustomDialog
					key={`restore-${lesson._id}`}
					openModal={restoreModalOpen[index] || false}
					closeModal={() => closeRestoreModal(index)}
					title='Restore Lesson'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : undefined }}>
							Are you sure you want to restore "{lesson.title || 'this lesson'}"?
						</Typography>
						<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2, fontSize: isMobileSize ? '0.75rem' : undefined }}>
							This lesson will become available again on all courses where it was previously used, and will be restored as unpublished.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeRestoreModal(index)}
						onSubmit={() => {
							restoreLesson(lesson._id);
							closeRestoreModal(index);
						}}
						submitBtnText='Restore'
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>
			))}

			{/* Delete Modal */}
			{paginatedLessons?.map((lesson, index) => (
				<CustomDialog
					key={`delete-${lesson._id}`}
					openModal={deleteModalOpen[index] || false}
					closeModal={() => closeDeleteModal(index)}
					title='Delete Lesson Permanently'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : undefined }}>
							Are you sure you want to permanently delete "{lesson.title || 'this lesson'}"? This action cannot be undone.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeDeleteModal(index)}
						onDelete={() => {
							hardDeleteLesson(lesson._id);
							closeDeleteModal(index);
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
				title='Restore Multiple Lessons'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : undefined }}>
						Are you sure you want to restore {selectedItems.length} selected lesson(s)?
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2, fontSize: isMobileSize ? '0.75rem' : undefined }}>
						These lessons will become available again on all courses where they were previously used, and will be restored as unpublished.
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
				title='Delete Multiple Lessons Permanently'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7, fontSize: isMobileSize ? '0.75rem' : undefined }}>
						Are you sure you want to permanently delete {selectedItems.length} selected lesson(s)? This action cannot be undone.
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
						Lessons in the recycle bin are automatically permanently deleted after 7 days. This action cannot be undone.
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2, fontSize: isMobileSize ? '0.75rem' : undefined }}>
						You can restore lessons before this date or manually delete them immediately using the "Delete Permanently" button.
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

export default AdminRecycleBinLessonsTab;
