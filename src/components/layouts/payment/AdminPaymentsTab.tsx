import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography, Chip } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { PaymentsContext } from '../../../contexts/PaymentsContextProvider';
import { Payment } from '../../../interfaces/payment';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import CustomTablePagination from '../table/CustomTablePagination';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { Search, Visibility } from '@mui/icons-material';
import theme from '../../../themes';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { truncateText } from '../../../utils/utilText';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomActionBtn from '../table/CustomActionBtn';
import PaymentDetailsDialog from './PaymentDetailsDialog';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../../forms/customButtons/CustomDeleteButton';
import DownloadIcon from '@mui/icons-material/Download';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import axios from '@utils/axiosInstance';

const AdminPaymentsTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId, organisation } = useContext(OrganisationContext);

	const { payments, totalItems, loadedPages, paymentsPageNumber, setPaymentsPageNumber, fetchMorePayments } = useContext(PaymentsContext);
	const { courses } = useContext(CoursesContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const mappedCourses: string[] = courses?.map((course) => course.title) || [];

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<Payment[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');
	const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const [orderBy, setOrderBy] = useState<keyof Payment>('createdAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displayPayments = isSearchActive ? searchResults : payments;

	// Calculate total pages based on filtered results when searching, otherwise use total items from server
	const paymentsNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);

	const currentPage = isSearchActive ? searchResultsPage : paymentsPageNumber;

	const sortedPayments = [...(displayPayments || [])]?.sort((a, b) => {
		const aValue = a[orderBy] ?? '';
		const bValue = b[orderBy] ?? '';

		if (order === 'asc') {
			return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
		} else {
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}
	});

	const paginatedPayments = sortedPayments?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	useEffect(() => {
		setPaymentsPageNumber(1);
	}, []);

	const handlePageChange = async (newPage: number) => {
		if (isSearchActive) {
			setSearchResultsPage(newPage);

			// Check if we need to fetch more search results
			const requiredRecords = newPage * pageSize;
			if (searchResults.length < requiredRecords) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages?.includes(page)) {
						await fetchMoreSearchResults(page);
					}
				}
			}
		} else {
			setPaymentsPageNumber(newPage);

			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (payments.length < requiredRecords && newPage <= paymentsNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 200);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMorePayments(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setPaymentsPageNumber(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				// Store the searched value
				setSearchedValue(searchValue.trim());
				// Build query parameters
				const params = new URLSearchParams({
					limit: '200',
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

				const response = await axios.get(`${base_url}/payments/organisation/${orgId}?${params.toString()}`);
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
				setSearchedValue('');
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const fetchMoreSearchResults = async (page: number) => {
		try {
			// Build query parameters
			const params = new URLSearchParams({
				limit: '200',
			});

			if (searchedValue && searchedValue.trim()) {
				params.append('search', searchedValue.trim());
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

			const response = await axios.get(`${base_url}/payments/organisation/${orgId}?${params.toString()}`);

			// Append new data to existing search results
			setSearchResults((prev) => [...prev, ...response.data.data]);
			setSearchResultsLoadedPages((prev) => [...prev, page]);
		} catch (error) {
			console.error('Fetch more search results error:', error);
		}
	};

	const handleSort = (property: keyof Payment) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const handleViewPayment = (payment: Payment) => {
		setSelectedPayment(payment);
		setIsDialogOpen(true);
	};

	// Check if search button should be disabled
	const isSearchDisabled = !searchValue;

	const handleDownloadPayments = async () => {
		try {
			// Build query parameters for download
			const params = new URLSearchParams();
			if (searchValue && isSearchActive) {
				params.append('search', searchValue);
			}
			if (filterValue && isSearchActive) {
				params.append('filter', filterValue);
			}

			const response = await axios.get(`${base_url}/payments/export-excel/${orgId}?${params}`, { responseType: 'blob' });

			// Get filename from Content-Disposition header if available
			let filename = `${organisation?.orgName}_Payments.xlsx`;
			const disposition = response.headers['content-disposition'];
			if (disposition && disposition?.indexOf('filename=') !== -1) {
				filename = disposition.split('filename=')[1].replace(/['"]/g, '').trim();
			}

			// Create a blob URL and trigger download
			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Download error:', error);
		}
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				width: '100%',
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: isMobileSize ? 'center' : 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', width: '100%' }}>
					<Box sx={{ mr: '1rem' }}>
						<FormControl>
							<Select
								size='small'
								value={filterValue}
								onChange={(e) => {
									const newFilterValue = e.target.value;
									setFilterValue(newFilterValue);

									// Auto-search when filter changes
									if (newFilterValue) {
										// Build query parameters
										const params = new URLSearchParams({
											limit: '200',
											filter: newFilterValue,
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

										axios
											.get(`${base_url}/payments/organisation/${orgId}?${params.toString()}`)
											.then((response) => {
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
												setSearchResultsLoadedPages([1]);
												setIsSearchActive(true);
												setSearchResultsPage(1);
											})
											.catch((error) => {
												console.error('Filter error:', error);
											});
									} else {
										// If filter is cleared but search value exists, auto-search with remaining search value
										if (searchValue && searchValue.trim()) {
											const params = new URLSearchParams({
												limit: '200',
												search: searchValue.trim(),
											});
											if (orderBy) {
												params.append('sortBy', orderBy);
											}
											if (order) {
												params.append('sortOrder', order);
											}

											axios
												.get(`${base_url}/payments/organisation/${orgId}?${params.toString()}`)
												.then((response) => {
													setSearchResults(response.data.data);
													setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
													setSearchResultsLoadedPages([1]);
													setIsSearchActive(true);
													setSearchResultsPage(1);
												})
												.catch((error) => {
													console.error('Search error:', error);
												});
										} else {
											// Clear everything and go back to context data
											setSearchResults([]);
											setSearchResultsLoadedPages([]);
											setSearchResultsTotalItems(0);
											setIsSearchActive(false);
											setSearchResultsPage(1);
										}
									}
								}}
								displayEmpty
								sx={{
									backgroundColor: theme.bgColor?.common,
									width: isMobileSizeSmall ? '8rem' : '12rem',
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
									Filter Payments
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
									All Payments
								</MenuItem>
								<MenuItem
									disabled
									value='types'
									selected
									sx={{
										fontSize: isMobileSize ? '0.6rem' : '0.7rem',
										textTransform: 'inherit',
										fontWeight: 'lighter',
										padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
										minHeight: '2rem',
									}}>
									------ Filter by Course ------
								</MenuItem>
								{mappedCourses?.map((course) => (
									<MenuItem
										value={course?.toLowerCase()}
										key={course}
										sx={{
											fontSize: isMobileSize ? '0.65rem' : '0.85rem',
											textTransform: 'capitalize',
											padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
											minHeight: '2rem',
										}}>
										{truncateText(course, 25)}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					<Box sx={{ display: 'flex', width: '65%' }}>
						<CustomTextField
							value={searchValue}
							placeholder={isVerySmallScreen ? 'Search in Username' : 'Search in First & Last Name, and Username'}
							onChange={(e) => {
								setSearchValue(e.target.value);
							}}
							sx={{
								'backgroundColor': '#fff',
								'& .MuiInputBase-input::placeholder': {
									fontSize: '0.75rem', // Change this to your desired font size
								},
							}}
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
						<CustomSubmitButton
							sx={{
								height: isVerySmallScreen ? '1.75rem' : '2rem',
								marginLeft: '0.5rem',
								fontSize: isMobileSize ? '0.7rem' : undefined,
							}}
							type='button'
							disabled={isSearchDisabled}
							onClick={handleSearch}>
							Search
						</CustomSubmitButton>
						<CustomDeleteButton
							sx={{ height: isVerySmallScreen ? '1.75rem' : '2rem', marginLeft: '0.5rem', fontSize: isMobileSize ? '0.7rem' : undefined }}
							type='button'
							onClick={() => {
								setSearchValue('');
								setFilterValue('');
								setSearchResults([]);
								setSearchResultsLoadedPages([]);
								setSearchResultsTotalItems(0);
								setIsSearchActive(false);
								setSearchResultsPage(1);
								setSearchedValue('');
								setSearchButtonClicked(false);
								setPaymentsPageNumber(1);
							}}>
							Reset
						</CustomDeleteButton>
						<Box sx={{ height: '2rem', ml: '1rem', display: 'flex', alignItems: 'center' }}>
							<Typography
								variant='body2'
								sx={{
									color: 'text.secondary',
									fontSize: isMobileSize ? '0.7rem' : '0.85rem',
									whiteSpace: 'nowrap',
								}}>
								{isSearchActive ? searchResultsTotalItems : totalItems}{' '}
								{isSearchActive ? (searchResultsTotalItems === 1 ? 'result' : 'results') : totalItems === 1 ? 'item' : 'items'}
							</Typography>
						</Box>
					</Box>
				</Box>

				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						width: isVerySmallScreen ? '5%' : isMobileSize ? '20%' : '35%',
						height: isVerySmallScreen ? '1.75rem' : '2rem',
						fontSize: isMobileSize ? '0.65rem' : '0.85rem',
						alignItems: 'center',
					}}>
					<CustomSubmitButton
						startIcon={<DownloadIcon />}
						sx={{ fontSize: isMobileSize ? '0.7rem' : undefined, width: 'fit-content' }}
						onClick={handleDownloadPayments}>
						{isSearchActive ? 'Download Filtered Payments' : 'Download All Payments'}
					</CustomSubmitButton>
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '0rem 2rem 2rem 2rem',
					width: '100%',
					mt: '1rem',
				}}>
				{/* Chips for active search and filter */}
				{(searchButtonClicked || filterValue) && (
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
						{filterValue && (
							<Chip
								label={`Filter: "${filterValue}"`}
								onDelete={() => {
									setFilterValue('');
									// If search value exists, auto-search with remaining search value
									if (searchValue && searchValue.trim()) {
										const params = new URLSearchParams({
											limit: '200',
											search: searchValue.trim(),
										});
										if (orderBy) {
											params.append('sortBy', orderBy);
										}
										if (order) {
											params.append('sortOrder', order);
										}

										axios
											.get(`${base_url}/payments/organisation/${orgId}?${params.toString()}`)
											.then((response) => {
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
												setSearchResultsLoadedPages([1]);
												setIsSearchActive(true);
												setSearchResultsPage(1);
											})
											.catch((error) => {
												console.error('Search error:', error);
											});
									} else {
										// Clear everything and go back to context data
										setSearchResults([]);
										setSearchResultsLoadedPages([]);
										setSearchResultsTotalItems(0);
										setIsSearchActive(false);
										setSearchResultsPage(1);
										setSearchedValue('');
										setSearchButtonClicked(false);
									}
								}}
								color='secondary'
								variant='outlined'
								size='small'
								sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
						{searchButtonClicked && searchedValue && (
							<Chip
								label={`Search: "${searchedValue}"`}
								onDelete={() => {
									setSearchValue('');
									setSearchedValue('');
									setSearchButtonClicked(false);
									// If filter is still active, keep filter results
									if (filterValue) {
										// Re-trigger filter search without search value
										const params = new URLSearchParams({
											limit: '200',
											filter: filterValue,
										});
										if (orderBy) {
											params.append('sortBy', orderBy);
										}
										if (order) {
											params.append('sortOrder', order);
										}
										axios
											.get(`${base_url}/payments/organisation/${orgId}?${params.toString()}`)
											.then((response) => {
												setSearchResults(response.data.data);
												setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
												setSearchResultsLoadedPages([1]);
												setIsSearchActive(true);
												setSearchResultsPage(1);
											})
											.catch((error) => {
												console.error('Filter error:', error);
											});
									} else {
										// Clear everything and go back to context data
										setSearchResults([]);
										setSearchResultsLoadedPages([]);
										setSearchResultsTotalItems(0);
										setIsSearchActive(false);
										setSearchResultsPage(1);
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
					<CustomTableHead<Payment>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={
							isVerySmallScreen
								? [
										{ key: 'username', label: 'Username' },
										{ key: 'courseTitle', label: 'Course' },
										{ key: 'amount', label: 'Price' },
										{ key: 'amountReceivedInGbp', label: 'Received' },
										{ key: 'createdAt', label: 'Date' },
									]
								: [
										{ key: 'firstName', label: 'First Name' },
										{ key: 'lastName', label: 'Last Name' },
										{ key: 'courseTitle', label: 'Course' },
										{ key: 'documentName', label: 'Document' },
										{ key: 'amount', label: 'Price' },
										{ key: 'amountReceivedInGbp', label: 'Received' },
										{ key: 'createdAt', label: 'Date' },
										{ key: 'actions', label: 'Actions' },
									]
						}
					/>
					<TableBody>
						{paginatedPayments &&
							paginatedPayments?.map((payment: Payment) => {
								return (
									<TableRow key={payment._id} hover>
										{!isVerySmallScreen && <CustomTableCell value={payment.firstName} />}
										{!isVerySmallScreen && <CustomTableCell value={payment.lastName} />}
										<CustomTableCell value={payment.courseTitle} />
										<CustomTableCell value={payment.documentName} />
										<CustomTableCell value={`${setCurrencySymbol(payment.currency)}${payment.amount}`} />
										<CustomTableCell value={`£${payment.amountReceivedInGbp}`} />

										<CustomTableCell
											value={new Date(payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
										/>
										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn
												title='View Payment'
												onClick={() => handleViewPayment(payment)}
												icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
											/>
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={paymentsNumberOfPages} page={currentPage} onChange={handlePageChange} />
			</Box>

			<PaymentDetailsDialog
				open={isDialogOpen}
				onClose={() => {
					setIsDialogOpen(false);
					setSelectedPayment(null);
				}}
				payment={selectedPayment}
			/>
		</Box>
	);
};

export default AdminPaymentsTab;
