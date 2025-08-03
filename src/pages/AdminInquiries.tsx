import { Box, DialogActions, DialogContent, FormControl, InputAdornment, MenuItem, Select, TableCell } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
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
import { Delete, Search, Visibility } from '@mui/icons-material';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import axios from '@utils/axiosInstance';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { truncateText } from '@utils/utilText';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import theme from '../themes';
import EmailSender from '../components/EmailSender';
import EmailIcon from '@mui/icons-material/Email';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';

const columns = [
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'country', label: 'Country' },
	{ key: 'message', label: 'Message' },
	{ key: 'date', label: 'Date' },
	{ key: 'actions', label: 'Actions' },
];

const AdminInquiries = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const {
		inquiries,
		loading,
		error,
		removeInquiry,
		fetchInquiries,
		fetchMoreInquiries,
		totalItems,
		loadedPages,
		inquiriesPageNumber,
		setInquiriesPageNumber,
	} = useContext(InquiriesContext);
	const { orgId } = useContext(OrganisationContext);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<Inquiry[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);

	const pageSize = 100;

	// Use search results if active, otherwise use context data
	const displayInquiries = isSearchActive ? searchResults : inquiries;

	// For pagination, use total items from server when not searching
	const inquiriesNumberOfPages = isSearchActive ? Math.ceil(displayInquiries.length / pageSize) : Math.ceil(totalItems / pageSize);

	const paginatedInquiries = displayInquiries.slice((inquiriesPageNumber - 1) * pageSize, inquiriesPageNumber * pageSize);

	const [orderBy, setOrderBy] = useState<keyof Inquiry>('createdAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	// Modal states
	const [viewModalOpen, setViewModalOpen] = useState<{ [key: number]: boolean }>({});
	const [deleteModalOpen, setDeleteModalOpen] = useState<{ [key: number]: boolean }>({});
	const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
	const [emailDialogOpen, setEmailDialogOpen] = useState(false);

	useEffect(() => {
		fetchInquiries(1); // Always fetch initial data
	}, []); // Only on mount

	const handlePageChange = async (newPage: number) => {
		setInquiriesPageNumber(newPage);

		// Check if we need to fetch more data
		const requiredRecords = newPage * pageSize;
		if (inquiries.length < requiredRecords && newPage <= inquiriesNumberOfPages) {
			// Calculate which batch of 1000 records we need (context fetches 1000 at a time)
			const startBatch = Math.floor(((newPage - 1) * pageSize) / 1000) + 1;
			const endBatch = Math.ceil((newPage * pageSize) / 1000);

			// Check if we already have the required batches loaded
			const batchesNeeded = [];
			for (let batch = startBatch; batch <= endBatch; batch++) {
				if (!loadedPages.includes(batch)) {
					batchesNeeded.push(batch);
				}
			}

			if (batchesNeeded.length > 0) {
				await fetchMoreInquiries(startBatch, endBatch);
			}
		}
	};

	const handleSort = (property: keyof Inquiry) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

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
				dataToExport = searchResults;
			} else {
				// First, get the total count to know how many pages we need
				const countResponse = await axios.get(`${base_url}/inquiries/organisation/${orgId}?page=1&limit=1`);
				const totalItems = countResponse.data.pagination.totalItems;

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

			const excelData = dataToExport.map((inquiry: Inquiry) => ({
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

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setInquiriesPageNumber(1);

			// Make API call to search entire database
			if (searchValue || filterValue) {
				// Build query parameters
				const params = new URLSearchParams({
					page: '1',
					limit: '1500',
				});

				if (searchValue && searchValue.trim()) {
					params.append('search', searchValue.trim());
				}
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
				}
				if (orderBy) {
					params.append('sortBy', orderBy);
				}
				if (order) {
					params.append('sortOrder', order);
				}

				const response = await axios.get(`${base_url}/inquiries/organisation/${orgId}?${params.toString()}`);
				setSearchResults(response.data.data);
				setIsSearchActive(true);
			} else {
				// If no search/filter, clear search results
				setSearchResults([]);
				setIsSearchActive(false);
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	if (loading) return <Typography>Loading...</Typography>;
	if (error) return <Typography color='error'>{error}</Typography>;

	return (
		<DashboardPagesLayout pageName='Inquiries' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ width: '100%', height: '100%' }}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
						width: '100%',
						mb: '1.25rem',
					}}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', flex: 4 }}>
						<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
							<Box sx={{ mr: '1rem' }}>
								<FormControl>
									<Select
										size='small'
										value={filterValue}
										onChange={(e) => {
											setFilterValue(e.target.value);
										}}
										displayEmpty
										sx={{
											backgroundColor: theme.bgColor?.common,
											width: isMobileSizeSmall ? '7rem' : '10rem',
											fontSize: isMobileSize ? '0.7rem' : '0.85rem',
											textTransform: 'capitalize',
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
											Filter Inquiries
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
											All Inquiries
										</MenuItem>
										{['From Home Page', 'From Contact Us', 'From About Us'].map((type) => (
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
								placeholder={'Search in name, email, message'}
								onChange={(e) => {
									setSearchValue(e.target.value);
								}}
								sx={{ backgroundColor: '#fff', minWidth: isVerySmallScreen ? '10rem' : '17.5rem' }}
								required={false}
								InputProps={{
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
							<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue && !filterValue}>
								Search
							</CustomSubmitButton>
							<CustomDeleteButton
								onClick={() => {
									setSearchValue('');
									setFilterValue('');
									setSearchResults([]);
									setIsSearchActive(false);
									setInquiriesPageNumber(1);
								}}>
								Reset
							</CustomDeleteButton>
						</Box>
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem', alignItems: 'center' }}>
						{isSearchActive && (
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									mr: 1,
								}}>
								{searchResults.length} results
							</Typography>
						)}
						<CustomSubmitButton
							startIcon={<DownloadIcon />}
							onClick={handleDownload}
							sx={{
								fontSize: isMobileSize ? '0.7rem' : undefined,
							}}
							disabled={displayInquiries.length === 0}>
							Download {isSearchActive ? 'Filtered' : 'All'} Inquiries
						</CustomSubmitButton>
						<CustomSubmitButton
							startIcon={<EmailIcon />}
							onClick={() => setEmailDialogOpen(true)}
							sx={{
								fontSize: isMobileSize ? '0.7rem' : undefined,
								width: 'fit-content',
							}}>
							Send Bulk Email
						</CustomSubmitButton>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
						width: '100%',
					}}>
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<Inquiry> orderBy={orderBy} order={order} handleSort={handleSort} columns={columns} />
						<TableBody>
							{paginatedInquiries &&
								paginatedInquiries?.map((inquiry: Inquiry, index) => {
									return (
										<TableRow key={inquiry._id}>
											<CustomTableCell value={inquiry.firstName + ' ' + inquiry.lastName} />
											<CustomTableCell value={inquiry.email} />
											<CustomTableCell value={inquiry.phone} />
											<CustomTableCell value={inquiry.countryCode} />
											<CustomTableCell value={truncateText(inquiry.message || '', 25)} />
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
																	<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																		<strong>Name:</strong> {selectedInquiry.firstName} {selectedInquiry.lastName}
																	</Typography>
																	<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																		<strong>Phone:</strong> {selectedInquiry.phone}
																	</Typography>
																</Box>
																<Box>
																	<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																		<strong>Email:</strong> {selectedInquiry.email}
																	</Typography>
																	<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																		<strong>Country:</strong> {selectedInquiry.countryCode}
																	</Typography>
																</Box>
															</Box>
															<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																<strong>Message:</strong> {selectedInquiry.message || '-'}
															</Typography>
															<Typography variant='body2' sx={{ mb: '0.75rem' }}>
																<strong>Submitted:</strong> {dateTimeFormatter(selectedInquiry.createdAt)}
															</Typography>
															<Typography variant='body2'>
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
													content='Are you sure you want to delete this inquiry?'
													maxWidth='sm'>
													<CustomDialogActions onCancel={() => handleCloseDeleteModal(index)} deleteBtn={true} onDelete={handleConfirmDelete} />
												</CustomDialog>
											</TableCell>
										</TableRow>
									);
								})}
						</TableBody>
					</Table>
					<CustomTablePagination count={inquiriesNumberOfPages} page={inquiriesPageNumber} onChange={handlePageChange} />
				</Box>
			</Box>
			<CustomDialog openModal={emailDialogOpen} closeModal={() => setEmailDialogOpen(false)} maxWidth='md' title='Send Bulk Email'>
				<DialogContent>
					<EmailSender setEmailDialogOpen={setEmailDialogOpen} />
				</DialogContent>
			</CustomDialog>
		</DashboardPagesLayout>
	);
};

export default AdminInquiries;
