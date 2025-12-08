import { Box, Table, TableBody, TableCell, TableRow, Typography, Snackbar, Alert, Tooltip, IconButton, DialogContent, Chip } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeedbackFormsContext } from '../contexts/FeedbackFormsContextProvider';
import { useAuth } from '../hooks/useAuth';
import { Delete, Edit, Add, Info } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { FeedbackFormTemplate } from '../interfaces/feedbackFormTemplate';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { truncateText } from '../utils/utilText';
import theme from '../themes';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CreateEditTemplateDialog from '../components/feedbackForms/CreateEditTemplateDialog';
import TemplateInfoModal from '../components/feedbackForms/TemplateInfoModal';

const AdminFeedbackFormTemplates = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { isInstructor } = useAuth();
	const { orgId } = useContext(OrganisationContext);
	const { deleteTemplate, templates, templatesLoading, templatesError, fetchTemplates: fetchTemplatesFromContext } = useContext(FeedbackFormsContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Modal states
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean[]>([]);
	const [isTemplateInfoModalOpen, setIsTemplateInfoModalOpen] = useState<boolean[]>([]);
	const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState<boolean>(false);
	const [templateToDelete, setTemplateToDelete] = useState<FeedbackFormTemplate | null>(null);
	const [templateToViewInfo, setTemplateToViewInfo] = useState<FeedbackFormTemplate | null>(null);
	const [templateToEdit, setTemplateToEdit] = useState<FeedbackFormTemplate | null>(null);
	const [successMessage, setSuccessMessage] = useState<string>('');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [successSnackbarOpen, setSuccessSnackbarOpen] = useState<boolean>(false);
	const [errorSnackbarOpen, setErrorSnackbarOpen] = useState<boolean>(false);

	// Pagination state for useFilterSearch (templates are not paginated, but useFilterSearch expects these)
	const [templatesPageNumber, setTemplatesPageNumber] = useState<number>(1);
	const totalItems = templates?.length || 0;
	const loadedPages: number[] = templates && templates.length > 0 ? [1] : [];

	const pageSize = 50;

	// Dummy fetchMoreTemplates function (templates are fetched all at once, no pagination)
	const fetchMoreTemplates = async () => {
		// Templates are not paginated, so this is a no-op
	};

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayTemplates,
		numberOfPages: templatesNumberOfPages,
		currentPage: templatesCurrentPage,
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
	} = useFilterSearch<FeedbackFormTemplate>({
		getEndpoint: () => {
			return `${base_url}/feedback-form-templates`;
		},
		limit: 200,
		pageSize,
		contextData: templates || [],
		setContextPageNumber: setTemplatesPageNumber,
		fetchMoreContextData: fetchMoreTemplates,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	// Initial fetch - use context
	useEffect(() => {
		if (orgId) {
			fetchTemplatesFromContext();
		}
	}, [orgId, fetchTemplatesFromContext]);

	// Update modal states when data changes
	useEffect(() => {
		if (displayTemplates && displayTemplates.length !== isDeleteModalOpen.length) {
			setIsDeleteModalOpen(Array(displayTemplates.length).fill(false));
			setIsTemplateInfoModalOpen(Array(displayTemplates.length).fill(false));
		}
	}, [displayTemplates, templatesCurrentPage, filterValue, searchValue]);

	// Responsive column configuration
	const getColumns = (isMobileSize: boolean) => {
		return isMobileSize
			? [
					{ key: 'name', label: 'Name' },
					{ key: 'category', label: 'Category' },
					{ key: 'fields', label: 'Fields' },
					{ key: 'actions', label: 'Actions' },
				]
			: [
					{ key: 'name', label: 'Name' },
					{ key: 'category', label: 'Category' },
					{ key: 'fields', label: 'Fields' },
					{ key: 'usage', label: 'Usage' },
					{ key: 'createdBy', label: 'Created By' },
					{ key: 'actions', label: 'Actions' },
				];
	};

	const sortedTemplates = useMemo(() => {
		if (!displayTemplates) return [];
		return [...displayTemplates].sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';
			return order === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		});
	}, [displayTemplates, orderBy, order]);

	const paginatedTemplates = sortedTemplates;

	const openDeleteModal = (index: number) => {
		const newModals = [...isDeleteModalOpen];
		newModals[index] = true;
		setIsDeleteModalOpen(newModals);
		setTemplateToDelete(paginatedTemplates[index]);
	};

	const closeDeleteModal = (index: number) => {
		const newModals = [...isDeleteModalOpen];
		newModals[index] = false;
		setIsDeleteModalOpen(newModals);
		setTemplateToDelete(null);
	};

	const openTemplateInfoModal = (index: number) => {
		const newModals = [...isTemplateInfoModalOpen];
		newModals[index] = true;
		setIsTemplateInfoModalOpen(newModals);
		setTemplateToViewInfo(paginatedTemplates[index]);
	};

	const closeTemplateInfoModal = (index: number) => {
		const newModals = [...isTemplateInfoModalOpen];
		newModals[index] = false;
		setIsTemplateInfoModalOpen(newModals);
		setTemplateToViewInfo(null);
	};

	const handleDelete = async () => {
		if (!templateToDelete) return;
		try {
			await deleteTemplate(templateToDelete._id);
			setSuccessMessage('Template deleted successfully');
			setSuccessSnackbarOpen(true);
			closeDeleteModal(paginatedTemplates.findIndex((t) => t._id === templateToDelete._id));

			// If search is active, remove from search results
			if (isSearchActive) {
				removeFromSearchResults(templateToDelete._id);
			} else {
				// Update local state
				// Templates will be automatically refetched via context query invalidation
			}
		} catch (error: any) {
			setErrorMessage(error?.message || 'Failed to delete template');
			setErrorSnackbarOpen(true);
		}
	};

	const handleEditTemplate = (templateId: string) => {
		const template = paginatedTemplates.find((t) => t._id === templateId);
		if (template) {
			setTemplateToEdit(template);
			setIsCreateEditDialogOpen(true);
		}
	};

	const handleCreateTemplate = () => {
		setTemplateToEdit(null);
		setIsCreateEditDialogOpen(true);
	};

	const handleTemplateDialogSuccess = async () => {
		setIsCreateEditDialogOpen(false);
		setTemplateToEdit(null);
		setSuccessMessage(templateToEdit ? 'Template updated successfully' : 'Template created successfully');
		setSuccessSnackbarOpen(true);

		// Refresh templates - context will automatically refetch via query invalidation
		await fetchTemplatesFromContext();
	};

	if (templatesError) return <Typography color='error'>{templatesError}</Typography>;

	if (templatesLoading && !displayTemplates) {
		return (
			<DashboardPagesLayout pageName='Form Templates' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={6} />
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Form Templates'>
			<DashboardPagesLayout pageName='Form Templates' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<FilterSearchRow
					filterValue={filterValue}
					onFilterChange={handleFilterChange}
					filterOptions={[
						{ value: '', label: 'All Templates' },
						{ value: 'session-feedback', label: 'Session Feedback' },
						{ value: 'course-evaluation', label: 'Course Evaluation' },
						{ value: 'custom', label: 'Custom' },
					]}
					filterPlaceholder='Filter Templates'
					searchValue={searchValue}
					onSearchChange={setSearchValue}
					onSearch={handleSearch}
					onReset={resetAll}
					searchPlaceholder='Search in Name and Description'
					isSearchLoading={isSearchLoading}
					isSearchActive={isSearchActive}
					searchResultsTotalItems={searchResultsTotalItems}
					totalItems={totalItems}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					actionButtons={[
						{
							label: isMobileSize ? 'New' : 'Create Template',
							onClick: handleCreateTemplate,
							startIcon: <Add />,
						},
					]}
					isSticky={true}
				/>

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
							// Column widths for header cells - Mobile: 4 cols, Desktop: 6 cols
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '100px' : '200px',
								width: isMobileSize ? '30%' : '25%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '80px' : '120px',
								width: isMobileSize ? '25%' : '15%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '60px' : '80px',
								width: isMobileSize ? '20%' : '10%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '80px' : '80px',
								width: isMobileSize ? '25%' : '10%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
								minWidth: isMobileSize ? '0px' : '150px',
								width: isMobileSize ? '0%' : '20%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
								minWidth: isMobileSize ? '0px' : '100px',
								width: isMobileSize ? '0%' : '20%',
							},
							// Column widths for body cells - exact same as header
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '100px' : '200px',
								width: isMobileSize ? '30%' : '25%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '80px' : '120px',
								width: isMobileSize ? '25%' : '15%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '60px' : '80px',
								width: isMobileSize ? '20%' : '10%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '80px' : '80px',
								width: isMobileSize ? '25%' : '10%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
								minWidth: isMobileSize ? '0px' : '150px',
								width: isMobileSize ? '0%' : '20%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(6)': {
								minWidth: isMobileSize ? '0px' : '100px',
								width: isMobileSize ? '0%' : '20%',
							},
						}}
						size='small'
						aria-label='a dense table'>
						<TableBody>
							{/* Spacer row to ensure header alignment */}
							<TableRow sx={{ height: 0, visibility: 'hidden' }}>
								<TableCell sx={{ width: isMobileSize ? '30%' : '25%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '25%' : '15%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '20%' : '10%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '25%' : '10%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '0%' : '20%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '0%' : '20%', padding: 0, border: 'none' }} />
							</TableRow>
						</TableBody>
						<CustomTableHead<FeedbackFormTemplate>
							orderBy={orderBy as keyof FeedbackFormTemplate}
							order={order}
							handleSort={handleSort}
							columns={getColumns(isMobileSize)}
						/>
						<TableBody>
							{paginatedTemplates &&
								paginatedTemplates.map((template: FeedbackFormTemplate, index: number) => {
									const deleteModalOpen = isDeleteModalOpen[index] || false;
									const createdBy = template.createdBy as any;
									const createdByName =
										createdBy?.firstName && createdBy?.lastName ? `${createdBy.firstName} ${createdBy.lastName}` : createdBy?.email || 'Unknown';
									return (
										<TableRow key={template._id} hover>
											<CustomTableCell value={truncateText(template.name, isMobileSize ? 20 : 40)} />
											<TableCell>
												{template.category ? (
													<Chip
														label={template.category.replace('-', ' ')}
														size='small'
														sx={{
															fontSize: isMobileSize ? '0.7rem' : '0.75rem',
															height: isMobileSize ? '1.25rem' : '1.5rem',
															textTransform: 'capitalize',
														}}
													/>
												) : (
													<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', color: 'text.secondary' }}>
														No Category
													</Typography>
												)}
											</TableCell>
											<TableCell sx={{ textAlign: 'center' }}>
												<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
													{template.fields?.length || 0}
												</Typography>
											</TableCell>
											{!isMobileSize && (
												<TableCell sx={{ textAlign: 'center' }}>
													<Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
														{template.usageCount || 0}
													</Typography>
												</TableCell>
											)}
											{!isMobileSize && <CustomTableCell value={truncateText(createdByName, 30)} />}
											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<CustomActionBtn
													title='Edit'
													onClick={() => handleEditTemplate(template._id)}
													icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
												<CustomActionBtn
													title='Delete'
													onClick={() => openDeleteModal(index)}
													icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
												<CustomActionBtn
													title='More Info'
													onClick={() => openTemplateInfoModal(index)}
													icon={<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					{paginatedTemplates && paginatedTemplates.length === 0 && (
						<CustomInfoMessageAlignedLeft
							message={isSearchActive ? 'No templates found matching your search criteria.' : 'No templates found.'}
							sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
						/>
					)}
					{isMobileSize && !(paginatedTemplates && paginatedTemplates.length === 0) && (
						<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
					)}
					<CustomTablePagination count={templatesNumberOfPages} page={templatesCurrentPage} onChange={handlePageChange} />
				</Box>

				{/* Success Snackbar */}
				<Snackbar
					open={successSnackbarOpen}
					autoHideDuration={5000}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					sx={{ mt: '4rem' }}
					onClose={() => setSuccessSnackbarOpen(false)}>
					<Alert
						onClose={() => setSuccessSnackbarOpen(false)}
						severity='success'
						sx={{
							'width': isMobileSize ? '60%' : '100%',
							'backgroundColor': theme.bgColor?.greenSecondary,
							'color': theme.textColor?.common.main,
							'fontSize': isMobileSize ? '0.75rem' : undefined,
							'& .MuiAlert-icon': {
								color: 'white',
							},
						}}>
						{successMessage}
					</Alert>
				</Snackbar>

				{/* Error Snackbar */}
				<Snackbar
					open={errorSnackbarOpen}
					autoHideDuration={6000}
					onClose={() => setErrorSnackbarOpen(false)}
					anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
					<Alert onClose={() => setErrorSnackbarOpen(false)} severity='error' sx={{ width: '100%' }}>
						{errorMessage}
					</Alert>
				</Snackbar>

				{/* Delete Template Dialog */}
				{paginatedTemplates.map((template, index) => {
					const deleteModalOpen = isDeleteModalOpen[index] || false;
					return (
						deleteModalOpen && (
							<CustomDialog
								key={`delete-${template._id}`}
								openModal={deleteModalOpen}
								closeModal={() => closeDeleteModal(index)}
								title='Delete Template'
								maxWidth='xs'>
								<DialogContent>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
										Are you sure you want to delete &quot;{template.name}&quot;?
									</Typography>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
										This action will permanently delete the template.
									</Typography>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mt: '1.5rem' }}>
										This action cannot be undone.
									</Typography>
								</DialogContent>
								<CustomDialogActions
									onCancel={() => closeDeleteModal(index)}
									deleteBtn={true}
									onDelete={async () => {
										try {
											await deleteTemplate(template._id);
											setSuccessMessage('Template deleted successfully');
											setSuccessSnackbarOpen(true);
											closeDeleteModal(index);

											// If search is active, remove from search results
											if (isSearchActive) {
												removeFromSearchResults(template._id);
											}
										} catch (error: any) {
											setErrorMessage(error?.message || 'Failed to delete template');
											setErrorSnackbarOpen(true);
										}
									}}
									actionSx={{ mb: '0.5rem' }}
								/>
							</CustomDialog>
						)
					);
				})}

				{/* Template Info Dialog */}
				{isTemplateInfoModalOpen.map(
					(isOpen, index) =>
						isOpen &&
						templateToViewInfo && (
							<TemplateInfoModal key={index} isOpen={isOpen} onClose={() => closeTemplateInfoModal(index)} template={templateToViewInfo} />
						)
				)}

				{/* Create/Edit Template Dialog */}
				<CreateEditTemplateDialog
					isOpen={isCreateEditDialogOpen}
					onClose={() => {
						setIsCreateEditDialogOpen(false);
						setTemplateToEdit(null);
					}}
					templateToEdit={templateToEdit}
					onSuccess={handleTemplateDialogSuccess}
				/>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminFeedbackFormTemplates;
