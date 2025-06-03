import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
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

const AdminPaymentsTab = () => {
	const { sortedPaymentsData, sortPaymentsData, fetchPayments } = useContext(PaymentsContext);
	const { sortedCoursesData } = useContext(CoursesContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const courses: string[] = sortedCoursesData?.map((course) => course.title);

	const [paymentsPageNumber, setPaymentsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const pageSize = 50;

	const filteredPayments = sortedPaymentsData.filter((payment) => {
		if (searchValue) {
			const lowerSearch = searchValue.toLowerCase();
			return (
				payment?.firstName?.toLowerCase().includes(lowerSearch) ||
				payment?.lastName?.toLowerCase().includes(lowerSearch) ||
				payment?.username?.toLowerCase().includes(lowerSearch)
			);
		}
		if (filterValue) {
			if (filterValue === payment?.courseTitle?.toLowerCase()) return true;
		}
		return !searchValue && !filterValue;
	});

	const paymentsNumberOfPages = Math.ceil(filteredPayments.length / pageSize);

	const paginatedPayments = filteredPayments.slice((paymentsPageNumber - 1) * pageSize, paymentsPageNumber * pageSize);

	const [orderBy, setOrderBy] = useState<keyof Payment>('createdAt');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof Payment) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortPaymentsData(property, isAsc ? 'desc' : 'asc');
	};

	const handleViewPayment = (payment: Payment) => {
		setSelectedPayment(payment);
		setIsDialogOpen(true);
	};

	useEffect(() => {
		setPaymentsPageNumber(1);
	}, []);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchPayments();
		}
	}, []);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				padding: '2rem',
				width: '100%',
			}}>
			<Box sx={{ display: 'flex', justifyContent: isMobileSize ? 'center' : 'flex-start', width: '100%' }}>
				<Box sx={{ mr: '1rem' }}>
					<FormControl>
						<Select
							size='small'
							value={filterValue}
							onChange={(e) => {
								setSearchValue('');
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
							{courses?.map((course) => (
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
				<Box sx={{ alignSelf: 'flex-start', width: '22rem' }}>
					<CustomTextField
						value={searchValue}
						placeholder={isVerySmallScreen ? 'Search in Username' : 'Search in First Name, Last Name, and Username'}
						onChange={(e) => {
							setSearchValue(e.target.value);
							setFilterValue('filter');
							if (e.target.value === '') {
								setFilterValue('');
							}
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
				</Box>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : isMobileSize ? '0rem 0rem 2rem 0rem' : '0rem 1rem 2rem 1rem',
					width: '100%',
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
				<CustomTablePagination count={paymentsNumberOfPages} page={paymentsPageNumber} onChange={setPaymentsPageNumber} />
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
