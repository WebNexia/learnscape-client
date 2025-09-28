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
import { useFilterSearch } from '../../../hooks/useFilterSearch';

const AdminPaymentsTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId, organisation } = useContext(OrganisationContext);

	const { payments, totalItems, loadedPages, paymentsPageNumber, setPaymentsPageNumber, fetchMorePayments } = useContext(PaymentsContext);
	const { courses } = useContext(CoursesContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const mappedCourses: string[] = courses?.map((course) => course.title) || [];

	const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayPayments,
		numberOfPages: paymentsNumberOfPages,
		searchResultsPage,
		searchResultsTotalItems,
		searchButtonClicked,
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
	} = useFilterSearch<Payment>({
		getEndpoint: () => `${base_url}/payments/organisation/${orgId}`,
		limit: 200,
		pageSize,
		contextData: payments || [],
		setContextPageNumber: setPaymentsPageNumber,
		fetchMoreContextData: fetchMorePayments,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'createdAt',
		defaultOrder: 'desc',
	});

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : paymentsPageNumber;

	const sortedPayments = [...(displayPayments || [])]?.sort((a, b) => {
		const aValue = a[orderBy as keyof Payment] ?? '';
		const bValue = b[orderBy as keyof Payment] ?? '';

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

	const handleViewPayment = (payment: Payment) => {
		setSelectedPayment(payment);
		setIsDialogOpen(true);
	};

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
		<>
			{/* Sticky Filter/Search Row */}
			<Box
				sx={{
					display: 'flex',
					justifyContent: isMobileSize ? 'center' : 'space-between',
					padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 0rem 2rem',
					width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
					position: 'fixed',
					top: isMobileSize ? '7.5rem' : '6.5rem', // Account for header + tabs
					left: isMobileSize ? 0 : '10rem',
					right: 0,
					zIndex: 99,
					backgroundColor: theme.palette.background.paper,
					backdropFilter: 'blur(10px)',
				}}>
				<Box sx={{ display: 'flex', width: '100%', flexDirection: 'column' }}>
					<Box sx={{ display: 'flex', width: '100%' }}>
						<Box sx={{ mr: '1rem' }}>
							<FormControl>
								<Select
									size='small'
									value={filterValue}
									onChange={(e) => handleFilterChange(e.target.value)}
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
									onKeyDown: (e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											if (searchValue.trim() && !isSearchLoading) {
												handleSearch();
											}
										}
									},
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
								disabled={!searchValue || isSearchLoading}
								onClick={handleSearch}>
								Search
							</CustomSubmitButton>
							<CustomDeleteButton
								sx={{ height: isVerySmallScreen ? '1.75rem' : '2rem', marginLeft: '0.5rem', fontSize: isMobileSize ? '0.7rem' : undefined }}
								type='button'
								onClick={resetAll}>
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
							gap: 1,
							flexWrap: 'wrap',
							justifyContent: 'flex-start',
							padding: '0.5rem 1rem 0.5rem 0rem',
							borderRadius: '4px',
							backgroundColor: theme.palette.background.paper,
						}}>
						{filterValue && filterValue.trim() && (
							<Chip
								label={`Filter: ${filterValue}`}
								onDelete={resetFilter}
								color='secondary'
								variant='outlined'
								size='small'
								sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
						{searchedValue && searchButtonClicked && (
							<Chip
								label={`Search: "${searchedValue}"`}
								onDelete={resetSearch}
								variant='outlined'
								color='secondary'
								size='small'
								sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
							/>
						)}
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
					height: '3.5rem',
					width: '100%',
				}}
			/>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isMobileSize ? '0rem 0.25rem 2rem 0.25rem' : '0rem 0rem 2rem 0rem',
					width: '100%',
				}}>
				{/* Spacer for sticky table header */}
				<Box
					sx={{
						height: (isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()) ? '4rem' : '2rem',
						width: '100%',
					}}
				/>
				<Table
					sx={{
						'mb': '2rem',
						'width': '100%',
						'tableLayout': 'fixed',
						'& .MuiTableHead-root': {
							position: 'fixed',
							top: !((isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()))
								? isMobileSize
									? '12.5rem'
									: '12rem'
								: isMobileSize
									? '14rem'
									: '14rem', // Account for header + tabs + filter row
							left: isMobileSize ? 0 : '10rem',
							right: 0,
							zIndex: 98,
							backgroundColor: theme.palette.background.paper,
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							display: 'table',
							tableLayout: 'fixed',
							width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
						},
						'& .MuiTableHead-root .MuiTableCell-root': {
							backgroundColor: theme.palette.background.paper,
							padding: '0.25rem 1rem',
						},
					}}
					size='small'
					aria-label='a dense table'>
					<CustomTableHead<Payment>
						orderBy={orderBy as keyof Payment}
						order={order}
						handleSort={handleSort}
						columns={
							isMobileSize
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
		</>
	);
};

export default AdminPaymentsTab;
