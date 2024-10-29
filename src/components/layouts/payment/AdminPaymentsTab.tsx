import { Box, Table, TableBody, TableRow } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { PaymentsContext } from '../../../contexts/PaymentsContextProvider';
import { Payment } from '../../../interfaces/payment';
import CustomTableHead from '../table/CustomTableHead';
import CustomTableCell from '../table/CustomTableCell';
import { setCurrencySymbol } from '../../../utils/setCurrencySymbol';
import CustomTablePagination from '../table/CustomTablePagination';

const AdminPaymentsTab = () => {
	const { sortedPaymentsData, sortPaymentsData, numberOfPages, setPaymentsPageNumber, paymentsPageNumber, fetchPayments } =
		useContext(PaymentsContext);

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
			fetchPayments(paymentsPageNumber);
		}
	}, [paymentsPageNumber]);

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
					{sortedPaymentsData &&
						sortedPaymentsData?.map((payment: Payment) => {
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
			<CustomTablePagination count={numberOfPages} page={paymentsPageNumber} onChange={setPaymentsPageNumber} />
		</Box>
	);
};

export default AdminPaymentsTab;
