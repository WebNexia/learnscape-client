import { Box, Table, TableBody, TableCell, TableRow, Typography, Snackbar, Alert, Switch, Tooltip, IconButton, DialogContent } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FeedbackFormsContext } from '../contexts/FeedbackFormsContextProvider';
import { useAuth } from '../hooks/useAuth';
import { Delete, Edit, ContentCopy, Visibility, Add, Info, ArrowBack, Description } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { FeedbackForm } from '../interfaces/feedbackForm';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { truncateText } from '../utils/utilText';
import theme from '../themes';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CreateFeedbackFormDialog from '../components/feedbackForms/CreateFeedbackFormDialog';
import FormInfoModal from '../components/feedbackForms/FormInfoModal';

const AdminCourseFeedbackForms = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { courseId } = useParams();
	const navigate = useNavigate();
	const { isInstructor } = useAuth();
	const { orgId } = useContext(OrganisationContext);
	const {
		forms,
		formsLoading,
		deleteForm,
		publishForm,
		unpublishForm,
		fetchForms: fetchFormsFromContext,
		fetchMoreForms,
		setFormsPageNumber,
		totalItems,
		loadedPages,
		enableFormsFetch,
	} = useContext(FeedbackFormsContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Modal states
	const [formToDelete, setFormToDelete] = useState<FeedbackForm | null>(null);
	const [formToViewInfo, setFormToViewInfo] = useState<FeedbackForm | null>(null);
	const [successMessage, setSuccessMessage] = useState<string>('');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [successSnackbarOpen, setSuccessSnackbarOpen] = useState<boolean>(false);
	const [errorSnackbarOpen, setErrorSnackbarOpen] = useState<boolean>(false);

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayForms,
		numberOfPages: formsNumberOfPages,
		currentPage: formsCurrentPage,
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
	} = useFilterSearch<FeedbackForm>({
		getEndpoint: () => {
			const params = new URLSearchParams();
			if (orgId) params.append('orgId', orgId);
			if (courseId) params.append('courseId', courseId);
			return `${base_url}/feedback-forms?${params.toString()}`;
		},
		limit: 200,
		pageSize,
		contextData: forms,
		setContextPageNumber: setFormsPageNumber,
		fetchMoreContextData: fetchMoreForms,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	// Set course scope before enabling so the first request is course-scoped
	useEffect(() => {
		if (!orgId) return;
		fetchFormsFromContext(courseId);
		enableFormsFetch();
	}, [orgId, courseId, enableFormsFetch, fetchFormsFromContext]);

	// Responsive column configuration
	const getColumns = () => {
		return [
			{ key: 'title', label: 'Title' },
			{ key: 'status', label: 'Status' },
			{ key: 'submissions', label: 'Submissions' },
			{ key: 'actions', label: 'Actions' },
		];
	};

	const sortedForms = useMemo(() => {
		if (!displayForms) return [];
		return [...displayForms].sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';
			return order === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		});
	}, [displayForms, orderBy, order]);

	const paginatedForms = sortedForms;

	const openDeleteModal = (form: FeedbackForm) => {
		setFormToDelete(form);
	};

	const closeDeleteModal = () => {
		setFormToDelete(null);
	};

	const openFormInfoModal = (form: FeedbackForm) => {
		setFormToViewInfo(form);
	};

	const closeFormInfoModal = () => {
		setFormToViewInfo(null);
	};

	const handleDelete = async () => {
		if (!formToDelete) return;
		try {
			await deleteForm(formToDelete._id);
			setSuccessMessage('Form deleted successfully');
			setSuccessSnackbarOpen(true);
			closeDeleteModal();

			// If search is active, remove from search results
			if (isSearchActive) {
				removeFromSearchResults(formToDelete._id);
			}
			// Context will automatically refetch after mutation
		} catch (error: any) {
			setErrorMessage(error?.message || 'Failed to delete form');
			setErrorSnackbarOpen(true);
		}
	};

	const handlePublishToggle = async (form: FeedbackForm) => {
		try {
			if (form.isPublished) {
				await unpublishForm(form._id);
				setSuccessMessage('Form unpublished successfully');
			} else {
				await publishForm(form._id);
				setSuccessMessage('Form published successfully');
			}
			setSuccessSnackbarOpen(true);

		} catch (error: any) {
			setErrorMessage(error?.message || 'Failed to update form status');
			setErrorSnackbarOpen(true);
		}
	};

	const handleCopyPublicLink = (formId: string) => {
		const baseUrl = window.location.origin;
		const fullLink = `${baseUrl}/form/${formId}`;
		navigator.clipboard.writeText(fullLink).then(
			() => {
				setSuccessMessage('Public link copied to clipboard');
				setSuccessSnackbarOpen(true);
			},
			() => {
				setErrorMessage('Failed to copy link');
				setErrorSnackbarOpen(true);
			}
		);
	};

	const handleViewSubmissions = (formId: string) => {
		if (isInstructor) {
			navigate(`/instructor/course/${courseId}/forms/${formId}/submissions`);
		} else {
			navigate(`/admin/course/${courseId}/forms/${formId}/submissions`);
		}
	};

	const [isCreateFormDialogOpen, setIsCreateFormDialogOpen] = useState<boolean>(false);
	const [formToEdit, setFormToEdit] = useState<FeedbackForm | null>(null);

	const handleCreateForm = () => {
		setIsCreateFormDialogOpen(true);
	};

	const handleEditForm = (formId: string) => {
		const form = paginatedForms.find((f) => f._id === formId);
		if (form) {
			setFormToEdit(form);
		}
	};

	const closeCreateFormDialog = () => {
		setIsCreateFormDialogOpen(false);
	};

	const closeEditFormDialog = () => {
		setFormToEdit(null);
	};

	if (formsLoading && (!displayForms || displayForms.length === 0)) {
		return (
			<DashboardPagesLayout pageName='Course Feedback Forms' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={5} />
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary>
			<DashboardPagesLayout pageName='Course Feedback Forms' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<FilterSearchRow
					filterValue={filterValue}
					onFilterChange={handleFilterChange}
					filterOptions={[
						{ value: '', label: 'All Forms' },
						{ value: 'published', label: 'Published' },
						{ value: 'unpublished', label: 'Unpublished' },
						{ value: 'active', label: 'Active' },
						{ value: 'consultation', label: 'Consultancy' },
					]}
					filterPlaceholder='Filter Forms'
					searchValue={searchValue}
					onSearchChange={setSearchValue}
					onSearch={handleSearch}
					onReset={resetAll}
					searchPlaceholder='Search in Title and Description'
					isSearchLoading={isSearchLoading}
					isSearchActive={isSearchActive}
					searchResultsTotalItems={searchResultsTotalItems}
					totalItems={totalItems || forms?.length || 0}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					actionButtons={[
						...(courseId
							? [
								{
									label: 'Back',
									onClick: () => navigate(`/admin/course-edit/course/${courseId}`),
									startIcon: isMobileSize ? undefined : <ArrowBack fontSize='small' />,
								},
							]
							: []),
						{
							label: isMobileSize ? 'Templates' : 'Form Templates',
							onClick: () => navigate(isInstructor ? '/instructor/form-templates' : '/admin/form-templates'),
							startIcon: isMobileSize ? undefined : <Description fontSize='small' />,
						},
						{
							label: isMobileSize ? 'New' : 'Create Form',
							onClick: handleCreateForm,
							startIcon: isMobileSize ? undefined : <Add fontSize='small' />,
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
							// Column widths for header cells
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '100px' : '200px',
								width: isMobileSize ? '25%' : '25%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '80px' : '120px',
								width: isMobileSize ? '25%' : '25%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '70px' : '100px',
								width: isMobileSize ? '25%' : '25%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '80px' : '100px',
								width: isMobileSize ? '25%' : '25%',
							},
							// Column widths for body cells - exact same as header
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '100px' : '200px',
								width: isMobileSize ? '25%' : '25%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '80px' : '120px',
								width: isMobileSize ? '25%' : '25%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '70px' : '100px',
								width: isMobileSize ? '25%' : '25%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '80px' : '100px',
								width: isMobileSize ? '25%' : '25%',
							},
						}}
						size='small'
						aria-label='a dense table'>
						<TableBody>
							{/* Spacer row to ensure header alignment */}
							<TableRow sx={{ height: 0, visibility: 'hidden' }}>
								<TableCell sx={{ width: isMobileSize ? '25%' : '22.5%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '25%' : '20%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '25%' : '15%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '25%' : '20%', padding: 0, border: 'none' }} />
							</TableRow>
						</TableBody>
						<CustomTableHead<FeedbackForm>
							orderBy={orderBy as keyof FeedbackForm}
							order={order}
							handleSort={handleSort}
							columns={getColumns()}
						/>
						<TableBody>
							{paginatedForms &&
								paginatedForms.map((form: FeedbackForm) => {
									return (
										<TableRow key={form._id} hover>
											<CustomTableCell value={truncateText(form.title, isMobileSize ? 20 : 40)} />
											<TableCell sx={{ textAlign: 'center' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
													<Switch
														checked={form.isPublished || false}
														onChange={() => handlePublishToggle(form)}
														size='small'
														color='primary'
													/>
													{!isMobileSize && (
														<Typography variant='body2' sx={{ color: form.isPublished ? theme.palette.success.main : theme.palette.text.secondary }}>
															{form.isPublished ? 'Published' : 'Unpublished'}
														</Typography>
													)}
												</Box>
											</TableCell>
											<TableCell sx={{ textAlign: 'center' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
													<Typography variant='body2'>{form.submissionCount || 0}</Typography>
													{(form.submissionCount ?? 0) > 0 && (
														<Tooltip title='View Submissions' placement='top' arrow>
															<IconButton size='small' onClick={() => handleViewSubmissions(form._id)} sx={{ padding: '0.15rem' }}>
																<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }} />
															</IconButton>
														</Tooltip>
													)}
												</Box>
											</TableCell>
											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												{form.isPublished && form._id && (
													<Tooltip title='Copy Public Link' placement='top' arrow>
														<IconButton size='small' onClick={() => handleCopyPublicLink(form._id)}>
															<ContentCopy fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />
														</IconButton>
													</Tooltip>
												)}
												<CustomActionBtn
													title='Edit'
													onClick={() => handleEditForm(form._id)}
													icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
												<CustomActionBtn
													title='Delete'
													onClick={() => openDeleteModal(form)}
													icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
												<CustomActionBtn
													title='More Info'
													onClick={() => openFormInfoModal(form)}
													icon={<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					{paginatedForms && paginatedForms.length === 0 && (
						<CustomInfoMessageAlignedLeft
							message={isSearchActive ? 'No forms found matching your search criteria.' : 'No forms found.'}
							sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
						/>
					)}
					{isMobileSize && !(paginatedForms && paginatedForms.length === 0) && (
						<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
					)}
					<CustomTablePagination count={formsNumberOfPages} page={formsCurrentPage} onChange={handlePageChange} />
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

				{/* Create Form Dialog */}
				{isCreateFormDialogOpen && (
					<CreateFeedbackFormDialog
						isOpen={isCreateFormDialogOpen}
						onClose={closeCreateFormDialog}
						courseId={courseId}
						onSuccess={() => {
							closeCreateFormDialog();
							setSuccessMessage('Form created successfully');
							setSuccessSnackbarOpen(true);
						}}
					/>
				)}

				{/* Edit Form Dialog */}
				{formToEdit && (
					<CreateFeedbackFormDialog
						isOpen={true}
						onClose={closeEditFormDialog}
						courseId={courseId}
						formToEdit={formToEdit}
						onSuccess={() => {
							closeEditFormDialog();
							setSuccessMessage('Form updated successfully');
							setSuccessSnackbarOpen(true);
						}}
					/>
				)}

				{/* Delete Form Dialog */}
				{formToDelete && (
					<CustomDialog openModal={true} closeModal={closeDeleteModal} title='Delete Form' maxWidth='xs'>
						<DialogContent>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
								Are you sure you want to delete &quot;{formToDelete.title}&quot;?
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
								This action will permanently delete the form and all associated submissions
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
								This action cannot be undone.
							</Typography>
						</DialogContent>
						<CustomDialogActions onCancel={closeDeleteModal} deleteBtn={true} onDelete={handleDelete} actionSx={{ mb: '0.5rem' }} />
					</CustomDialog>
				)}

				{/* Form Info Dialog */}
				{formToViewInfo && (
					<CustomDialog openModal={true} closeModal={closeFormInfoModal} title='Form Information' maxWidth='sm'>
						<FormInfoModal form={formToViewInfo} onClose={closeFormInfoModal} />
					</CustomDialog>
				)}
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminCourseFeedbackForms;
