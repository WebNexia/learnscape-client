import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography, Chip } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { Edit, Person, PersonOff, Search } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import { useFilterSearch } from '../hooks/useFilterSearch';

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
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

const columns = [
	{ key: 'firstName', label: 'First Name' },
	{ key: 'lastName', label: 'Last Name' },
	{ key: 'username', label: 'Username' },
	{ key: 'email', label: 'Email Address' },
	{ key: 'isActive', label: 'Status' },
	{ key: 'role', label: 'Role' },
	{ key: 'actions', label: 'Actions' },
];

const AdminUsers = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { orgId, organisation } = useContext(OrganisationContext);

	const { userId } = useContext(UserAuthContext);

	const { users, loading, error, fetchMoreUsers, updateUser, totalItems, loadedPages, usersPageNumber, setUsersPageNumber, enableUsersFetch } =
		useContext(UsersContext);

	const { isSmallScreen, isRotatedMedium, isRotated, isVerySmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const isMobileSizeSmall = isVerySmallScreen || isRotated;

	const pageSize = 50;

	// Use the filter search hook
	const {
		searchValue,
		setSearchValue,
		filterValue,
		displayData: displayUsers,
		numberOfPages: usersNumberOfPages,
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
	} = useFilterSearch<User>({
		getEndpoint: () => `${base_url}/users/organisation/${orgId}`,
		limit: 300,
		pageSize,
		contextData: users,
		setContextPageNumber: setUsersPageNumber,
		fetchMoreContextData: fetchMoreUsers,
		contextLoadedPages: loadedPages,
		defaultOrderBy: 'username',
		defaultOrder: 'asc',
	});

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : usersPageNumber;
	const sortedUsers =
		[...(displayUsers || [])]?.sort((a, b) => {
			const aValue = (a as any)[orderBy] ?? '';
			const bValue = (b as any)[orderBy] ?? '';

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		}) || [];

	const paginatedUsers = sortedUsers?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];

	// Modal states
	const [isUserStatusUpdateModalOpen, setIsUserStatusUpdateModalOpen] = useState<boolean[]>([]);
	const [isUserEditModalOpen, setIsUserEditModalOpen] = useState<boolean[]>([]);
	const [singleUser, setSingleUser] = useState<User | null>(null);

	useEffect(() => {
		setUsersPageNumber(1);
		enableUsersFetch(); // 👈 Enable users fetching when component mounts
	}, []);

	useEffect(() => {
		setIsUserStatusUpdateModalOpen(Array(paginatedUsers.length).fill(false));
		setIsUserEditModalOpen(Array(paginatedUsers.length).fill(false));
	}, [usersPageNumber, filterValue, searchValue]);

	const toggleStatusUpdateEditModal = (index: number) => {
		const newEditModalOpen = [...isUserStatusUpdateModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setIsUserStatusUpdateModalOpen(newEditModalOpen);
	};

	const openStatusUpdateUserModal = (index: number) => {
		const userToEdit: User = paginatedUsers[index];
		setSingleUser(userToEdit);
		toggleStatusUpdateEditModal(index);
	};
	const closeStatusUpdateUserModal = (index: number) => {
		const updatedState = [...isUserStatusUpdateModalOpen];
		updatedState[index] = false;
		setIsUserStatusUpdateModalOpen(updatedState);
	};

	const handleDownloadUsers = async () => {
		try {
			let dataToExport: User[];

			if (searchButtonClicked) {
				// If search is active, use the search results (already filtered)
				dataToExport = displayUsers || [];
			} else {
				// First, get the total count to know how many pages we need
				const countResponse = await axios.get(`${base_url}/users/organisation/${orgId}?page=1&limit=1`);
				const totalItems = countResponse.data.totalItems;

				// Calculate how many pages we need to fetch all data
				const itemsPerPage = 1000; // Fetch 1000 per page
				const totalPages = Math.ceil(totalItems / itemsPerPage);

				// Fetch all pages
				let allUsers: User[] = [];
				for (let page = 1; page <= totalPages; page++) {
					const response = await axios.get(`${base_url}/users/organisation/${orgId}?page=${page}&limit=${itemsPerPage}`);
					allUsers = [...allUsers, ...response.data.data];
				}

				dataToExport = allUsers;
			}

			// Create Excel data
			const excelData = dataToExport?.map((user: User) => ({
				'First Name': user.firstName,
				'Last Name': user.lastName,
				'Username': user.username,
				'Email': user.email,
				'Status': user.isActive ? 'Active' : 'Inactive',
				'Role': user.role,
				'Created At': new Date(user.createdAt).toLocaleDateString(),
			}));

			// Create and download Excel file
			const XLSX = await import('xlsx');
			const ws = XLSX.utils.json_to_sheet(excelData);
			const wb = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(wb, ws, 'Users');
			XLSX.writeFile(wb, `${organisation?.orgName}_Users_${new Date().toISOString().split('T')[0]}.xlsx`);
		} catch (error) {
			console.error('Download error:', error);
		}
	};

	const handleUserStatus = async (): Promise<void> => {
		try {
			await axios.patch(`${base_url}/users/${singleUser?._id}`, {
				isActive: !singleUser?.isActive,
			});
			updateUser({ ...singleUser!, isActive: !singleUser?.isActive });
		} catch (error) {
			console.error('Toggle user status error:', error);
		}
	};

	const toggleUserEditModal = (index: number) => {
		const newEditModalOpen = [...isUserEditModalOpen];
		newEditModalOpen[index] = !newEditModalOpen[index];
		setIsUserEditModalOpen(newEditModalOpen);
	};

	const openEditUserModal = (index: number) => {
		const userToEdit: User = paginatedUsers[index];
		setSingleUser(userToEdit);
		toggleUserEditModal(index);
	};

	const closeUserEditModal = (index: number) => {
		const newEditModalOpen = [...isUserEditModalOpen];
		newEditModalOpen[index] = false;
		setIsUserEditModalOpen(newEditModalOpen);
	};

	const handleUpdateUserRole = async (index: number) => {
		try {
			await axios.patch(`${base_url}/users/${singleUser?._id}`, {
				role: singleUser?.role,
			});
			updateUser(singleUser!);
			closeUserEditModal(index);
		} catch (error) {
			console.error('Update user role error:', error);
		}
	};

	// Show loading state while users are being fetched or when data is empty and not loading yet
	if (loading) {
		return (
			<DashboardPagesLayout pageName='Users' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<AdminTableSkeleton rows={8} columns={5} />
			</DashboardPagesLayout>
		);
	}
	if (error) return <Typography color='error'>{error}</Typography>;

	return (
		<AdminPageErrorBoundary pageName='Users'>
			<DashboardPagesLayout pageName='Users' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', height: '100%' }}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: isMobileSizeSmall ? '1rem 1rem 0.5rem 1rem' : '2rem 2rem 1rem 2rem',
							width: '100%',
							mb: '1.25rem',
						}}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', flex: 4 }}>
							<Box sx={{ display: 'flex', alignSelf: 'flex-start', width: isVerySmallScreen ? '12.5rem' : 'fit-content' }}>
								<Box sx={{ mr: '1rem' }}>
									<FormControl>
										<Select
											size='small'
											value={filterValue}
											onChange={(e) => handleFilterChange(e.target.value)}
											displayEmpty
											sx={{
												backgroundColor: theme.bgColor?.common,
												width: isMobileSizeSmall ? '7rem' : '10rem',
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
												Filter Users
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
												All Users
											</MenuItem>
											{['Admin Users', 'Instructors', 'Learners', 'Active Users', 'Inactive Users']?.map((type) => (
												<MenuItem
													value={type.toLowerCase()}
													key={type}
													sx={{
														fontSize: isMobileSize ? '0.65rem' : '0.85rem',
														textTransform: 'capitalize',
														padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
														minHeight: '2rem',
													}}>
													{type}
												</MenuItem>
											))}
										</Select>
									</FormControl>
								</Box>
								<CustomTextField
									value={searchValue}
									placeholder={'Search in First & Last Name, Username and Email'}
									onChange={(e) => {
										setSearchValue(e.target.value);
									}}
									sx={{ backgroundColor: '#fff', minWidth: isVerySmallScreen ? '10rem' : '17.5rem' }}
									required={false}
									InputProps={{
										onKeyDown: (e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												if (searchValue.trim() && !loading) {
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
								<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue || isSearchLoading}>
									Search
								</CustomSubmitButton>
								<CustomDeleteButton onClick={resetAll}>Reset</CustomDeleteButton>
								<Box sx={{ height: '2rem', ml: '1rem', display: 'flex', alignItems: 'center' }}>
									{isSearchActive ? (
										<Typography
											variant='body2'
											sx={{
												color: 'text.secondary',
												fontSize: isMobileSize ? '0.7rem' : '0.85rem',
												whiteSpace: 'nowrap',
											}}>
											{searchResultsTotalItems} {searchResultsTotalItems === 1 ? 'result' : 'results'}
										</Typography>
									) : (
										<Typography
											variant='body2'
											sx={{
												color: 'text.secondary',
												fontSize: isMobileSize ? '0.7rem' : '0.85rem',
												whiteSpace: 'nowrap',
											}}>
											{totalItems} {totalItems === 1 ? 'item' : 'items'}
										</Typography>
									)}
								</Box>
							</Box>
						</Box>
						<Box sx={{ display: 'flex', gap: 1, mb: '0.85rem', alignItems: 'center' }}>
							<CustomSubmitButton
								startIcon={<DownloadIcon />}
								onClick={handleDownloadUsers}
								sx={{
									fontSize: isMobileSize ? '0.7rem' : undefined,
								}}
								disabled={displayUsers && displayUsers.length === 0}>
								Download {searchButtonClicked ? 'Filtered' : 'All'} Users
							</CustomSubmitButton>
						</Box>
					</Box>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 2rem 2rem 2rem',
							width: '100%',
						}}>
						{((isSearchActive && searchedValue && searchButtonClicked) || (isSearchActive && filterValue && filterValue.trim())) && (
							<Box
								sx={{
									display: 'flex',
									gap: 1,
									flexWrap: 'wrap',
									justifyContent: 'center',
									borderRadius: '4px',
									alignSelf: 'flex-start',
									marginBottom: '1rem',
									marginTop: '-1rem',
								}}>
								{isSearchActive && filterValue && filterValue.trim() && (
									<Chip
										label={`Filter: "${filterValue}"`}
										onDelete={resetFilter}
										variant='outlined'
										color='secondary'
										size='small'
										sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
									/>
								)}
								{isSearchActive && searchedValue && searchButtonClicked && (
									<Chip
										label={`Search: "${searchedValue}"`}
										onDelete={resetSearch}
										color='primary'
										variant='filled'
										size='small'
										sx={{ backgroundColor: '#1EC28B', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
									/>
								)}
							</Box>
						)}
						<Table sx={{ mb: '2rem' }} size='small' aria-label='a dense table'>
							<CustomTableHead<User>
								orderBy={orderBy as keyof User}
								order={order}
								handleSort={(property: keyof User) => handleSort(property as string)}
								columns={
									isVerySmallScreen
										? [
												{ key: 'username', label: 'Username' },
												{ key: 'email', label: 'Email Address' },
												{ key: 'actions', label: 'Actions' },
											]
										: columns
								}
							/>
							<TableBody>
								{paginatedUsers &&
									paginatedUsers?.map((user: User, index) => {
										return (
											<TableRow key={user._id} hover>
												{!isVerySmallScreen && <CustomTableCell value={user.firstName} />}
												{!isVerySmallScreen && <CustomTableCell value={user.lastName} />}
												<CustomTableCell value={user.username} />
												<CustomTableCell value={user.email} />
												{!isVerySmallScreen && <CustomTableCell value={user.isActive ? 'Active' : 'Deactivated'} />}
												{!isVerySmallScreen && <CustomTableCell value={user.role?.charAt?.(0)?.toUpperCase?.() + user.role?.slice(1)} />}

												<TableCell
													sx={{
														textAlign: 'center',
														padding: isMobileSizeSmall ? '0' : undefined,
													}}>
													{user._id !== userId && (
														<CustomActionBtn
															title='Edit'
															onClick={() => {
																toggleUserEditModal(index);
																openEditUserModal(index);
															}}
															icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
														/>
													)}

													<CustomDialog
														openModal={isUserEditModalOpen[index]}
														closeModal={() => {
															closeUserEditModal(index);
														}}
														maxWidth='xs'
														title='Edit User Role'>
														<form
															style={{ display: 'flex', flexDirection: 'column' }}
															onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
																e.preventDefault();
																handleUpdateUserRole(index);
															}}>
															<FormControl>
																<Select
																	size='small'
																	value={singleUser?.role}
																	onChange={(e) => setSingleUser((prevData) => ({ ...prevData!, role: e.target.value as Roles }))}
																	required
																	sx={{
																		backgroundColor: theme.bgColor?.common,
																		width: '13.25rem',
																		mr: '0.75rem',
																		ml: '1.5rem',
																		fontSize: isMobileSize ? '0.65rem' : '0.85rem',
																		textTransform: 'capitalize',
																	}}>
																	{[Roles.ADMIN, Roles.INSTRUCTOR, Roles.USER]?.map((type) => (
																		<MenuItem
																			value={type}
																			key={type}
																			sx={{
																				fontSize: isMobileSize ? '0.65rem' : '0.85rem',
																				textTransform: 'capitalize',
																				padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
																				minHeight: '2rem',
																			}}>
																			{type}
																		</MenuItem>
																	))}
																</Select>
															</FormControl>
															<CustomDialogActions
																onCancel={() => {
																	closeUserEditModal(index);
																}}
																submitBtnText='Save'
																actionSx={{ mt: '1rem' }}
																submitBtnType='submit'
															/>
														</form>
													</CustomDialog>
													{user._id !== userId && (
														<CustomActionBtn
															title={user?.isActive ? 'Deactivate' : 'Activate'}
															onClick={() => {
																openStatusUpdateUserModal(index);
															}}
															icon={
																user?.isActive ? (
																	<Person fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />
																) : (
																	<PersonOff fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />
																)
															}
														/>
													)}
													{isUserStatusUpdateModalOpen[index] !== undefined && (
														<CustomDialog
															openModal={isUserStatusUpdateModalOpen[index]}
															closeModal={() => closeStatusUpdateUserModal(index)}
															title={user?.isActive ? 'Deactivate User' : 'Activate User'}
															content={`Are you sure you want to ${user?.isActive ? 'deactivate' : 'activate'} ${user?.firstName} ${user?.lastName} (${user?.username})?`}
															maxWidth='xs'>
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
																actionSx={{ mb: '0.5rem' }}
															/>
														</CustomDialog>
													)}
												</TableCell>
											</TableRow>
										);
									})}
							</TableBody>
						</Table>
						{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device for more info' />}
						<CustomTablePagination count={usersNumberOfPages} page={currentPage} onChange={handlePageChange} />
					</Box>
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminUsers;
