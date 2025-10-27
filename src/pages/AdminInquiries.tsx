import { Box, DialogActions, DialogContent, TableCell } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import DownloadIcon from '@mui/icons-material/Download';
import { Typography, Table, TableBody, TableRow } from '@mui/material';
import { useContext, useState, useEffect } from 'react';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { InquiriesContext } from '../contexts/InquiriesContextProvider';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { Inquiry } from '../interfaces/inquiry';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { dateFormatter, dateTimeFormatter } from '@utils/dateFormatter';
import { Delete, Visibility } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import axios from '@utils/axiosInstance';
import { useDashboardSync } from '../utils/dashboardSync';
import { truncateText } from '@utils/utilText';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import EmailSender from '../components/EmailSender';
import EmailIcon from '@mui/icons-material/Email';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import theme from '../themes';

// Responsive column configuration
const getColumns = (isVerySmallScreen: boolean) => {
	return isVerySmallScreen
		? [
				{ key: 'firstName', label: 'Name' },
				{ key: 'email', label: 'Email' },
				{ key: 'createdAt', label: 'Date' },
				{ key: 'actions', label: 'Actions' },
			]
		: [
				{ key: 'firstName', label: 'Name' },
				{ key: 'email', label: 'Email' },
				{ key: 'phone', label: 'Phone' },
				{ key: 'countryCode', label: 'Country' },
				{ key: 'message', label: 'Message' },
				{ key: 'createdAt', label: 'Date' },
				{ key: 'actions', label: 'Actions' },
			];
};

