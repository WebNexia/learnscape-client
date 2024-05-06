import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/Dashboard Layout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Delete, Edit, FileCopy } from '@mui/icons-material';

import CustomSubmitButton from '../components/forms/Custom Buttons/CustomSubmitButton';
import CustomDialog from '../components/layouts/Dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/Dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/Table/CustomTableHead';
import CustomTableCell from '../components/layouts/Table/CustomTableCell';
import CustomTablePagination from '../components/layouts/Table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/Table/CustomActionBtn';
import { UsersContext } from '../contexts/UsersContextProvider';
import { User } from '../interfaces/user';

const AdminUsers = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	// const { userId } = useParams();

	const { sortUserData, sortedUserData, removeUser, numberOfPages, pageNumber, setPageNumber } = useContext(UsersContext);

	// const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);

	const [orderBy, setOrderBy] = useState<keyof User>('username');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof User) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortUserData(property, isAsc ? 'desc' : 'asc');
	};

	const [isUserDeleteModalOpen, setIsUserDeleteModalOpen] = useState<boolean[]>([]);

	useEffect(() => {
		setIsUserDeleteModalOpen(Array(sortedUserData.length).fill(false));
	}, [sortedUserData, pageNumber]);

	const openDeleteUserModal = (index: number) => {
		const updatedState = [...isUserDeleteModalOpen];
		updatedState[index] = true;
		setIsUserDeleteModalOpen(updatedState);
	};
	const closeDeleteUserModal = (index: number) => {
		const updatedState = [...isUserDeleteModalOpen];
		updatedState[index] = false;
		setIsUserDeleteModalOpen(updatedState);
	};

	const deleteUser = async (userId: string): Promise<void> => {
		try {
			removeUser(userId);
			await axios.delete(`${base_url}/users/${userId}`);
		} catch (error) {
			console.log(error);
		}
	};
	return (
		<DashboardPagesLayout pageName='Lessons' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '2rem', width: '100%' }}>
				<CustomSubmitButton>New User</CustomSubmitButton>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '1rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<User>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'username', label: 'Username' },
							{ key: 'email', label: 'Email Address' },
							{ key: 'isActive', label: 'Status' },
							{ key: 'role', label: 'Role' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{sortedUserData &&
							sortedUserData.map((user: User, index) => {
								return (
									<TableRow key={user._id}>
										<CustomTableCell value={user.username} />
										<CustomTableCell value={user.email} />
										<CustomTableCell value={user.isActive ? 'Active' : 'Inactive'} />
										<CustomTableCell value={user.role} />

										<TableCell
											sx={{
												textAlign: 'center',
											}}>
											<CustomActionBtn title='Clone' onClick={() => {}} icon={<FileCopy />} />
											<CustomActionBtn title='Edit' onClick={() => {}} icon={<Edit />} />
											<CustomActionBtn
												title='Delete'
												onClick={() => {
													openDeleteUserModal(index);
												}}
												icon={<Delete />}
											/>
											{isUserDeleteModalOpen[index] !== undefined && (
												<CustomDialog
													openModal={isUserDeleteModalOpen[index]}
													closeModal={() => closeDeleteUserModal(index)}
													title='Delete User'
													content='Are you sure you want to delete this user?'>
													<CustomDialogActions
														onCancel={() => closeDeleteUserModal(index)}
														deleteBtn={true}
														onDelete={() => {
															deleteUser(user._id);
															closeDeleteUserModal(index);
														}}
													/>
												</CustomDialog>
											)}
										</TableCell>
									</TableRow>
								);
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={numberOfPages} page={pageNumber} onChange={setPageNumber} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminUsers;
