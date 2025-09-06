import { Box, DialogActions, DialogContent, FormControl, InputAdornment, MenuItem, Select, TableCell, Chip } from '@mui/material';
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
	{ key: 'firstName', label: 'Name' },
	{ key: 'email', label: 'Email' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'countryCode', label: 'Country' },
	{ key: 'message', label: 'Message' },
	{ key: 'createdAt', label: 'Date' },
	{ key: 'actions', label: 'Actions' },
];

const AdminInquiries = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const { inquiries, error, removeInquiry, fetchMoreInquiries, sortInquiries, totalItems, loadedPages, inquiriesPageNumber, setInquiriesPageNumber } =
		useContext(InquiriesContext);
	const { orgId } = useContext(OrganisationContext);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<Inquiry[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	const [orderBy, setOrderBy] = useState<keyof Inquiry>('createdAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displayInquiries = isSearchActive ? searchResults : inquiries;

	// For pagination, use total items from server when not searching
	const inquiriesNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : inquiriesPageNumber;
	const sortedInquiries =
		[...(displayInquiries || [])]?.sort((a, b) => {
			const aValue = a[orderBy] ?? '';
			const bValue = b[orderBy] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		}) || [];

	const paginatedInquiries = sortedInquiries?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	// Modal states
	const [viewModalOpen, setViewModalOpen] = useState<{ [key: number]: boolean }>({});
	const [deleteModalOpen, setDeleteModalOpen] = useState<{ [key: number]: boolean }>({});
	const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
	const [emailDialogOpen, setEmailDialogOpen] = useState(false);

	useEffect(() => {
		setInquiriesPageNumber(1);
	}, []);

	const handlePageChange = async (newPage: number) => {
		// Set appropriate page number based on search state
		if (isSearchActive) {
			setSearchResultsPage(newPage);
		} else {
			setInquiriesPageNumber(newPage);
		}

		// If in search mode, handle search results pagination
		if (isSearchActive) {
			// Check if we need to fetch more search results
			const requiredRecords = newPage * pageSize;
			if (searchResults.length < requiredRecords) {
				// Build search parameters
				const params = new URLSearchParams({
					limit: '300',
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

				// Calculate which pages we need to fetch
				const currentLoadedPages = searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 300);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages?.includes(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (inquiries.length < requiredRecords && newPage <= inquiriesNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 300);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMoreInquiries(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

	const handleSort = (property: keyof Inquiry) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortInquiries(property, isAsc ? 'desc' : 'asc');
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

			// If search is active, also remove from search results
			if (isSearchActive) {
				setSearchResults((prev) => prev?.filter((inquiry) => inquiry._id !== selectedInquiry._id) || []);
				setSearchResultsTotalItems((prev) => Math.max(0, prev - 1));
			}

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

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setInquiriesPageNumber(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				// Store the searched value
				setSearchedValue(searchValue.trim());
				// Build query parameters
				const params = new URLSearchParams({
					limit: '300',
					search: searchValue.trim(),
				});

				// Add filter if it exists
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
				setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
				setSearchResultsLoadedPages([1]);
				setIsSearchActive(true);
				setSearchButtonClicked(true);
			} else {
				// If no search value, clear search results
				setSearchResults([]);
				setSearchResultsLoadedPages([]);
				setSearchResultsTotalItems(0);
				setIsSearchActive(false);
				setSearchButtonClicked(false);
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const fetchMoreSearchResults = async (page: number, searchParams: URLSearchParams) => {
		try {
			// Add page parameter
			searchParams.set('page', page.toString());

			const response = await axios.get(`${base_url}/inquiries/organisation/${orgId}?${searchParams.toString()}`);

			if (page === 1) {
				// First page - replace all data
				setSearchResults(response.data.data);
				setSearchResultsLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setSearchResults((prev) => {
					const newData = [...prev, ...response.data.data];

					return newData;
				});
				setSearchResultsLoadedPages((prev) => [...prev, page]);
			}

			setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
		} catch (error) {
			console.error('Fetch more search results error:', error);
		}
	};

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
										onChange={async (e) => {
											const newFilterValue = e.target.value;
											setFilterValue(newFilterValue);

											// Auto-search when filter is selected
											if (newFilterValue && newFilterValue.trim()) {
												setInquiriesPageNumber(1);
												setSearchResultsPage(1);
												setIsSearchActive(true);
												setSearchResultsLoadedPages([]);

												try {
													const params = new URLSearchParams({
														limit: '300',
														filter: newFilterValue.trim(),
													});

													// Include existing search value if it exists
													if (searchValue && searchValue.trim()) {
														params.append('search', searchValue.trim());
													}

													if (orderBy) {
														params.append('sortBy', orderBy);
													}
													if (order) {
														params.append('sortOrder', order);
													}

													const response = await axios.get(`${base_url}/inquiries/organisation/${orgId}?${params.toString()}`);
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
												} catch (error) {
													console.error('Filter search error:', error);
												}
											} else {
												// If filter is cleared but search value exists, auto-search with search value
												if (searchValue && searchValue.trim()) {
													setInquiriesPageNumber(1);
													setSearchResultsPage(1);
													setIsSearchActive(true);
													setSearchResultsLoadedPages([]);

													try {
														const params = new URLSearchParams({
															limit: '300',
															search: searchValue.trim(),
														});

														if (orderBy) {
															params.append('sortBy', orderBy);
														}
														if (order) {
															params.append('sortOrder', order);
														}

														const response = await axios.get(`${base_url}/inquiries/organisation/${orgId}?${params.toString()}`);
														setSearchResults(response.data.data);
														setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
														setSearchResultsLoadedPages([1]);
													} catch (error) {
														console.error('Auto-search error:', error);
													}
												} else {
													// If no search value, reset to context data
													setIsSearchActive(false);
													setSearchResults([]);
													setSearchResultsLoadedPages([]);
													setSearchResultsTotalItems(0);
												}
											}
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
										{['From Home Page', 'From Contact Us', 'From About Us']?.map((type) => (
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
								placeholder={'Search in Name, Email, Message'}
								onChange={(e) => {
									setSearchValue(e.target.value);
								}}
								sx={{ backgroundColor: '#fff', minWidth: isVerySmallScreen ? '10rem' : '18rem' }}
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
							<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue}>
								Search
							</CustomSubmitButton>
							<CustomDeleteButton
								onClick={() => {
									setSearchValue('');
									setSearchedValue('');
									setFilterValue('');
									setSearchResults([]);
									setSearchResultsLoadedPages([]);
									setSearchResultsTotalItems(0);
									setIsSearchActive(false);
									setSearchButtonClicked(false);
									setInquiriesPageNumber(1);
									setSearchResultsPage(1);
								}}>
								Reset
							</CustomDeleteButton>
							<Box sx={{ height: '2rem', ml: '1rem', display: 'flex', alignItems: 'center' }}>
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
					</Box>
					<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem', alignItems: 'center' }}>
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
					{((isSearchActive && searchedValue && searchButtonClicked) || (isSearchActive && filterValue && filterValue.trim())) && (
						<Box
							sx={{
								display: 'flex',
								gap: 1,
								flexWrap: 'wrap',
								justifyContent: 'center',
								borderRadius: '4px',
								alignSelf: 'flex-start',
								marginBottom: '1rem',
								marginTop: '-1rem',
							}}>
							{isSearchActive && filterValue && filterValue.trim() && (
								<Chip
									label={`Filter: "${filterValue}"`}
									onDelete={() => {
										setFilterValue('');
										// If search exists, keep search results
										if (searchValue && searchValue.trim()) {
											// Trigger search without filter value
											const params = new URLSearchParams({
												limit: '300',
												search: searchValue.trim(),
											});
											if (orderBy) params.append('sortBy', orderBy);
											if (order) params.append('sortOrder', order);

											axios
												.get(`${base_url}/inquiries/organisation/${orgId}?${params.toString()}`)
												.then((response) => {
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
													setInquiriesPageNumber(1);
													setSearchResultsPage(1);
												})
												.catch((error) => console.error('Search error:', error));
										} else {
											// No search, reset to context data
											setIsSearchActive(false);
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
										}
									}}
									variant='outlined'
									color='secondary'
									size='small'
									sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
								/>
							)}
							{isSearchActive && searchedValue && searchButtonClicked && (
								<Chip
									label={`Search: "${searchedValue}"`}
									onDelete={() => {
										setSearchValue('');
										setSearchedValue('');
										setSearchButtonClicked(false);
										// If filter exists, keep filter results
										if (filterValue && filterValue.trim()) {
											// Trigger filter search without search value
											const params = new URLSearchParams({
												limit: '300',
												filter: filterValue.trim(),
											});
											if (orderBy) params.append('sortBy', orderBy);
											if (order) params.append('sortOrder', order);

											axios
												.get(`${base_url}/inquiries/organisation/${orgId}?${params.toString()}`)
												.then((response) => {
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
													setInquiriesPageNumber(1);
													setSearchResultsPage(1);
												})
												.catch((error) => console.error('Filter search error:', error));
										} else {
											// No filter, reset to context data
											setIsSearchActive(false);
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
										}
									}}
									color='primary'
									variant='filled'
									size='small'
									sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
								/>
							)}
						</Box>
					)}
					<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
						<CustomTableHead<Inquiry> orderBy={orderBy} order={order} handleSort={handleSort} columns={columns} />
						<TableBody>
							{paginatedInquiries &&
								paginatedInquiries?.map((inquiry: Inquiry, index) => {
									return (
										<TableRow key={inquiry._id} hover>
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
					<CustomTablePagination count={inquiriesNumberOfPages} page={currentPage} onChange={handlePageChange} />
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
