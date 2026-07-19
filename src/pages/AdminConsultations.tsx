import { Box, Table, TableBody, TableRow, TableCell, Typography, Snackbar, Alert, DialogContent } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useMemo, useState } from 'react';
import { ConsultationsContext } from '../contexts/ConsultationsContextProvider';
import { Consultation, ConsultationPrice } from '../interfaces/consultation';
import { Delete, Edit, Info } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import axios from '@utils/axiosInstance';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CreateConsultationDialog from '../components/consultations/CreateConsultationDialog';
import ConsultationDetailsModal from '../components/consultations/ConsultationDetailsModal';

const getNestedValue = (obj: any, path: string) => path.split('.').reduce((current, key) => current?.[key], obj) ?? '';

const AdminConsultations = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();

	const {
		consultations,
		loading,
		error,
		fetchMoreConsultations,
		addNewConsultation,
		removeConsultation,
		totalItems,
		loadedPages,
		enableConsultationsFetch,
		setConsultationsPageNumber,
	} = useContext(ConsultationsContext);
	const { orgId } = useContext(OrganisationContext);
	const { isOwner, isSuperAdmin } = useAuth();
	const baseEndpoint = `/consultations/organisation/${orgId}`;

	const vertical = 'top';
	const horizontal = 'center';

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const pageSize = 25;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayConsultations,
		numberOfPages: consultationsNumberOfPages,
		currentPage: consultationsCurrentPage,
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
	} = useFilterSearch<Consultation>({
		getEndpoint: () => `${base_url}${baseEndpoint}`,
		limit: 100,
		pageSize,
		contextData: consultations,
		setContextPageNumber: setConsultationsPageNumber,
		fetchMoreContextData: fetchMoreConsultations,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'updatedAt',
		defaultOrder: 'desc',
	});

	const sortedConsultations = useMemo(() => [...(displayConsultations || [])].sort((a, b) => {
		let aValue: any;
		let bValue: any;

			const orderByStr = String(orderBy);
			if (orderByStr === 'createdBy') {
				// For createdBy sorting, use nested property
				const aCreatedBy = typeof a.createdBy === 'object' ? `${a.createdBy?.firstName || ''} ${a.createdBy?.lastName || ''}`.trim() : 'N/A';
				const bCreatedBy = typeof b.createdBy === 'object' ? `${b.createdBy?.firstName || ''} ${b.createdBy?.lastName || ''}`.trim() : 'N/A';
				aValue = aCreatedBy || 'N/A';
				bValue = bCreatedBy || 'N/A';
			} else if (orderByStr.includes('.')) {
				aValue = getNestedValue(a, orderByStr);
				bValue = getNestedValue(b, orderByStr);
			} else {
				aValue = (a as any)[orderByStr] ?? '';
				bValue = (b as any)[orderByStr] ?? '';
			}

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			}
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}), [displayConsultations, orderBy, order]);
	const paginatedConsultations = sortedConsultations;

	// Modal states
	const [isConsultationCreateModalOpen, setIsConsultationCreateModalOpen] = useState<boolean>(false);
	const [consultationToDelete, setConsultationToDelete] = useState<Consultation | null>(null);

	// Form states
	const [singleConsultation, setSingleConsultation] = useState<Partial<Consultation> | null>(null);
	const [GBP, setGBP] = useState<ConsultationPrice>({ currency: 'gbp', amount: '' });
	const [USD, setUSD] = useState<ConsultationPrice>({ currency: 'usd', amount: '' });
	const [EUR, setEUR] = useState<ConsultationPrice>({ currency: 'eur', amount: '' });
	const [TRY, setTRY] = useState<ConsultationPrice>({ currency: 'try', amount: '' });
	const [isCreating, setIsCreating] = useState<boolean>(false);

	// Snackbar states for delete operation
	const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
	const [snackbarMessage, setSnackbarMessage] = useState<string>('');
	const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

	const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

	// Enable fetch on mount
	useEffect(() => {
		enableConsultationsFetch();
	}, [enableConsultationsFetch]);

	const openNewConsultationModal = () => {
		setSingleConsultation({
			title: '',
			description: '',
			prices: [],
		});
		setIsConsultationCreateModalOpen(true);
	};

	const closeNewConsultationModal = () => {
		setIsConsultationCreateModalOpen(false);
		resetForm();
	};

	const resetForm = () => {
		setSingleConsultation(null);
		setGBP({ currency: 'gbp', amount: '' });
		setUSD({ currency: 'usd', amount: '' });
		setEUR({ currency: 'eur', amount: '' });
		setTRY({ currency: 'try', amount: '' });
		setIsCreating(false);
	};

	const createConsultation = async (): Promise<boolean> => {
		if (!singleConsultation?.title || !singleConsultation?.description) {
			return false;
		}

		// Check if all prices are empty (free consultation)
		const isFree = !GBP.amount && !USD.amount && !EUR.amount && !TRY.amount;

		let prices: ConsultationPrice[];
		if (isFree) {
			// For free consultations, send empty strings for all currencies
			prices = [
				{ currency: 'gbp', amount: '' },
				{ currency: 'usd', amount: '' },
				{ currency: 'eur', amount: '' },
				{ currency: 'try', amount: '' },
			];
		} else {
			// For paid consultations, filter out empty prices
			prices = [
				{ currency: 'gbp', amount: GBP.amount },
				{ currency: 'usd', amount: USD.amount },
				{ currency: 'eur', amount: EUR.amount },
				{ currency: 'try', amount: TRY.amount },
			].filter((p) => p.amount && parseFloat(p.amount) >= 0);

			if (prices.length === 0) {
				return false;
			}
		}

		setIsCreating(true);

		try {
			const consultationResponse = await axios.post(`${base_url}/consultations`, {
				title: singleConsultation.title.trim(),
				description: singleConsultation.description.trim(),
				prices,
			});

			const consultationResponseData = consultationResponse.data;

			if (consultationResponseData.status === 201) {
				addNewConsultation(consultationResponseData.data as Consultation);
				setSnackbarMessage('Consultation created successfully');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
				return true;
			}
			closeNewConsultationModal()

			return false;
		} catch (error: any) {
			console.error('Create consultation error:', error);
			setSnackbarMessage(error.response?.data?.message || 'Failed to create consultation');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
			closeNewConsultationModal()
			return false;
		} finally {
			setIsCreating(false);
			closeNewConsultationModal()
		}
	};

	const openDeleteConsultationModal = (consultation: Consultation) => {
		setConsultationToDelete(consultation);
	};

	const closeDeleteConsultationModal = () => {
		setConsultationToDelete(null);
	};

	const deleteConsultation = async (id: string) => {
		try {
			const response = await axios.delete(`${base_url}/consultations/${id}`);
			if (response.data.status === 200) {
				removeConsultation(id);
				setSnackbarMessage('Consultation deleted successfully. Related appointments and payments preserved for historical records.');
				setSnackbarSeverity('success');
				setSnackbarOpen(true);
			}
		} catch (error: any) {
			console.error('Error deleting consultation:', error);
			setSnackbarMessage(error.response?.data?.message || 'Failed to delete consultation');
			setSnackbarSeverity('error');
			setSnackbarOpen(true);
		}
	};


	const openConsultationInfoModal = (consultation: Consultation) => {
		setSelectedConsultation(consultation);
	};

	const closeConsultationInfoModal = () => {
		setSelectedConsultation(null);
	};


	// Responsive column configuration
	const getColumns = () => {
		return [
			{ key: 'title', label: 'Title' },
			{ key: 'isActive', label: 'Status' },
			{ key: 'actions', label: 'Actions' },
		]

	};

	// Show skeleton on initial load when we have no data yet (consultations is [] so !consultations is false; use length)
	if (loading && (!consultations || consultations.length === 0)) {
		return (
			<AdminPageErrorBoundary pageName='Consultations'>
				<DashboardPagesLayout pageName='Consultations' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
					<AdminTableSkeleton />
				</DashboardPagesLayout>
			</AdminPageErrorBoundary>
		);
	}

	if (error) {
		return (
			<AdminPageErrorBoundary pageName='Consultations'>
				<DashboardPagesLayout pageName='Consultations' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
					<CustomInfoMessageAlignedLeft message={error} sx={{ marginTop: '5rem' }} />
				</DashboardPagesLayout>
			</AdminPageErrorBoundary>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Consultations'>
			<DashboardPagesLayout pageName='Consultations' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', height: '100%' }}>
					<FilterSearchRow
						filterValue={filterValue}
						onFilterChange={handleFilterChange}
						filterOptions={[
							{ value: '', label: 'All Consultations' },
							{ value: 'active consultations', label: 'Active Consultations' },
							{ value: 'inactive consultations', label: 'Inactive Consultations' },
						]}
						filterPlaceholder='Filter Consultations'
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						onSearch={handleSearch}
						onReset={resetAll}
						searchPlaceholder='Search in title, description, tags'
						isSearchLoading={isSearchLoading}
						isSearchActive={isSearchActive}
						searchResultsTotalItems={searchResultsTotalItems}
						totalItems={totalItems || consultations?.length || 0}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
						actionButtons={[
							{
								label: 'New Consultation',
								onClick: openNewConsultationModal,
							},
						]}
						isSticky={true}
					/>

					{isConsultationCreateModalOpen && (
						<CreateConsultationDialog
							isOpen={isConsultationCreateModalOpen}
							onClose={closeNewConsultationModal}
							onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
								e.preventDefault();
								const success = await createConsultation();
								if (success) {
									resetForm();
								}
							}}
							singleConsultation={singleConsultation}
							setSingleConsultation={setSingleConsultation}
							GBP={GBP}
							setGBP={setGBP}
							USD={USD}
							setUSD={setUSD}
							EUR={EUR}
							setEUR={setEUR}
							TRY={TRY}
							setTRY={setTRY}
							isCreating={isCreating}
						/>
					)}

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
									padding: '1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableHead-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								'& .MuiTableBody-root .MuiTableCell-root': {
									padding: '0.75rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableBody-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
							}}
							size='small'
							aria-label='consultations table'>
							<TableBody>
								{/* Spacer row to ensure header alignment */}
								<TableRow sx={{ height: 0, visibility: 'hidden' }}>
									{getColumns().map((_, idx) => (
										<TableCell key={idx} sx={{ padding: 0, border: 'none' }} />
									))}
								</TableRow>
							</TableBody>
							<CustomTableHead<Consultation>
								orderBy={orderBy as keyof Consultation}
								order={order}
								handleSort={(property: keyof Consultation) => handleSort(property as string)}
								columns={getColumns()}
							/>
							<TableBody>
								{paginatedConsultations &&
									paginatedConsultations?.map((consultation: Consultation) => {
										return (
											<TableRow key={consultation._id} hover>
												<CustomTableCell value={consultation?.title} />
												<CustomTableCell value={consultation.isActive ? 'Active' : 'Inactive'} />

												<TableCell
													sx={{
														textAlign: 'center',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														gap: '0.5rem',
													}}>
													<CustomActionBtn
														title='Edit'
														onClick={() => {
															navigate(`/admin/consultation-edit/consultation/${consultation._id}`);
														}}
														icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: isMobileSize ? '0rem' : '-0.5rem' }} />}
													/>

													{/* Show delete button only for owner */}
													{(isOwner || isSuperAdmin) && (
														<CustomActionBtn
															title='Delete'
															onClick={() => {
																openDeleteConsultationModal(consultation);
															}}
															icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, mr: isMobileSize ? '0rem' : '-0.5rem' }} />}
														/>
													)}
													<CustomActionBtn
														title='More Info'
														onClick={() => {
															openConsultationInfoModal(consultation);
														}}
														icon={<Info fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>
												</TableCell>
											</TableRow>
										);
									})}
							</TableBody>
						</Table>
						{displayConsultations && displayConsultations.length === 0 && (
							<CustomInfoMessageAlignedLeft
								message={isSearchActive ? 'No consultations found matching your search criteria.' : 'No consultations found.'}
								sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
							/>
						)}
						{isMobileSize && !(displayConsultations && displayConsultations.length === 0) && (
							<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
						)}
						<CustomTablePagination count={consultationsNumberOfPages} page={consultationsCurrentPage} onChange={handlePageChange} />
					</Box>

					{/* Delete Modal - Only shown for owner */}
					{isOwner && consultationToDelete && (
						<CustomDialog openModal={true} closeModal={closeDeleteConsultationModal} title='Delete Consultation' maxWidth='xs'>
							<DialogContent>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
									Are you sure you want to delete "{consultationToDelete.title}"?
								</Typography>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>
									This action will permanently delete:
								</Typography>
								<Typography variant='body2' component='ul' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '0.5rem', pl: '1.5rem' }}>
									<li>The consultation itself</li>
									<li>All consultation slots</li>
									<li>All availability records</li>
								</Typography>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem', color: 'info.main' }}>
									The following will be preserved for historical records:
								</Typography>
								<Typography variant='body2' component='ul' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '0.5rem', pl: '1.5rem', color: 'info.main' }}>
									<li>All appointment records (including client data, dates, consultants, notes)</li>
									<li>All payment records (for accounting and audit purposes)</li>
								</Typography>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem', fontWeight: 'bold', color: 'error.main' }}>
									This action cannot be undone.
								</Typography>
							</DialogContent>
							<CustomDialogActions
								onCancel={closeDeleteConsultationModal}
								deleteBtn={true}
								onDelete={async () => {
									await deleteConsultation(consultationToDelete._id);
									closeDeleteConsultationModal();
								}}
								actionSx={{ mb: '0.5rem' }}
							/>
						</CustomDialog>
					)}

					{/* Consultation Details Modal */}
					{selectedConsultation && (
						<ConsultationDetailsModal
							consultation={selectedConsultation}
							isConsultationInfoDialogOpen={true}
							setIsConsultationInfoDialogOpen={closeConsultationInfoModal}
						/>
					)}

					{/* Consultation operation snackbar */}
					<Snackbar
						open={snackbarOpen}
						autoHideDuration={4000}
						anchorOrigin={{ vertical, horizontal }}
						sx={{ mt: '4rem' }}
						onClose={() => setSnackbarOpen(false)}>
						<Alert
							onClose={() => setSnackbarOpen(false)}
							severity={snackbarSeverity}
							sx={{
								'width': isMobileSize ? '60%' : '100%',
								'backgroundColor': theme.bgColor?.greenSecondary,
								'color': theme.textColor?.common.main,
								'fontSize': isMobileSize ? '0.75rem' : undefined,
								'& .MuiAlert-icon': { color: 'white' },
							}}>
							{snackbarMessage}
						</Alert>
					</Snackbar>
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminConsultations;