const AdminInquiries = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isSmallScreen, isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const { inquiries, loading, error, removeInquiry, fetchMoreInquiries, totalItems, loadedPages, setInquiriesPageNumber, enableInquiriesFetch } =
		useContext(InquiriesContext);
	const { orgId } = useContext(OrganisationContext);
	const { refreshDashboard } = useDashboardSync();

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayInquiries,
		numberOfPages: inquiriesNumberOfPages,
		currentPage: inquiriesCurrentPage,
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
	} = useFilterSearch<Inquiry>({
		getEndpoint: () => `${base_url}/inquiries/organisation/${orgId}`,
		limit: 200,
		pageSize,
		contextData: inquiries,
		setContextPageNumber: setInquiriesPageNumber,
		fetchMoreContextData: fetchMoreInquiries,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'createdAt',
		defaultOrder: 'desc',
	});

	// Use appropriate page number for pagination
	const sortedInquiries =
		[...(displayInquiries || [])]?.sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		}) || [];

	const paginatedInquiries = sortedInquiries;

	// Modal states
	const [viewModalOpen, setViewModalOpen] = useState<{ [key: number]: boolean }>({});
	const [deleteModalOpen, setDeleteModalOpen] = useState<{ [key: number]: boolean }>({});
	const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
	const [emailDialogOpen, setEmailDialogOpen] = useState(false);

	useEffect(() => {
		setInquiriesPageNumber(1);
		enableInquiriesFetch(); // 👈 Enable inquiries fetching when component mounts
	}, []);

	const handleViewInquiry = (index: number, inquiry: Inquiry) => {
		setSelectedInquiry(inquiry);
		setViewModalOpen((prev) => ({ ...prev, [index]: true }));
	};

	const handleCloseViewModal = (index: number) => {
		setViewModalOpen((prev) => ({ ...prev, [index]: false }));
		setSelectedInquiry(null);
	};

	const handleDeleteInquiry = (index: number, inquiry: Inquiry) => {
		setSelectedInquiry(inquiry);
		setDeleteModalOpen((prev) => ({ ...prev, [index]: true }));
	};

	const handleCloseDeleteModal = (index: number) => {
		setDeleteModalOpen((prev) => ({ ...prev, [index]: false }));
		setSelectedInquiry(null);
	};

	const handleConfirmDelete = async () => {
		if (!selectedInquiry) return;

		try {
			await axios.delete(`${base_url}/inquiries/${selectedInquiry._id}`);
			removeInquiry(selectedInquiry._id);

			// If search is active, remove from search results; otherwise context data is already updated
			if (isSearchActive) {
				removeFromSearchResults(selectedInquiry._id);
			}

			// Refresh dashboard to update inquiry count
			refreshDashboard();

			// Close all modals
			setDeleteModalOpen({});
			setViewModalOpen({});
			setSelectedInquiry(null);
		} catch (error) {
			console.error('Error deleting inquiry:', error);
		}
	};

	const handleDownload = async () => {
		try {
			let dataToExport: Inquiry[];

			if (isSearchActive) {
				// If search is active, use the search results (already filtered)
				dataToExport = displayInquiries || [];
			} else {
				// First, get the total count to know how many pages we need
				const countResponse = await axios.get(`${base_url}/inquiries/organisation/${orgId}?page=1&limit=1`);
				const totalItems = countResponse.data.totalItems;

				// Calculate how many pages we need to fetch all data
				const itemsPerPage = 1000; // Fetch 1000 per page
				const totalPages = Math.ceil(totalItems / itemsPerPage);

				// Fetch all pages
				let allInquiries: Inquiry[] = [];
				for (let page = 1; page <= totalPages; page++) {
					const response = await axios.get(`${base_url}/inquiries/organisation/${orgId}?page=${page}&limit=${itemsPerPage}`);
					allInquiries = [...allInquiries, ...response.data.data];
				}

				dataToExport = allInquiries;
			}

			const excelData = dataToExport?.map((inquiry: Inquiry) => ({
				'First Name': inquiry.firstName,
				'Last Name': inquiry.lastName,
				'Email': inquiry.email,
				'Phone': inquiry.phone,
				'Country': inquiry.countryCode,
				'Message': inquiry.message || '',
				'Submitted At': format(new Date(inquiry.createdAt), 'yyyy-MM-dd HH:mm:ss'),
			}));

			const ws = XLSX.utils.json_to_sheet(excelData);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'Inquiries');
			XLSX.writeFile(wb, `Inquiries-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
		} catch (error) {
			console.error('Download error:', error);
		}
	};

	if (error) return <Typography color='error'>{error}</Typography>;

	// Show loading state while inquiries are being fetched or when data is empty and not loading yet
	if (loading) {
		return (
			<DashboardPagesLayout pageName='Inquiries' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={5} />
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Inquiries'>
			<DashboardPagesLayout pageName='Inquiries' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', height: '100%' }}>
					<FilterSearchRow
						filterValue={filterValue}
						onFilterChange={handleFilterChange}
						filterOptions={[
							{ value: '', label: 'All Inquiries' },
							{ value: 'from home page', label: 'From Home Page' },
							{ value: 'from contact us', label: 'From Contact Us' },
							{ value: 'from about us', label: 'From About Us' },
						]}
						filterPlaceholder='Filter Inquiries'
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						onSearch={handleSearch}
						onReset={resetAll}
						searchPlaceholder='Search in Name, Email, Message'
						isSearchLoading={isSearchLoading}
						isSearchActive={isSearchActive}
						searchResultsTotalItems={searchResultsTotalItems}
						totalItems={totalItems || inquiries?.length || 0}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
						actionButtons={[
							{
								label: isMobileSize ? 'Download' : `Download ${isSearchActive ? 'Filtered' : 'All'} Inquiries`,
								onClick: handleDownload,
								startIcon: !isMobileSize ? <DownloadIcon /> : undefined,
								disabled: displayInquiries && displayInquiries.length === 0,
							},
							{
								label: isMobileSize ? 'Email' : 'Send Bulk Email',
								onClick: () => setEmailDialogOpen(true),
								startIcon: !isMobileSize ? <EmailIcon /> : undefined,
							},
						]}
						isSticky={true}
					/>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 0rem 2rem 0rem',
							width: '100%',
						}}>
						<Table
							sx={{
								'mb': '2rem',
								'tableLayout': 'fixed',
								'width': '100%',
								'& .MuiTableHead-root': {
									position: 'fixed',
									top:
										(isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim())
											? !isMobileSize
												? '10rem'
												: '12rem'
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
									padding: '0.25rem 1rem',
								},
								'& .MuiTableBody-root .MuiTableCell-root': {
									padding: '0.5rem 1rem',
									boxSizing: 'border-box',
								},
							}}
							size='small'
							aria-label='a dense table'>
							<CustomTableHead<Inquiry>
								orderBy={orderBy as keyof Inquiry}
								order={order}
								handleSort={(property: keyof Inquiry) => handleSort(property as string)}
								columns={getColumns(isVerySmallScreen)}
							/>
							<TableBody>
								{paginatedInquiries &&
									paginatedInquiries?.map((inquiry: Inquiry, index) => {
										return (
											<TableRow key={inquiry._id} hover>
												<CustomTableCell value={inquiry.firstName + ' ' + inquiry.lastName} />
												<CustomTableCell value={inquiry.email} />
												{!isVerySmallScreen && <CustomTableCell value={inquiry.phone} />}
												{!isVerySmallScreen && <CustomTableCell value={inquiry.countryCode} />}
												{!isVerySmallScreen && <CustomTableCell value={truncateText(inquiry.message || '', 25)} />}
												<CustomTableCell value={dateFormatter(inquiry.createdAt)} />
												<TableCell
													sx={{
														textAlign: 'center',
													}}>
													<CustomActionBtn
														title='View'
														onClick={() => handleViewInquiry(index, inquiry)}
														icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>

													<CustomDialog
														openModal={viewModalOpen[index]}
														closeModal={() => handleCloseViewModal(index)}
														maxWidth='sm'
														title='Inquiry Details'>
														{selectedInquiry && (
															<DialogContent>
																<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
																	<Box>
																		<Typography variant='body2' sx={{ mb: '0.75rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																			<strong>Name:</strong> {selectedInquiry.firstName} {selectedInquiry.lastName}
																		</Typography>
																		<Typography variant='body2' sx={{ mb: '0.75rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																			<strong>Phone:</strong> {selectedInquiry.phone}
																		</Typography>
																	</Box>
																	<Box>
																		<Typography variant='body2' sx={{ mb: '0.75rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																			<strong>Email:</strong> {selectedInquiry.email}
																		</Typography>
																		<Typography variant='body2' sx={{ mb: '0.75rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																			<strong>Country:</strong> {selectedInquiry.countryCode}
																		</Typography>
																	</Box>
																</Box>
																<Typography variant='body2' sx={{ mb: '0.75rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																	<strong>Message:</strong> {selectedInquiry.message || '-'}
																</Typography>
																<Typography variant='body2' sx={{ mb: '0.75rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																	<strong>Submitted:</strong> {dateTimeFormatter(selectedInquiry.createdAt)}
																</Typography>
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																	<strong>From:</strong>{' '}
																	{selectedInquiry.category === 'HeroSection'
																		? 'Home Page'
																		: selectedInquiry.category === 'ContactUs'
																			? 'Contact Us'
																			: 'About Us'}
																</Typography>
															</DialogContent>
														)}
														<DialogActions>
															<CustomCancelButton
																onClick={() => handleCloseViewModal(index)}
																sx={{
																	margin: '0 1rem 1rem 0',
																}}>
																Cancel
															</CustomCancelButton>
														</DialogActions>
													</CustomDialog>

													<CustomActionBtn
														title='Delete'
														onClick={() => handleDeleteInquiry(index, inquiry)}
														icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>

													<CustomDialog
														openModal={deleteModalOpen[index]}
														closeModal={() => handleCloseDeleteModal(index)}
														title='Delete Inquiry'
														content={`Are you sure you want to delete "${truncateText(selectedInquiry?.message || '', 25)}"? This action cannot be undone.`}
														maxWidth='xs'>
														<CustomDialogActions
															onCancel={() => handleCloseDeleteModal(index)}
															deleteBtn={true}
															onDelete={handleConfirmDelete}
															actionSx={{ mb: '0.5rem' }}
														/>
													</CustomDialog>
												</TableCell>
											</TableRow>
										);
									})}
							</TableBody>
						</Table>
						{displayInquiries && displayInquiries.length === 0 && (
							<CustomInfoMessageAlignedLeft
								message={isSearchActive ? 'No inquiries found matching your search criteria.' : 'No inquiries found.'}
								sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
							/>
						)}
						{isMobileSize && !(displayInquiries && displayInquiries.length === 0) && (
							<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
						)}
						<CustomTablePagination count={inquiriesNumberOfPages} page={inquiriesCurrentPage} onChange={handlePageChange} />
					</Box>
				</Box>
				<CustomDialog openModal={emailDialogOpen} closeModal={() => setEmailDialogOpen(false)} maxWidth='md' title='Send Bulk Email'>
					<DialogContent>
						<EmailSender setEmailDialogOpen={setEmailDialogOpen} />
					</DialogContent>
				</CustomDialog>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminInquiries;
