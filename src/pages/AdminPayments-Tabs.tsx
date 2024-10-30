import { Box, Table, TableBody, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { Payment } from '../interfaces/payment';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { useContext, useEffect, useState } from 'react';
import { PaymentsContext } from '../contexts/PaymentsContextProvider';
import { setCurrencySymbol } from '../utils/setCurrencySymbol';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { useNavigate } from 'react-router-dom';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';

const AdminPayments = () => {
	const { userId } = useContext(UserAuthContext);
	const { sortedPaymentsData, sortPaymentsData, numberOfPages, setPaymentsPageNumber, paymentsPageNumber, fetchPayments } =
		useContext(PaymentsContext);

	const navigate = useNavigate();

	const [dataLoaded, setDataLoaded] = useState<boolean>(false);

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

	useEffect(() => {
		if (!dataLoaded) {
			try {
				fetchPayments(paymentsPageNumber);
				setDataLoaded(true);
			} catch (error) {
				console.log(error);
			}
		}
	}, [paymentsPageNumber, dataLoaded]);
	return (
		<DashboardPagesLayout pageName='Payments' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '2rem', width: '100%' }}>
				<CustomSubmitButton
					onClick={() => {
						navigate(`/admin/promocodes/user/${userId}`);
					}}
					type='button'>
					Promo Codes
				</CustomSubmitButton>
			</Box>
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
							{ key: 'amount', label: 'Amount' },
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
		</DashboardPagesLayout>
	);
};

export default AdminPayments;
