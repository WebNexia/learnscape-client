import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
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

	const { payments, sortPaymentsData, totalItems, loadedPages, paymentsPageNumber, setPaymentsPageNumber, fetchMorePayments } =
		useContext(PaymentsContext);
	const { courses } = useContext(CoursesContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const mappedCourses: string[] = courses?.map((course) => course.title);

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<Payment[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const pageSize = 50;

	// Use search results if active, otherwise use context data
	const displayPayments = isSearchActive ? searchResults : payments;

	// Calculate total pages based on filtered results when searching, otherwise use total items from server
	const paymentsNumberOfPages = isSearchActive ? Math.ceil(displayPayments.length / pageSize) : Math.ceil(totalItems / pageSize);

	const paginatedPayments = displayPayments.slice((paymentsPageNumber - 1) * pageSize, paymentsPageNumber * pageSize);

	const [orderBy, setOrderBy] = useState<keyof Payment>('createdAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof Payment) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);

		// If in search mode, trigger new search with sort parameters
		if (isSearchActive) {
			handleSearch();
		} else {
			// Otherwise use client-side sorting
			sortPaymentsData(property, isAsc ? 'desc' : 'asc');
		}
	};

	const handleViewPayment = (payment: Payment) => {
		setSelectedPayment(payment);
		setIsDialogOpen(true);
	};

	useEffect(() => {
		setPaymentsPageNumber(1);
	}, []);

	const handlePageChange = async (newPage: number) => {
		setPaymentsPageNumber(newPage);

		// Only fetch more data if not searching
		if (!isSearchActive) {
			// Check if we need to fetch more data
			const requiredRecords = newPage * pageSize;
			if (payments.length < requiredRecords && newPage <= paymentsNumberOfPages) {
				// Calculate which batch of 200 records we need (context fetches 200 at a time)
				const startBatch = Math.floor(((newPage - 1) * pageSize) / 200) + 1;
				const endBatch = Math.ceil((newPage * pageSize) / 200);

				// Check if we already have the required batches loaded
				const batchesNeeded = [];
				for (let batch = startBatch; batch <= endBatch; batch++) {
					if (!loadedPages.includes(batch)) {
						batchesNeeded.push(batch);
					}
				}

				if (batchesNeeded.length > 0) {
					await fetchMorePayments(startBatch, endBatch);
				}
			}
		}
	};

	const handleSearch = async () => {
		if (!searchValue && !filterValue) {
			setIsSearchActive(false);
			setSearchResults([]);
			setPaymentsPageNumber(1);
			return;
		}

		setIsSearchActive(true);
		setPaymentsPageNumber(1);

		try {
			const params = new URLSearchParams({
				limit: '150',
			});

			if (searchValue) {
				params.append('search', searchValue);
			}

			if (filterValue) {
				params.append('filter', filterValue);
			}

			if (orderBy && order) {
				params.append('sortBy', orderBy.toString());
				params.append('sortOrder', order);
			}

			console.log('Search params:', { searchValue, filterValue, params: params.toString() });
			const response = await axios.get(`${base_url}/payments/organisation/${orgId}?${params}`);
			console.log('Search response:', response.data.data.length, 'results');
			setSearchResults(response.data.data);
		} catch (error) {
			console.error('Search error:', error);
			// Reset search state on error
			setIsSearchActive(false);
			setSearchResults([]);
		}
	};

	// Check if search button should be disabled
	const isSearchDisabled = !searchValue && !filterValue;

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
			if (disposition && disposition.indexOf('filename=') !== -1) {
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
			console.log(error);
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
									setFilterValue(e.target.value);
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

					<Box sx={{ display: 'flex', width: '50%' }}>
						<CustomTextField
							value={searchValue}
							placeholder={isVerySmallScreen ? 'Search in Username' : 'Search in First Name, Last Name, and Username'}
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
								setIsSearchActive(false);
								setPaymentsPageNumber(1);
							}}>
							Reset
						</CustomDeleteButton>
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
					{isSearchActive && (
						<Typography
							variant='body2'
							sx={{
								color: 'text.secondary',
								fontSize: isMobileSize ? '0.7rem' : '0.85rem',
								mr: 2,
							}}>
							{searchResults.length} results
						</Typography>
					)}
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
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<Payment>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={
							isVerySmallScreen
								? [
										{ key: 'username', label: 'Username' },
										{ key: 'courseName', label: 'Course' },
										{ key: 'amount', label: 'Price' },
										{ key: 'amountReceivedInGbp', label: 'Received' },
										{ key: 'createdAt', label: 'Date' },
									]
								: [
										{ key: 'firstName', label: 'First Name' },
										{ key: 'lastName', label: 'Last Name' },
										{ key: 'courseName', label: 'Course' },
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
									<TableRow key={payment._id}>
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
				<CustomTablePagination count={paymentsNumberOfPages} page={paymentsPageNumber} onChange={handlePageChange} />
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
