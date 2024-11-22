import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Edit, Person, PersonOff, Search } from '@mui/icons-material';

import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import { UsersContext } from '../contexts/UsersContextProvider';
import { User } from '../interfaces/user';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import theme from '../themes';
import { Roles } from '../interfaces/enums';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';

const AdminUsers = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { userId } = useContext(UserAuthContext);

	const { sortUsersData, sortedUsersData, fetchUsers, updateUser } = useContext(UsersContext);

	const [usersPageNumber, setUsersPageNumber] = useState<number>(1);
	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');

	const pageSize = 50;

	const filteredUsers = sortedUsersData.filter((user) => {
		if (searchValue) {
			const lowerSearch = searchValue.toLowerCase();
			return (
				user?.firstName?.toLowerCase().includes(lowerSearch) ||
				user?.lastName?.toLowerCase().includes(lowerSearch) ||
				user?.username?.toLowerCase().includes(lowerSearch) ||
				user?.email?.toLowerCase().includes(lowerSearch)
			);
		}
		if (filterValue) {
			if (filterValue === 'active users' && user.isActive) return true;
			if (filterValue === 'admin users' && user.role === Roles.ADMIN) return true;
			if (filterValue === 'learners' && user.role === Roles.USER) return true;
			if (filterValue === 'inactive users' && !user.isActive) return true;
		}
		return !searchValue && !filterValue;
	});

	const usersNumberOfPages = Math.ceil(filteredUsers.length / pageSize);

	const paginatedUsers = filteredUsers.slice((usersPageNumber - 1) * pageSize, usersPageNumber * pageSize);

	const [orderBy, setOrderBy] = useState<keyof User>('username');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	const handleSort = (property: keyof User) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
		sortUsersData(property, isAsc ? 'desc' : 'asc');
	};

	const [isUserStatusUpdateModalOpen, setIsUserStatusUpdateModalOpen] = useState<boolean[]>([]);
	const [isUserEditModalOpen, setIsUserEditModalOpen] = useState<boolean[]>([]);

	const [singleUser, setSingleUser] = useState<User | null>(null);

	useEffect(() => {
		setIsUserStatusUpdateModalOpen(Array(paginatedUsers.length).fill(false));
		setIsUserEditModalOpen(Array(paginatedUsers.length).fill(false));
	}, [paginatedUsers, usersPageNumber]);

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
		} else {
			fetchUsers();
		}
	}, []);

	const toggleStatusUpdateEditModal = (index: number) => {
		const newEditModalOpen = [...isUserStatusUpdateModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setIsUserStatusUpdateModalOpen(newEditModalOpen);
	};

	const openStatusUpdateUserModal = (index: number) => {
		const userToEdit = paginatedUsers[index];
		setSingleUser(userToEdit);
		toggleStatusUpdateEditModal(index);
	};
	const closeStatusUpdateUserModal = (index: number) => {
		const updatedState = [...isUserStatusUpdateModalOpen];
		updatedState[index] = false;
		setIsUserStatusUpdateModalOpen(updatedState);
	};

	const handleUserStatus = async (): Promise<void> => {
		try {
			await axios.patch(`${base_url}/users/${singleUser?._id}`, {
				isActive: !singleUser?.isActive,
			});
			updateUser({ ...singleUser!, isActive: !singleUser?.isActive });
		} catch (error) {
			console.log(error);
		}
	};

	const toggleUserEditModal = (index: number) => {
		const newEditModalOpen = [...isUserEditModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setIsUserEditModalOpen(newEditModalOpen);
	};

	const openEditUserModal = (index: number) => {
		const userToEdit = paginatedUsers[index];
		setSingleUser(userToEdit);
		toggleUserEditModal(index);
	};

	const closeUserEditModal = (index: number) => {
		const newEditModalOpen = [...isUserEditModalOpen];
		newEditModalOpen[index] = false;
		setIsUserEditModalOpen(newEditModalOpen);
	};

	const handleUpdateUserRole = async () => {
		try {
			await axios.patch(`${base_url}/users/${singleUser?._id}`, {
				role: singleUser?.role,
			});
			updateUser(singleUser!);
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
					padding: '3rem 2rem 2rem 2rem',
					width: '100%',
				}}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
					<Box sx={{ alignSelf: 'flex-start', width: '35%', pb: '1rem' }}>
						<CustomTextField
							value={searchValue}
							placeholder={'Search User'}
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
						<CustomInfoMessageAlignedLeft message='Search in First Name, Last Name, Username and Email Address' messageSx={{ fontSize: '0.75rem' }} />
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
									All Users
								</MenuItem>
								{['Admin Users', 'Learners', 'Active Users', 'Inactive Users'].map((type) => (
									<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
										{type}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>
				</Box>
				<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
					<CustomTableHead<User>
						orderBy={orderBy}
						order={order}
						handleSort={handleSort}
						columns={[
							{ key: 'firstName', label: 'First Name' },
							{ key: 'lastName', label: 'Last Name' },
							{ key: 'username', label: 'Username' },
							{ key: 'email', label: 'Email Address' },
							{ key: 'isActive', label: 'Status' },
							{ key: 'role', label: 'Role' },
							{ key: 'actions', label: 'Actions' },
						]}
					/>
					<TableBody>
						{paginatedUsers &&
							paginatedUsers?.map((user: User, index) => {
								if (user._id !== userId) {
									return (
										<TableRow key={user._id}>
											<CustomTableCell value={user.firstName} />
											<CustomTableCell value={user.lastName} />
											<CustomTableCell value={user.username} />
											<CustomTableCell value={user.email} />
											<CustomTableCell value={user.isActive ? 'Active' : 'Deactivated'} />
											<CustomTableCell value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />

											<TableCell
												sx={{
													textAlign: 'center',
												}}>
												<CustomActionBtn
													title='Edit'
													onClick={() => {
														toggleUserEditModal(index);
														openEditUserModal(index);
													}}
													icon={<Edit fontSize='small' />}
												/>

												<CustomDialog
													openModal={isUserEditModalOpen[index]}
													closeModal={() => closeUserEditModal(index)}
													maxWidth='sm'
													title='Edit User Role'>
													<form
														style={{ display: 'flex', flexDirection: 'column' }}
														onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
															e.preventDefault();
															handleUpdateUserRole();
														}}>
														<FormControl>
															<Select
																size='small'
																value={singleUser?.role}
																onChange={(e) => setSingleUser((prevData) => ({ ...prevData!, role: e.target.value }))}
																required
																sx={{
																	backgroundColor: theme.bgColor?.common,
																	width: '13.25rem',
																	mr: '0.75rem',
																	ml: '1.5rem',
																	fontSize: '0.85rem',
																	textTransform: 'capitalize',
																}}>
																{[Roles.ADMIN, Roles.USER].map((type) => (
																	<MenuItem value={type.toLowerCase()} key={type} sx={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
																		{type}
																	</MenuItem>
																))}
															</Select>
														</FormControl>
														<CustomDialogActions
															onCancel={() => closeUserEditModal(index)}
															submitBtnText='Save'
															actionSx={{ mt: '1rem' }}
															submitBtnType='submit'
														/>
													</form>
												</CustomDialog>
												<CustomActionBtn
													title={user?.isActive ? 'Deactivate' : 'Activate'}
													onClick={() => {
														openStatusUpdateUserModal(index);
													}}
													icon={user?.isActive ? <Person fontSize='small' /> : <PersonOff fontSize='small' />}
												/>
												{isUserStatusUpdateModalOpen[index] !== undefined && (
													<CustomDialog
														openModal={isUserStatusUpdateModalOpen[index]}
														closeModal={() => closeStatusUpdateUserModal(index)}
														title={user?.isActive ? 'Deactivate User' : 'Activate User'}
														content={`Are you sure you want to ${user?.isActive ? 'deactivate' : 'activate'} this user?`}
														maxWidth='sm'>
														<CustomDialogActions
															onCancel={() => closeStatusUpdateUserModal(index)}
															deleteBtn={user?.isActive}
															deleteBtnText='Deactivate'
															onDelete={() => {
																handleUserStatus();
																closeStatusUpdateUserModal(index);
															}}
															onSubmit={() => {
																handleUserStatus();
																closeStatusUpdateUserModal(index);
															}}
															submitBtnText='Activate'
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
