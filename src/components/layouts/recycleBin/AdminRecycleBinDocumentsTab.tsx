import { useState, useEffect, useContext } from 'react';
import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Typography,
	IconButton,
	InputAdornment,
	MenuItem,
	FormControl,
	Select,
	Chip,
	DialogContent,
	Snackbar,
	Alert,
} from '@mui/material';
import { Search, Restore, DeleteForever, Info } from '@mui/icons-material';
import axios from '@utils/axiosInstance';
import theme from '../../../themes';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import { DocumentsContext } from '../../../contexts/DocumentsContextProvider';
import { useRecycleBinDocuments } from '../../../contexts/RecycleBinDocumentsContextProvider';
import { Document } from '../../../interfaces/document';
import { useFilterSearch } from '../../../hooks/useFilterSearch';
import { dateFormatter } from '../../../utils/dateFormatter';
import CustomTextField from '../../forms/customFields/CustomTextField';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import CustomActionBtn from '../table/CustomActionBtn';
import CustomTablePagination from '../table/CustomTablePagination';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import { truncateText } from '@utils/utilText';

interface ArchivedDocument extends Document {
	archivedAt?: string;
	archivedBy?: string;
	archivedByName?: string;
}

const AdminRecycleBinDocumentsTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId } = useContext(OrganisationContext);
	const { addNewDocument } = useContext(DocumentsContext);
	const {
		archivedDocuments,
		totalItems,
		currentPage,
		loadedPages,
		setLoadedPages,
		fetchArchivedDocuments,
		setCurrentPage,
		setArchivedDocuments,
		setTotalItems,
		snackbarOpen,
		snackbarMessage,
		snackbarSeverity,
		setSnackbarOpen,
		setSnackbarMessage,
		setSnackbarSeverity,
	} = useRecycleBinDocuments();

	const pageSize = 50;

	// Create a wrapper function for fetchArchivedDocuments to match the hook's expected signature
	const fetchMoreContextData = async (startPage: number, endPage: number) => {
		for (let page = startPage; page <= endPage; page++) {
			await fetchArchivedDocuments(page);
		}
	};

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayDocuments,
		numberOfPages: documentsNumberOfPages,
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
	} = useFilterSearch<ArchivedDocument>({
		getEndpoint: () => `${base_url}/documents/organisation/${orgId}/archived`,
		limit: 200,
		pageSize,
		contextData: archivedDocuments || [],
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

	// Apply client-side sorting when not in search mode
	const sortedDocuments = [...(displayDocuments || [])]?.sort((a, b) => {
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

	const paginatedDocuments = sortedDocuments?.slice((currentPageNumber - 1) * pageSize, currentPageNumber * pageSize) || [];

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
		fetchArchivedDocuments(1);
		setLoadedPages([1]);
	}, []);

	// Info dialog state
	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	// Keep track of previous length to avoid unnecessary resets
	useEffect(() => {
		if (displayDocuments && displayDocuments && displayDocuments.length !== 0) {
			setRestoreModalOpen(Array(displayDocuments.length).fill(false));
			setDeleteModalOpen(Array(displayDocuments.length).fill(false));
		}
	}, [displayDocuments]);

	useEffect(() => {
		setCurrentPage(1);
	}, []);

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		setSelectAll(checked);
		if (checked) {
			setSelectedItems(paginatedDocuments?.map((document) => document._id) || []);
			setSelectAll(true);
		} else {
			setSelectedItems([]);
			setSelectAll(false);
		}
	};

	const handleSelectItem = (documentId: string) => {
		setSelectedItems((prev) => {
			if (prev?.includes(documentId)) {
				const updatedItems = prev?.filter((id) => id !== documentId) || [];
				setSelectAll(false);
				return updatedItems;
			} else {
				const updatedItems = [...prev, documentId];
				if (updatedItems.length === paginatedDocuments.length) {
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

	const restoreDocument = async (documentId: string) => {
		try {
			const response = await axios.patch(`${base_url}/documents/${documentId}/restore`);

			if (response.data.status === 200) {
				// Remove from archived documents
				setArchivedDocuments((prev) => prev?.filter((document) => document._id !== documentId) || []);
				setTotalItems((prev) => prev - 1);

				// Clear search if currently viewing filtered data to show updated context data
				if (isSearchActive) {
					removeFromSearchResults(documentId);
				}

				// Add to documents context
				if (response.data.data) {
					addNewDocument(response.data.data);
					setSelectedItems([]);
					setSelectAll(false);
				}

				setSnackbarMessage('Document restored successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			}
		} catch (error) {
			console.error('Restore error:', error);
			setSnackbarMessage('Failed to restore document');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const hardDeleteDocument = async (documentId: string) => {
		try {
			const response = await axios.delete(`${base_url}/documents/${documentId}/hard`);

			if (response.data.status === 200) {
				// Remove from archived documents
				setArchivedDocuments((prev) => prev?.filter((document) => document._id !== documentId) || []);
				setTotalItems((prev) => prev - 1);

				// Clear search if currently viewing filtered data to show updated context data
				if (isSearchActive) {
					removeFromSearchResults(documentId);
				}

				setSnackbarMessage('Document permanently deleted');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
				setSelectedItems([]);
				setSelectAll(false);
			}
		} catch (error) {
			console.error('Delete error:', error);
			setSnackbarMessage('Failed to delete document');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	// Handle bulk operations
	const handleBulkRestore = async () => {
		try {
			await Promise.all(
				selectedItems?.map((documentId) => {
					return (async () => {
						const response = await axios.patch(`${base_url}/documents/${documentId}/restore`);
						if (response.data.data) {
							addNewDocument(response.data.data);
						}
					})();
				}) || []
			);

			// Remove the documents from the list
			setArchivedDocuments((prev) => prev?.filter((document) => !selectedItems?.includes(document._id)) || []);
			setTotalItems((prev) => prev - selectedItems.length);

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				selectedItems.forEach((documentId) => removeFromSearchResults(documentId));
			}

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkRestoreModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} document(s) restored successfully`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk restore error:', error);
			setSnackbarMessage('Failed to restore documents');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};

	const handleBulkDelete = async () => {
		try {
			await Promise.all(selectedItems?.map((documentId) => axios.delete(`${base_url}/documents/${documentId}/hard`)) || []);

			// Remove the documents from the list
			setArchivedDocuments((prev) => prev?.filter((document) => !selectedItems?.includes(document._id)) || []);
			setTotalItems((prev) => prev - selectedItems.length);

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				selectedItems.forEach((documentId) => removeFromSearchResults(documentId));
			}

			setSelectedItems([]);
			setSelectAll(false);
			setIsBulkDeleteModalOpen(false);

			setSnackbarMessage(`${selectedItems.length} document(s) permanently deleted`);
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
		} catch (error) {
			console.error('Bulk delete error:', error);
			setSnackbarMessage('Failed to delete documents');
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
			{/* Sticky Filter/Search Row */}
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 0rem 2rem',
					width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
					position: 'fixed',
					top: isMobileSize ? '7.5rem' : '6.5rem', // Account for header + tabs
					left: isMobileSize ? 0 : '10rem',
					right: 0,
					zIndex: 99,
					backgroundColor: theme.palette.background.paper,
					backdropFilter: 'blur(10px)',
				}}>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
					<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isMobileSize ? '12.5rem' : 'fit-content' }}>
						<Box>
							<FormControl>
								<Select
									size='small'
									value={filterValue}
									onChange={(e) => handleFilterChange(e.target.value)}
									displayEmpty
									sx={{
										backgroundColor: theme.bgColor?.common,
										width: isMobileSizeSmall ? '8rem' : '13rem',
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
										Filter Documents
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
										All deleted documents
									</MenuItem>
									{['Recently deleted', 'Paid Documents', 'Free Documents', 'On Landing Page', 'On Platform Only']?.map((type) => (
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
							placeholder={'Search in Document Name'}
							onChange={(e) => {
								setSearchValue(e.target.value);
							}}
							sx={{ backgroundColor: '#fff', minWidth: isMobileSize ? '10rem' : '17.5rem' }}
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

					{((isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim())) && (
						<Box
							sx={{
								display: 'flex',
								gap: 1,
								flexWrap: 'wrap',
								justifyContent: 'center',
								padding: '0.5rem 1rem 0.5rem 0rem',
								borderRadius: '4px',
								backgroundColor: theme.palette.background.paper,
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
					height: '3.5rem',
					width: '100%',
				}}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isMobileSize ? '0rem 0rem 2rem 0rem' : '0rem 0rem 2rem 0rem',
					width: '100%',
				}}>
				{/* Spacer for sticky table header */}
				<Box
					sx={{
						height: (isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()) ? '5.25rem' : '2.25rem',
						width: '100%',
					}}
				/>

				<Table
					sx={{
						'mb': '2rem',
						'width': '100%',
						'tableLayout': 'fixed',
						'& .MuiTableHead-root': {
							position: 'fixed',
							top: !((isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()))
								? isMobileSize
									? '11.5rem'
									: '11rem'
								: isMobileSize
									? '14rem'
									: '14rem', // Account for header + tabs + filter row
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
							padding: '0.25rem 1rem',
						},
					}}
					size='small'
					aria-label='a dense table'>
					<CustomTableHead<ArchivedDocument>
						orderBy={orderBy as keyof ArchivedDocument}
						order={order}
						handleSort={handleSort}
						selectAll={selectAll}
						onSelectAll={handleSelectAll}
						columns={
							isMobileSize
								? [
										{ key: 'checkbox', label: '' },
										{ key: 'name', label: 'Document' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{ key: 'actions', label: 'Actions' },
									]
								: [
										{ key: 'checkbox', label: '' },
										{ key: 'name', label: 'Document' },
										{ key: 'pageCount', label: 'Pages(#)' },
										{ key: 'archivedByName', label: 'Deleted By' },
										{ key: 'archivedAt', label: 'Deleted On' },
										{
											key: 'autoRemoveDate',
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
						{paginatedDocuments &&
							paginatedDocuments?.map((document: ArchivedDocument, index) => {
								const deletionDateStatus = getDeletionDateStatus(document.archivedAt || '');
								const isSelected = selectedItems?.includes(document._id);

								return (
									<TableRow key={document._id} hover selected={isSelected}>
										<TableCell padding='checkbox' sx={{ textAlign: 'center' }}>
											<input type='checkbox' checked={isSelected} onChange={() => handleSelectItem(document._id)} />
										</TableCell>
										<CustomTableCell value={truncateText(document.name, isMobileSize ? 25 : 45)} />
										{!isMobileSize && <CustomTableCell value={document.pageCount?.toString() || 'N/A'} />}
										<CustomTableCell value={document.archivedAt ? dateFormatter(document.archivedAt) : 'N/A'} />
										{!isMobileSize && <CustomTableCell value={document.archivedByName || 'N/A'} />}
										{!isMobileSize && <CustomTableCell value={deletionDateStatus.label} />}
										<TableCell sx={{ textAlign: 'center' }}>
											<CustomActionBtn title='Restore Document' onClick={() => openRestoreModal(index)} icon={<Restore fontSize='small' />} />
											<CustomActionBtn title='Delete Permanently' onClick={() => openDeleteModal(index)} icon={<DeleteForever fontSize='small' />} />
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				{paginatedDocuments && paginatedDocuments.length === 0 && (
					<CustomInfoMessageAlignedLeft
						message={isSearchActive ? 'No deleted documents found matching your search criteria.' : 'No deleted documents found.'}
						sx={{ marginTop: '5rem' }}
					/>
				)}
				{isMobileSize && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
				<CustomTablePagination count={documentsNumberOfPages} page={currentPageNumber} onChange={handlePageChange} />
			</Box>

			{/* Restore Modal */}
			{paginatedDocuments?.map((document, index) => (
				<CustomDialog
					key={`restore-${document._id}`}
					openModal={restoreModalOpen[index] || false}
					closeModal={() => closeRestoreModal(index)}
					title='Restore Document'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
							Are you sure you want to restore "{truncateText(document.name, 25)}"?
						</Typography>
						<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2 }}>
							This document will become available again on all courses and lessons where it was previously used.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeRestoreModal(index)}
						onSubmit={() => {
							restoreDocument(document._id);
							closeRestoreModal(index);
						}}
						submitBtnText='Restore'
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>
			))}

			{/* Delete Modal */}
			{paginatedDocuments?.map((document, index) => (
				<CustomDialog
					key={`delete-${document._id}`}
					openModal={deleteModalOpen[index] || false}
					closeModal={() => closeDeleteModal(index)}
					title='Delete Document Permanently'
					maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
							Are you sure you want to permanently delete "{truncateText(document.name, 25)}"? This action cannot be undone.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => closeDeleteModal(index)}
						onDelete={() => {
							hardDeleteDocument(document._id);
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
				title='Restore Multiple Documents'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
						Are you sure you want to restore {selectedItems.length} selected document(s)?
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2 }}>
						These documents will become available again on all courses and lessons where they were previously used.
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
				title='Delete Multiple Documents Permanently'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ lineHeight: 1.7 }}>
						Are you sure you want to permanently delete {selectedItems.length} selected document(s)? This action cannot be undone.
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
						Documents in the recycle bin are automatically permanently deleted after 7 days. This action cannot be undone.
					</Typography>
					<Typography variant='body2' sx={{ lineHeight: 1.7, mt: 2 }}>
						You can restore documents before this date or manually delete them immediately using the "Delete Permanently" button.
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

export default AdminRecycleBinDocumentsTab;
