import { Box, Table, TableBody, TableCell, TableRow, Typography, Snackbar, Alert, Switch, Tooltip, IconButton, DialogContent } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FeedbackFormsContext } from '../contexts/FeedbackFormsContextProvider';
import { useAuth } from '../hooks/useAuth';
import { Delete, Edit, ContentCopy, Visibility, Add, Info, Description } from '@mui/icons-material';
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

const AdminForms = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
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
		formsPageNumber,
		setFormsPageNumber,
		totalItems,
		loadedPages,
		enableFormsFetch,
	} = useContext(FeedbackFormsContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	// Modal states
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean[]>([]);
	const [isFormInfoModalOpen, setIsFormInfoModalOpen] = useState<boolean[]>([]);
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

	// Initial fetch - use context (no courseId, so fetches all forms)
	useEffect(() => {
		if (orgId) {
			enableFormsFetch();
			fetchFormsFromContext(); // No courseId = fetch all forms
		}
	}, [orgId, enableFormsFetch, fetchFormsFromContext]);

	// Update modal states when data changes
	useEffect(() => {
		if (displayForms && displayForms.length !== isDeleteModalOpen.length) {
			setIsDeleteModalOpen(Array(displayForms.length).fill(false));
			setIsFormInfoModalOpen(Array(displayForms.length).fill(false));
		}
	}, [displayForms, formsCurrentPage, filterValue, searchValue]);

	// Responsive column configuration
	const getColumns = (isMobileSize: boolean) => {
		return isMobileSize
			? [
					{ key: 'title', label: 'Title' },
					{ key: 'status', label: 'Status' },
					{ key: 'submissions', label: 'Submissions' },
					{ key: 'actions', label: 'Actions' },
				]
			: [
					{ key: 'title', label: 'Title' },
					{ key: 'course', label: 'Course' },
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

	const openDeleteModal = (index: number) => {
		const newModals = [...isDeleteModalOpen];
		newModals[index] = true;
		setIsDeleteModalOpen(newModals);
		setFormToDelete(paginatedForms[index]);
	};

	const closeDeleteModal = (index: number) => {
		const newModals = [...isDeleteModalOpen];
		newModals[index] = false;
		setIsDeleteModalOpen(newModals);
		setFormToDelete(null);
	};

	const openFormInfoModal = (index: number) => {
		const newModals = [...isFormInfoModalOpen];
		newModals[index] = true;
		setIsFormInfoModalOpen(newModals);
		setFormToViewInfo(paginatedForms[index]);
	};

	const closeFormInfoModal = (index: number) => {
		const newModals = [...isFormInfoModalOpen];
		newModals[index] = false;
		setIsFormInfoModalOpen(newModals);
		setFormToViewInfo(null);
	};

	const handleDelete = async () => {
		if (!formToDelete) return;
		try {
			await deleteForm(formToDelete._id);
			setSuccessMessage('Form deleted successfully');
			setSuccessSnackbarOpen(true);
			closeDeleteModal(paginatedForms.findIndex((f) => f._id === formToDelete._id));

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

	const handlePublishToggle = async (form: FeedbackForm, index: number) => {
		try {
			if (form.isPublished) {
				await unpublishForm(form._id);
				setSuccessMessage('Form unpublished successfully');
			} else {
				await publishForm(form._id);
				setSuccessMessage('Form published successfully');
			}
			setSuccessSnackbarOpen(true);

			// Context will automatically refetch after mutation
		} catch (error: any) {
			setErrorMessage(error?.message || 'Failed to update form status');
			setErrorSnackbarOpen(true);
		}
	};

	const handleCopyPublicLink = (publicLink: string) => {
		const baseUrl = window.location.origin;
		const fullLink = `${baseUrl}/feedback-form/${publicLink}`;
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

	const handleViewSubmissions = (formId: string, courseId?: string | any) => {
		const routePrefix = isInstructor ? '/instructor' : '/admin';

		// Extract courseId value if it exists
		let courseIdValue: string | null = null;

		if (courseId) {
			if (typeof courseId === 'string' && courseId.trim()) {
				// courseId is a valid string
				courseIdValue = courseId;
			} else if (typeof courseId === 'object' && courseId !== null && courseId._id) {
				// courseId is a populated object with _id
				courseIdValue = typeof courseId._id === 'string' ? courseId._id : String(courseId._id);
			}
		}

		// Navigate to course-specific or general submissions page
		if (courseIdValue) {
			navigate(`${routePrefix}/course/${courseIdValue}/forms/${formId}/submissions`);
		} else {
			// For forms without course, navigate to a general submissions page
			navigate(`${routePrefix}/forms/${formId}/submissions`);
		}
	};

	const [isCreateFormDialogOpen, setIsCreateFormDialogOpen] = useState<boolean>(false);
	const [isEditFormDialogOpen, setIsEditFormDialogOpen] = useState<boolean[]>([]);
	const [formToEdit, setFormToEdit] = useState<FeedbackForm | null>(null);

	const handleCreateForm = () => {
		setIsCreateFormDialogOpen(true);
	};

	const handleEditForm = (formId: string) => {
		const form = paginatedForms.find((f) => f._id === formId);
		if (form) {
			setFormToEdit(form);
			const index = paginatedForms.findIndex((f) => f._id === formId);
			const newModals = [...isEditFormDialogOpen];
			newModals[index] = true;
			setIsEditFormDialogOpen(newModals);
		}
	};

	const closeCreateFormDialog = () => {
		setIsCreateFormDialogOpen(false);
	};

	const closeEditFormDialog = (index: number) => {
		const newModals = [...isEditFormDialogOpen];
		newModals[index] = false;
		setIsEditFormDialogOpen(newModals);
		setFormToEdit(null);
	};

	if (formsLoading && !displayForms) {
		return (
			<DashboardPagesLayout pageName='All Forms' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={7} />
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary>
			<DashboardPagesLayout pageName='All Forms' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<FilterSearchRow
					filterValue={filterValue}
					onFilterChange={handleFilterChange}
					filterOptions={[
						{ value: '', label: 'All Forms' },
						{ value: 'published', label: 'Published' },
						{ value: 'unpublished', label: 'Unpublished' },
						{ value: 'active', label: 'Active' },
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
						{
							label: isMobileSize ? 'Templates' : 'Form Templates',
							onClick: () => navigate(isInstructor ? '/instructor/form-templates' : '/admin/form-templates'),
							startIcon: isMobileSize ? undefined : <Description fontSize='small' />,
						},
						{
							label: isMobileSize ? 'New' : 'Create Form',
							onClick: handleCreateForm,
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
							// Column widths for header cells
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '100px' : '200px',
								width: isMobileSize ? '25%' : '22.5%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '80px' : '120px',
								width: isMobileSize ? '25%' : '22.5%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '80px' : '120px',
								width: isMobileSize ? '25%' : '20%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '70px' : '100px',
								width: isMobileSize ? '25%' : '15%',
							},
							'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
								minWidth: isMobileSize ? '80px' : '100px',
								width: isMobileSize ? '0%' : '20%',
							},
							// Column widths for body cells - exact same as header
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
								minWidth: isMobileSize ? '100px' : '200px',
								width: isMobileSize ? '25%' : '22.5%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
								minWidth: isMobileSize ? '80px' : '120px',
								width: isMobileSize ? '25%' : '22.5%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
								minWidth: isMobileSize ? '80px' : '120px',
								width: isMobileSize ? '25%' : '20%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
								minWidth: isMobileSize ? '70px' : '100px',
								width: isMobileSize ? '25%' : '15%',
							},
							'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
								minWidth: isMobileSize ? '80px' : '100px',
								width: isMobileSize ? '0%' : '20%',
							},
						}}
						size='small'
						aria-label='a dense table'>
						<TableBody>
							{/* Spacer row to ensure header alignment */}
							<TableRow sx={{ height: 0, visibility: 'hidden' }}>
								<TableCell sx={{ width: isMobileSize ? '25%' : '22.5%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '25%' : '22.5%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '25%' : '20%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '25%' : '15%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isMobileSize ? '0%' : '20%', padding: 0, border: 'none' }} />
							</TableRow>
						</TableBody>
						<CustomTableHead<FeedbackForm>
							orderBy={orderBy as keyof FeedbackForm}
							order={order}
							handleSort={handleSort}
							columns={getColumns(isMobileSize)}
						/>
						<TableBody>
							{paginatedForms &&
								paginatedForms.map((form: FeedbackForm, index: number) => {
									const deleteModalOpen = isDeleteModalOpen[index] || false;
									const courseTitle = (form.courseId as any)?.title || 'N/A';
									return (
										<TableRow key={form._id} hover>
											<CustomTableCell value={truncateText(form.title, isMobileSize ? 20 : 40)} />
											{!isMobileSize && <CustomTableCell value={truncateText(courseTitle, isMobileSize ? 15 : 30)} />}
											<TableCell sx={{ textAlign: 'center' }}>
												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
													<Switch
														checked={form.isPublished || false}
														onChange={() => handlePublishToggle(form, index)}
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
															<IconButton size='small' onClick={() => handleViewSubmissions(form._id, form.courseId)} sx={{ padding: '0.15rem' }}>
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
												{form.isPublished && form.publicLink && (
													<Tooltip title='Copy Public Link' placement='top' arrow>
														<IconButton size='small' onClick={() => handleCopyPublicLink(form.publicLink!)}>
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
													onClick={() => openDeleteModal(index)}
													icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
												<CustomActionBtn
													title='More Info'
													onClick={() => openFormInfoModal(index)}
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
				<CreateFeedbackFormDialog
					isOpen={isCreateFormDialogOpen}
					onClose={closeCreateFormDialog}
					onSuccess={() => {
						closeCreateFormDialog();
						setSuccessMessage('Form created successfully');
						setSuccessSnackbarOpen(true);
						// Context will automatically refetch after mutation
					}}
				/>

				{/* Edit Form Dialog */}
				{paginatedForms.map((form, index) => {
					const editDialogOpen = isEditFormDialogOpen[index] || false;
					// Don't pass courseId prop when editing from AdminForms - let the dialog handle it via selectedCourse
					// This allows users to update/remove course selection
					return (
						<CreateFeedbackFormDialog
							key={form._id}
							isOpen={editDialogOpen}
							onClose={() => closeEditFormDialog(index)}
							formToEdit={formToEdit}
							onSuccess={() => {
								closeEditFormDialog(index);
								setSuccessMessage('Form updated successfully');
								setSuccessSnackbarOpen(true);
								// Context will automatically refetch after mutation
							}}
						/>
					);
				})}

				{/* Delete Form Dialog */}
				{paginatedForms.map((form, index) => {
					const deleteModalOpen = isDeleteModalOpen[index] || false;
					return (
						deleteModalOpen && (
							<CustomDialog
								key={`delete-${form._id}`}
								openModal={deleteModalOpen}
								closeModal={() => closeDeleteModal(index)}
								title='Delete Form'
								maxWidth='xs'>
								<DialogContent>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
										Are you sure you want to delete &quot;{form.title}&quot;?
									</Typography>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
										This action will permanently delete the form and all associated submissions
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
											await deleteForm(form._id);
											setSuccessMessage('Form deleted successfully');
											setSuccessSnackbarOpen(true);
											closeDeleteModal(index);

											// If search is active, remove from search results
											if (isSearchActive) {
												removeFromSearchResults(form._id);
											}
											// Context will automatically refetch after mutation
										} catch (error: any) {
											setErrorMessage(error?.message || 'Failed to delete form');
											setErrorSnackbarOpen(true);
										}
									}}
									actionSx={{ mb: '0.5rem' }}
								/>
							</CustomDialog>
						)
					);
				})}

				{/* Form Info Dialog */}
				{isFormInfoModalOpen.map(
					(isOpen, index) =>
						isOpen &&
						formToViewInfo && (
							<CustomDialog key={index} openModal={isOpen} closeModal={() => closeFormInfoModal(index)} title='Form Information' maxWidth='sm'>
								<FormInfoModal form={formToViewInfo} onClose={() => closeFormInfoModal(index)} />
							</CustomDialog>
						)
				)}
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminForms;
