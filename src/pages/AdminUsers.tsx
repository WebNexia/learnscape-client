import { Box, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Delete, Edit } from '@mui/icons-material';

import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { UsersContext } from '../contexts/UsersContextProvider';
import { User } from '../interfaces/user';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';

const AdminUsers = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { userId } = useContext(UserAuthContext);

	const { sortUsersData, sortedUsersData, removeUser, usersNumberOfPages, usersPageNumber, setUsersPageNumber, fetchUsers } =
		useContext(UsersContext);

	const [orderBy, setOrderBy] = useState<keyof User>('username');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof User) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortUsersData(property, isAsc ? 'desc' : 'asc');
	};

	const [isUserDeleteModalOpen, setIsUserDeleteModalOpen] = useState<boolean[]>([]);

	useEffect(() => {
		setIsUserDeleteModalOpen(Array(sortedUsersData.length).fill(false));
	}, [sortedUsersData, usersPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchUsers(usersPageNumber);
		}
	}, [usersPageNumber]);

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
		<DashboardPagesLayout pageName='Users' customSettings={{ justifyContent: 'flex-start' }}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					padding: '5rem 2rem 2rem 2rem',
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
						{sortedUsersData &&
							sortedUsersData?.map((user: User, index) => {
								if (user._id !== userId) {
									return (
										<TableRow key={user._id}>
											<CustomTableCell value={user.username} />
											<CustomTableCell value={user.email} />
											<CustomTableCell value={user.isActive ? 'Active' : 'Inactive'} />
											<CustomTableCell value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />

											<TableCell
												sx={{
													textAlign: 'center',
												}}>
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
								}
							})}
					</TableBody>
				</Table>
				<CustomTablePagination count={usersNumberOfPages} page={usersPageNumber} onChange={setUsersPageNumber} />
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminUsers;
