import { Box, Typography, Snackbar, Alert, Grid, DialogContent } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useState, useMemo, useEffect } from 'react';
import { Add } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { ResourcesContext } from '../contexts/ResourcesContextProvider';
import { ResourceFolder } from '../interfaces/resource';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CreateResourceFolderDialog from '../components/resources/CreateResourceFolderDialog';
import FolderCard from '../components/resources/FolderCard';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import EditResourceFolderDialog from '../components/resources/EditResourceFolderDialog';
import ResourcesSkeleton from '../components/layouts/skeleton/ResourcesSkeleton';
import ResourcesAccessMessage from '../components/resources/ResourcesAccessMessage';

const Resources = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const location = useLocation();
	const { hasAdminAccess } = useAuth();
	const {
		folders,
		foldersLoading,
		foldersError,
		fetchFolders,
		fetchMoreFolders,
		foldersPageNumber,
		setFoldersPageNumber,
		foldersTotalItems,
		foldersLoadedPages,
		createFolder,
		updateFolder,
		deleteFolder,
		resourcesAccessDenied,
		resourcesAccessLoading,
		setCurrentFolderId,
	} = useContext(ResourcesContext);

	// Folder list only — do not keep a folder selected (avoids fetching items in context)
	useEffect(() => {
		setCurrentFolderId(null);
	}, [setCurrentFolderId]);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const canEdit = hasAdminAccess; // Only admins can edit, instructors are read-only

	const pageSize = 100;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayFolders,
		numberOfPages: foldersNumberOfPages,
		currentPage: foldersCurrentPage,
		searchResultsTotalItems,
		searchedValue,
		orderBy,
		order,
		isSearchActive,
		isLoading: isSearchLoading,
		handleSearch,
		handleFilterChange,
		handlePageChange,
		resetSearch,
		resetFilter,
		resetAll,
	} = useFilterSearch<ResourceFolder>({
		getEndpoint: () => `${base_url}/resources/folders`,
		limit: 200,
		pageSize,
		contextData: folders,
		setContextPageNumber: setFoldersPageNumber,
		fetchMoreContextData: fetchMoreFolders,
		contextLoadedPages: foldersLoadedPages,
		contextTotalItems: foldersTotalItems,
		defaultOrderBy: 'name',
		defaultOrder: 'asc',
	});

	// State
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
	const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
	const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
	const [folderToDelete, setFolderToDelete] = useState<ResourceFolder | null>(null);
	const [currentFolder, setCurrentFolder] = useState<Partial<ResourceFolder> | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	// Sorted folders - backend now filters empty folders for learners/instructors
	const sortedFolders = useMemo(() => {
		if (!displayFolders) return [];
		return [...displayFolders].sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';
			return order === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		});
	}, [displayFolders, orderBy, order]);

	// Handlers
	const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!currentFolder?.name?.trim()) return;

		setIsCreating(true);
		try {
			await createFolder({
				name: currentFolder.name.trim(),
			});
			setSnackbarMessage('Folder created successfully');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
			setIsCreateFolderOpen(false);
			setCurrentFolder(null);
			fetchFolders(1);
		} catch (error: any) {
			setSnackbarMessage(error.response?.data?.message || 'Failed to create folder');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		} finally {
			setIsCreating(false);
		}
	};

	const handleUpdateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!currentFolder?._id || !currentFolder?.name?.trim()) return;

		setIsUpdating(true);
		try {
			await updateFolder(currentFolder._id, {
				name: currentFolder.name.trim(),
			});
			setSnackbarMessage('Folder updated successfully');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
			setIsEditFolderOpen(false);
			setCurrentFolder(null);
			fetchFolders(foldersPageNumber);
		} catch (error: any) {
			setSnackbarMessage(error.response?.data?.message || 'Failed to update folder');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDeleteFolder = async () => {
		if (!folderToDelete?._id) return;

		setIsDeleting(true);
		try {
			await deleteFolder(folderToDelete._id);
			setSnackbarMessage('Folder deleted successfully');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
			setIsDeleteFolderOpen(false);
			setFolderToDelete(null);
			fetchFolders(1);
		} catch (error: any) {
			setSnackbarMessage(error.response?.data?.message || 'Failed to delete folder');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AdminPageErrorBoundary pageName='Resources'>
			<DashboardPagesLayout pageName='Resources' customSettings={{ justifyContent: 'flex-start' }}>
				<Box sx={{ width: '100%', height: '100%' }}>
					{resourcesAccessLoading ? (
						<Box sx={{ px: 2, pt: 2 }}>
							<ResourcesSkeleton isItems={false} />
						</Box>
					) : resourcesAccessDenied ? (
						<ResourcesAccessMessage />
					) : (
						<>
					<FilterSearchRow
						filterValue={filterValue}
						onFilterChange={handleFilterChange}
						filterOptions={[
							{ value: '', label: 'All Folders' },
						]}
						filterPlaceholder='Filter Folders'
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						onSearch={handleSearch}
						onReset={resetAll}
						searchPlaceholder='Search in name'
						isSearchLoading={isSearchLoading}
						isSearchActive={isSearchActive}
						searchResultsTotalItems={searchResultsTotalItems}
						totalItems={foldersTotalItems || folders?.length || 0}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
						actionButtons={
							canEdit
								? [
										{
											label: isMobileSize ? 'Folder' : 'Create Folder',
											onClick: () => {
												setCurrentFolder({ name: '' });
												setIsCreateFolderOpen(true);
											},
											startIcon: <Add />,
										},
									]
								: []
						}
						isSticky={true}
					/>

					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							padding: isMobileSize ? '0rem 2rem 2rem 2rem' : '0rem 2rem 2rem 2rem',
							width: '100%',
							mt:'-2rem'
						}}>
						{foldersLoading || isSearchLoading ? (
							<ResourcesSkeleton isItems={false} />
						) : foldersError ? (
							<Alert severity='error'>{foldersError}</Alert>
						) : sortedFolders.length === 0 ? (
							<Box sx={{ p: '2rem', textAlign: 'center', borderRadius: 1, mt:'4rem' }}>
								<Typography variant='body2' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{isSearchActive ? 'No folders found matching your search criteria.' : 'No folders yet. Create your first folder to get started.'}
								</Typography>
							</Box>
						) : (
							<Grid container spacing={3} sx={{ mt: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
								{sortedFolders.map((folder) => (
									<Grid item xs={6} sm={4} md={3} lg={2} key={folder._id} display='flex' justifyContent='center'>
										<FolderCard
											folder={folder}
											onClick={() => {
												// Determine base path based on current route
												let basePath = '/admin/resources';
												if (location.pathname.includes('/instructor')) {
													basePath = '/instructor/resources';
												} else if (location.pathname.includes('/resources') && !location.pathname.includes('/admin')) {
													basePath = '/resources';
												}
												navigate(`${basePath}/folder/${folder._id}`);
											}}
											onEdit={canEdit ? (e) => {
												e.stopPropagation();
												setCurrentFolder(folder);
												setIsEditFolderOpen(true);
											} : undefined}
											onDelete={canEdit ? (e) => {
												e.stopPropagation();
												setFolderToDelete(folder);
												setIsDeleteFolderOpen(true);
											} : undefined}
										/>
									</Grid>
								))}
							</Grid>
						)}
						<Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', mt: '4rem' }}>
						<CustomTablePagination count={foldersNumberOfPages} page={foldersCurrentPage} onChange={handlePageChange} />
						</Box>
					</Box>
						</>
					)}

				</Box>

				{/* Dialogs */}
				{!resourcesAccessDenied && (
				<>
				<CreateResourceFolderDialog
					isOpen={isCreateFolderOpen}
					onClose={() => {
						setIsCreateFolderOpen(false);
						setCurrentFolder(null);
					}}
					onSubmit={handleCreateFolder}
					folder={currentFolder}
					setFolder={setCurrentFolder}
					isCreating={isCreating}
				/>

				<EditResourceFolderDialog
					isOpen={isEditFolderOpen}
					onClose={() => {
						setIsEditFolderOpen(false);
						setCurrentFolder(null);
					}}
					onSubmit={handleUpdateFolder}
					folder={currentFolder as ResourceFolder}
					setFolder={setCurrentFolder}
					isUpdating={isUpdating}
				/>

				{/* Delete Confirmation */}
				<CustomDialog
					title='Delete Folder'
					openModal={isDeleteFolderOpen}
					closeModal={() => setIsDeleteFolderOpen(false)}
					maxWidth='xs'>
					<DialogContent>
						{folderToDelete && folderToDelete.itemCount !== undefined && folderToDelete.itemCount !== null && folderToDelete.itemCount > 0 ? (
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', color: 'error.main' }}>
								This folder contains {folderToDelete.itemCount} item(s). Please delete all items first.
							</Typography>
						) : (
							<>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
									Are you sure you want to delete "{folderToDelete?.name}"?
								</Typography>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
									This action cannot be undone.
								</Typography>
							</>
						)}
					</DialogContent>
					<CustomDialogActions
						onCancel={() => setIsDeleteFolderOpen(false)}
						deleteBtn={true}
						onDelete={() => {
							handleDeleteFolder();
							setIsDeleteFolderOpen(false);
						}}
						disableBtn={isDeleting || (folderToDelete?.itemCount !== undefined && folderToDelete?.itemCount !== null && folderToDelete.itemCount > 0)}
						isSubmitting={isDeleting}
						actionSx={{ mb: '0.5rem' }}
					/>
				</CustomDialog>
				</>
				)}

				{/* Snackbar */}
				<Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
					<Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
						{snackbarMessage}
					</Alert>
				</Snackbar>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default Resources;
