import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableRow } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { PaymentsContext } from '../../../contexts/PaymentsContextProvider';
import { Payment } from '../../../interfaces/payment';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import CustomTablePagination from '../table/CustomTablePagination';
import CustomTextField from '../../forms/customFields/CustomTextField';
import { Search } from '@mui/icons-material';
import theme from '../../../themes';
import { CoursesContext } from '../../../contexts/CoursesContextProvider';
import CustomInfoMessageAlignedLeft from '../infoMessage/CustomInfoMessageAlignedLeft';

const AdminPaymentsTab = () => {
	const { sortedPaymentsData, sortPaymentsData, fetchPayments } = useContext(PaymentsContext);
	const { sortedCoursesData } = useContext(CoursesContext);

	const courses: string[] = sortedCoursesData.map((course) => course.title);

	const [paymentsPageNumber, setPaymentsPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

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
			if (filterValue === payment.courseTitle.toLowerCase()) return true;
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
				padding: '0rem 2rem 2rem 2rem',
				width: '100%',
				mt: '2rem',
			}}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 1rem' }}>
				<Box sx={{ alignSelf: 'flex-start', width: '35%' }}>
					<CustomTextField
						value={searchValue}
						placeholder={'Search Payment'}
						onChange={(e) => {
							setFilterValue('');
							setSearchValue(e.target.value);
						}}
						sx={{ backgroundColor: '#fff' }}
						required={false}
						InputProps={{
							endAdornment: (
								<InputAdornment position='end'>
									<Search
										sx={{
											mr: '-0.5rem',
										}}
									/>
								</InputAdornment>
							),
						}}
					/>
					<CustomInfoMessageAlignedLeft message='Search in First Name, Last Name, and Username' messageSx={{ fontSize: '0.75rem' }} />
				</Box>
				<Box>
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
								width: '13.25rem',
								mr: '0.75rem',
								ml: '1.5rem',
								fontSize: '0.85rem',
								textTransform: 'capitalize',
							}}>
							<MenuItem value='' selected sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
								All Payments
							</MenuItem>
							{courses.map((type) => (
								<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
									{type}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>
			</Box>

			<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
				<CustomTableHead<Payment>
					orderBy={orderBy}
					order={order}
					handleSort={handleSort}
					columns={[
						{ key: 'firstName', label: 'First Name' },
						{ key: 'lastName', label: 'Last Name' },
						{ key: 'username', label: 'Username' },
						{ key: 'courseName', label: 'Course' },
						{ key: 'amount', label: 'Price' },
						{ key: 'amountReceivedInGbp', label: 'Received' },
						{ key: 'createdAt', label: 'Date' },
					]}
				/>
				<TableBody>
					{paginatedPayments &&
						paginatedPayments?.map((payment: Payment) => {
							return (
								<TableRow key={payment._id}>
									<CustomTableCell value={payment.firstName} />
									<CustomTableCell value={payment.lastName} />
									<CustomTableCell value={payment.username} />
									<CustomTableCell value={payment.courseTitle} />
									<CustomTableCell value={`${setCurrencySymbol(payment.currency)}${payment.amount}`} />
									<CustomTableCell value={`£${payment.amountReceivedInGbp}`} />

									<CustomTableCell
										value={new Date(payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
									/>
								</TableRow>
							);
						})}
				</TableBody>
			</Table>
			<CustomTablePagination count={paymentsNumberOfPages} page={paymentsPageNumber} onChange={setPaymentsPageNumber} />
		</Box>
	);
};

export default AdminPaymentsTab;
