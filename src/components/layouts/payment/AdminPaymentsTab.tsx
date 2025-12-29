import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useContext, useEffect, useMemo, useState } from 'react';
import { PaymentsContext } from '../../../contexts/PaymentsContextProvider';
import { Payment } from '../../../interfaces/payment';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import CustomTablePagination from '../table/CustomTablePagination';
import { Visibility } from '@mui/icons-material';
import theme from '../../../themes';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import CustomActionBtn from '../table/CustomActionBtn';
import PaymentDetailsDialog from './PaymentDetailsDialog';
import DownloadIcon from '@mui/icons-material/Download';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';
import axios from '@utils/axiosInstance';
import { useFilterSearch } from '../../../hooks/useFilterSearch';
import FilterSearchRow from '../FilterSearchRow';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';
import { useAuth } from '../../../hooks/useAuth';

const AdminPaymentsTab = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId, organisation } = useContext(OrganisationContext);

	const { payments, totalItems, loadedPages, fetchMorePayments, enablePaymentsFetch, setPaymentsPageNumber } = useContext(PaymentsContext);
	const { courses } = useContext(CoursesContext);

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { isOwner, isSuperAdmin } = useAuth();

	const mappedCourses = useMemo(() => {
		const courseTitles = courses?.map((course) => course.title) || [];
		// Remove duplicates while preserving order for filter options
		return [...new Set(courseTitles)];
	}, [courses]);

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
		currentPage: paymentsCurrentPage,
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
		contextTotalItems: totalItems,
		defaultOrderBy: 'createdAt',
		defaultOrder: 'desc',
	});

	const sortedPayments = useMemo(() => {
		if (!displayPayments) return [];
		return [...displayPayments].sort((a, b) => {
			const aValue = a[orderBy as keyof Payment] ?? '';
			const bValue = b[orderBy as keyof Payment] ?? '';
			return order === 'asc' ? (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) : aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		});
	}, [displayPayments, orderBy, order]);

	const paginatedPayments = sortedPayments;

	useEffect(() => {
		enablePaymentsFetch();
	}, [enablePaymentsFetch]);

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
			<FilterSearchRow
				filterValue={filterValue}
				onFilterChange={handleFilterChange}
				filterOptions={[
					{ value: '', label: 'All Payments' },
					...(mappedCourses?.map((course) => ({
						value: course?.toLowerCase(),
						label: course?.length > 30 ? `${course.substring(0, 20)}...` : course,
					})) || []),
				]}
				filterPlaceholder='Filter Payments'
				searchValue={searchValue}
				onSearchChange={setSearchValue}
				onSearch={handleSearch}
				onReset={resetAll}
				searchPlaceholder={isMobileSize ? 'Search in Username' : 'Search in First & Last Name, Username, Course & Document'}
				isSearchLoading={isSearchLoading}
				isSearchActive={isSearchActive}
				searchResultsTotalItems={searchResultsTotalItems}
				totalItems={totalItems || payments?.length || 0}
				searchedValue={searchedValue}
				onResetSearch={resetSearch}
				onResetFilter={resetFilter}
				actionButtons={[
					{
						label: isSearchActive
							? isMobileSize
								? 'Download Filtered'
								: 'Download Filtered Payments'
							: isMobileSize
								? 'Download All'
								: 'Download All Payments',
						onClick: handleDownloadPayments,
						startIcon: <DownloadIcon />,
					},
				]}
				isSticky={true}
				isPayments={true}
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
							top: !((isSearchActive && searchedValue && searchButtonClicked) || (filterValue && filterValue.trim()))
								? isMobileSize
									? '13.5rem'
									: '11rem'
								: isMobileSize
									? '16rem'
									: '13.25rem',
							left: isMobileSize ? 0 : '10rem',
							right: 0,
							zIndex: 98,
							backgroundColor: theme.bgColor?.secondary,
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							display: 'table',
							tableLayout: 'fixed',
							width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
						},
						'& .MuiTableHead-root .MuiTableCell-root': {
							backgroundColor: theme.bgColor?.secondary,
							padding: isMobileSize ? '0.75rem 1rem' : '0.75rem 1rem',
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
						// Column widths for mobile (5 columns)
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
							minWidth: isMobileSize ? '100px' : '120px',
							width: isMobileSize ? '20%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
							minWidth: isMobileSize ? '120px' : '150px',
							width: isMobileSize ? '25%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
							minWidth: isMobileSize ? '100px' : '120px',
							width: isMobileSize ? '20%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
							minWidth: isMobileSize ? '80px' : '100px',
							width: isMobileSize ? '15%' : '10%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
							minWidth: isMobileSize ? '80px' : '100px',
							width: isMobileSize ? '20%' : '10%',
						},
						// Desktop columns (8 columns)
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
							minWidth: isMobileSize ? '0px' : '100px',
							width: isMobileSize ? '0%' : '10%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(7)': {
							minWidth: isMobileSize ? '0px' : '120px',
							width: isMobileSize ? '0%' : '15%',
						},
						'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(8)': {
							minWidth: isMobileSize ? '0px' : '100px',
							width: isMobileSize ? '0%' : '10%',
						},
					}}
					size='small'
					aria-label='a dense table'>
					{/* Spacer row to ensure header alignment */}
					<TableRow sx={{ height: 0, visibility: 'hidden' }}>
						<TableCell sx={{ width: isMobileSize ? '20%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '25%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '20%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '15%' : '10%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '20%' : '10%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '10%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '15%', padding: 0, border: 'none' }} />
						<TableCell sx={{ width: isMobileSize ? '0%' : '10%', padding: 0, border: 'none' }} />
					</TableRow>
					<CustomTableHead<Payment>
						orderBy={orderBy as keyof Payment}
						order={order}
						handleSort={handleSort}
						columns={
							isMobileSize
								? [
										{ key: 'username', label: 'Username' },
										{ key: 'courseTitle', label: 'Course' },
										{ key: 'documentName', label: 'Document' },
										{ key: 'amountReceivedInGbp', label: 'Received' },
										{ key: 'actions', label: 'Actions' },
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
										{!isMobileSize && <CustomTableCell value={payment.firstName} />}
										{!isMobileSize && <CustomTableCell value={payment.lastName} />}
										{isMobileSize && <CustomTableCell value={payment.username} />}
										<CustomTableCell value={payment.courseTitle} />
										<CustomTableCell value={payment.documentName} />
										{!isMobileSize && <CustomTableCell value={`${setCurrencySymbol(payment.currency)}${payment.amount}`} />}
										<CustomTableCell
											value={
												isOwner && payment.ownerIncome !== undefined && payment.ownerIncome !== null
													? `£${payment.ownerIncome.toFixed(2)}`
													: isSuperAdmin && payment.superAdminIncome !== undefined && payment.superAdminIncome !== null
														? `£${payment.superAdminIncome.toFixed(2)}`
														: `£${payment.amountReceivedInGbp || '0.00'}`
											}
										/>

										{!isMobileSize && (
											<CustomTableCell
												value={new Date(payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
											/>
										)}
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
				{displayPayments && displayPayments.length === 0 && (
					<CustomInfoMessageAlignedLeft
						message={isSearchActive ? 'No payments found matching your search criteria.' : 'No payments found.'}
						sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
					/>
				)}
				{isMobileSize && !(displayPayments && displayPayments.length === 0) && (
					<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
				)}
				<CustomTablePagination count={paymentsNumberOfPages} page={paymentsCurrentPage} onChange={handlePageChange} />
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
