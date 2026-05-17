import { Box, Typography, Snackbar, Alert, Grid, DialogContent } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState, useMemo, useRef } from 'react';
import { Add, ArrowBack } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { ResourcesContext } from '../contexts/ResourcesContextProvider';
import { ResourceFolder, ResourceItem } from '../interfaces/resource';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CreateResourceItemDialog from '../components/resources/CreateResourceItemDialog';
import EditResourceItemDialog from '../components/resources/EditResourceItemDialog';
import ResourceItemCard from '../components/resources/ResourceItemCard';
import ResourcesSkeleton from '../components/layouts/skeleton/ResourcesSkeleton';
import ResourcesAccessMessage from '../components/resources/ResourcesAccessMessage';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';

const ResourceItems = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { folderId } = useParams<{ folderId: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { hasAdminAccess } = useAuth();
	const {
		folders,
		foldersLoading,
		fetchFolders,
		items,
		itemsLoading,
		itemsError,
		fetchItems,
		fetchMoreItems,
		itemsPageNumber,
		setItemsPageNumber,
		itemsTotalItems,
		itemsLoadedPages,
		setCurrentFolderId,
		createItem,
		updateItem,
		deleteItem,
		resourcesAccessDenied,
		resourcesAccessLoading,
	} = useContext(ResourcesContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const canEdit = hasAdminAccess; // Only admins can edit, instructors are read-only

	const pageSize = 100;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayItems,
		numberOfPages: itemsNumberOfPages,
		currentPage: itemsCurrentPage,
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
	} = useFilterSearch<ResourceItem>({
		getEndpoint: () => `${base_url}/resources/items`,
		limit: 200,
		pageSize,
		contextData: items,
		setContextPageNumber: setItemsPageNumber,
		fetchMoreContextData: fetchMoreItems,
		contextLoadedPages: itemsLoadedPages,
		contextTotalItems: itemsTotalItems,
		defaultOrderBy: 'title',
		defaultOrder: 'asc',
		customSearchParams: folderId ? { folderId } : {},
	});

	// State
	const [currentFolder, setCurrentFolder] = useState<ResourceFolder | null>(null);
	const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
	const [isEditItemOpen, setIsEditItemOpen] = useState(false);
	const [isDeleteItemOpen, setIsDeleteItemOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<ResourceItem | null>(null);
	const [currentItem, setCurrentItem] = useState<Partial<ResourceItem> | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
	const [duplicateNameError, setDuplicateNameError] = useState<string | null>(null);
	const prevFolderIdRef = useRef<string | undefined>(undefined);

	// Sorted items
	const sortedItems = useMemo(() => {
		if (!displayItems) return [];
		return [...displayItems].sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';
			return order === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		});
	}, [displayItems, orderBy, order]);

	// Load folder and items
	useEffect(() => {
		if (!folderId) return;

		// Prevent unnecessary re-runs by checking if folderId actually changed
		if (prevFolderIdRef.current === folderId) {
			return;
		}
		prevFolderIdRef.current = folderId;

		setCurrentFolderId(folderId);
		// Find folder from context or fetch
		const folder = folders.find((f) => f._id === folderId);
		if (folder) {
			setCurrentFolder(folder);
		} else if (!foldersLoading && folders.length > 0) {
			// Folder not found, redirect back
			let basePath = '/admin/resources';
			if (location.pathname.includes('/instructor')) {
				basePath = '/instructor/resources';
			} else if (location.pathname.includes('/resources') && !location.pathname.includes('/admin')) {
				basePath = '/resources';
			}
			navigate(basePath);
			return;
		}
		fetchItems(folderId, 1);
	}, [folderId, folders, foldersLoading, setCurrentFolderId, fetchItems, navigate, location.pathname]);

	// Handlers
	const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!currentItem?.title?.trim() || !currentItem?.url?.trim() || !folderId) return;

		setIsCreating(true);
		setDuplicateNameError(null);
		try {
			await createItem({
				folderId,
				title: currentItem.title.trim(),
				url: currentItem.url.trim(),
				type: currentItem.type || 'file',
			});
			setSnackbarMessage('Item added successfully');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
			setIsCreateItemOpen(false);
			setCurrentItem(null);
			fetchItems(folderId, itemsPageNumber);
			fetchFolders(1); // Update itemCount
		} catch (error: any) {
			const errorMessage = error.response?.data?.message || 'Failed to add item';
			// Check if it's the duplicate name error
			if (error.response?.status === 409 && errorMessage.includes('already exists')) {
				setDuplicateNameError(errorMessage);
			} else {
				setSnackbarMessage(errorMessage);
				setSnackbarSeverity('error');
				setSnackbarOpen(true);
			}
		} finally {
			setIsCreating(false);
		}
	};

	const handleUpdateItem = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!currentItem?._id || !currentItem?.title?.trim()) return;

		setIsUpdating(true);
		setDuplicateNameError(null);
		try {
			const updateData: any = {
				title: currentItem.title.trim(),
			};
			// Only send URL if it's a url or video type
			if ((currentItem.type === 'url' || currentItem.type === 'video') && currentItem.url?.trim()) {
				updateData.url = currentItem.url.trim();
			}
			await updateItem(currentItem._id, updateData);
			setSnackbarMessage('Item updated successfully');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
			setIsEditItemOpen(false);
			setCurrentItem(null);
			if (folderId) {
				fetchItems(folderId, itemsPageNumber);
			}
		} catch (error: any) {
			const errorMessage = error.response?.data?.message || 'Failed to update item';
			// Check if it's the duplicate name error
			if (error.response?.status === 409 && errorMessage.includes('already exists')) {
				setDuplicateNameError(errorMessage);
			} else {
				setSnackbarMessage(errorMessage);
				setSnackbarSeverity('error');
				setSnackbarOpen(true);
			}
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDeleteItem = async () => {
		if (!itemToDelete?._id) return;

		setIsDeleting(true);
		try {
			await deleteItem(itemToDelete._id);
			setSnackbarMessage('Item deleted successfully');
			setSnackbarSeverity('success');
			setSnackbarOpen(true);
			setIsDeleteItemOpen(false);
			setItemToDelete(null);
			if (folderId) {
				fetchItems(folderId, itemsPageNumber);
				fetchFolders(1); // Update itemCount
			}
		} catch (error: any) {
			setSnackbarMessage(error.response?.data?.message || 'Failed to delete item');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<AdminPageErrorBoundary pageName={currentFolder ? `${currentFolder.name} - Resources` : 'Resource Items'}>
			<DashboardPagesLayout pageName={currentFolder ? `${currentFolder.name}` : 'Resources'} customSettings={{ justifyContent: 'flex-start' }}>
				<Box sx={{ width: '100%', height: '100%' }}>
					{resourcesAccessLoading ? (
						<Box sx={{ px: 2, pt: 2 }}>
							<ResourcesSkeleton isItems={true} />
						</Box>
					) : resourcesAccessDenied ? (
						<ResourcesAccessMessage />
					) : (
						<>
					<FilterSearchRow
						filterValue={filterValue}
						onFilterChange={handleFilterChange}
						filterOptions={[
							{ value: '', label: 'All Resources' },
						]}
						filterPlaceholder='Filter Resources'
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						onSearch={handleSearch}
						onReset={resetAll}
						searchPlaceholder='Search in name'
						isSearchLoading={isSearchLoading}
						isSearchActive={isSearchActive}
						searchResultsTotalItems={searchResultsTotalItems}
						totalItems={itemsTotalItems || items?.length || 0}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
					actionButtons={[
						{
							label: isMobileSize ? 'Back' : 'Resources',
							onClick: () => {
								// Determine base path based on current route
								let basePath = '/admin/resources';
								if (location.pathname.includes('/instructor')) {
									basePath = '/instructor/resources';
								} else if (location.pathname.includes('/resources') && !location.pathname.includes('/admin')) {
									basePath = '/resources';
								}
								navigate(basePath);
							},
							startIcon: <ArrowBack />,
						},
						...(canEdit
							? [
									{
										label: isMobileSize ? 'Resource' : 'Add Resource',
										onClick: () => {
											setCurrentItem({ type: 'file', folderId });
											setIsCreateItemOpen(true);
										},
										startIcon: <Add />,
									},
								]
							: []),
					]}
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
					

						{/* Items List */}
						{itemsLoading || isSearchLoading ? (
							<ResourcesSkeleton isItems={true} />
						) : itemsError ? (
							<Alert severity='error'>{itemsError}</Alert>
						) : sortedItems.length === 0 ? (
							<Box sx={{ p: '5rem 2rem', textAlign: 'center', borderRadius: 1 }}>
								<Typography variant='body2' color='text.secondary'>
									{isSearchActive ? 'No items found matching your search criteria.' : 'No items in this folder. Add your first item.'}
								</Typography>
							</Box>
						) : (
							<Grid container spacing={3} sx={{ mt: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
								{sortedItems.map((item) => (
									<Grid item xs={6} sm={4} md={3} lg={2.4} key={item._id} display='flex' justifyContent='center'>
										<ResourceItemCard
											item={item}
											onEdit={canEdit ? (e) => {
												e.stopPropagation();
												setCurrentItem(item);
												setIsEditItemOpen(true);
											} : undefined}
											onDelete={canEdit ? (e) => {
												e.stopPropagation();
												setItemToDelete(item);
												setIsDeleteItemOpen(true);
											} : undefined}
											onView={() => {
												if (item.url) {
													window.open(item.url, '_blank', 'noopener,noreferrer');
												}
											}}
										/>
									</Grid>
								))}
							</Grid>
						)}
						<Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: '4rem' }}>
						<CustomTablePagination count={itemsNumberOfPages} page={itemsCurrentPage} onChange={handlePageChange} />
						</Box>
					</Box>
						</>
					)}
				</Box>

				{/* Dialogs */}
				{!resourcesAccessDenied && (
				<>
				<CreateResourceItemDialog
					isOpen={isCreateItemOpen}
					onClose={() => {
						setIsCreateItemOpen(false);
						setCurrentItem(null);
						setDuplicateNameError(null);
					}}
					onSubmit={handleCreateItem}
					item={currentItem}
					setItem={setCurrentItem}
					folderId={folderId || ''}
					isCreating={isCreating}
					duplicateNameError={duplicateNameError}
					onClearError={() => setDuplicateNameError(null)}
				/>

				<EditResourceItemDialog
					isOpen={isEditItemOpen}
					onClose={() => {
						setIsEditItemOpen(false);
						setCurrentItem(null);
						setDuplicateNameError(null);
					}}
					onSubmit={handleUpdateItem}
					item={currentItem as ResourceItem}
					setItem={setCurrentItem}
					isUpdating={isUpdating}
					duplicateNameError={duplicateNameError}
					onClearError={() => setDuplicateNameError(null)}
				/>

				{/* Delete Confirmation */}
				<CustomDialog title='Delete Resource' openModal={isDeleteItemOpen} closeModal={() => setIsDeleteItemOpen(false)} maxWidth='xs'>
					<DialogContent>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
							Are you sure you want to delete "{itemToDelete?.title}"?
						</Typography>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
							This action cannot be undone.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => setIsDeleteItemOpen(false)}
						deleteBtn={true}
						onDelete={() => {
							handleDeleteItem();
							setIsDeleteItemOpen(false);
						}}
						disableBtn={isDeleting}
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

export default ResourceItems;
