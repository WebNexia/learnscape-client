import { Box, FormControl, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { Edit, Person, PersonOff } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';

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
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

// Responsive column configuration
const getColumns = (isVerySmallScreen: boolean) => {
	return isVerySmallScreen
		? [
				{ key: 'username', label: 'Username' },
				{ key: 'email', label: 'Email Address' },
				{ key: 'actions', label: 'Actions' },
			]
		: [
				{ key: 'firstName', label: 'First Name' },
				{ key: 'lastName', label: 'Last Name' },
				{ key: 'username', label: 'Username' },
				{ key: 'email', label: 'Email Address' },
				{ key: 'isActive', label: 'Status' },
				{ key: 'role', label: 'Role' },
				{ key: 'actions', label: 'Actions' },
			];
};

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
					<FilterSearchRow
						filterValue={filterValue}
						onFilterChange={handleFilterChange}
						filterOptions={[
							{ value: '', label: 'All Users' },
							{ value: 'admin users', label: 'Admin Users' },
							{ value: 'instructors', label: 'Instructors' },
							{ value: 'learners', label: 'Learners' },
							{ value: 'active users', label: 'Active Users' },
							{ value: 'inactive users', label: 'Inactive Users' },
						]}
						filterPlaceholder='Filter Users'
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						onSearch={handleSearch}
						onReset={resetAll}
						searchPlaceholder='Search in First & Last Name, Username and Email'
						isSearchLoading={isSearchLoading}
						isSearchActive={isSearchActive}
						searchResultsTotalItems={searchResultsTotalItems}
						totalItems={totalItems}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
						actionButtons={[
							{
								label: isMobileSize ? 'Download' : `Download ${searchButtonClicked ? 'Filtered' : 'All'} Users`,
								onClick: handleDownloadUsers,
								startIcon: <DownloadIcon />,
								disabled: displayUsers && displayUsers.length === 0,
							},
						]}
						isSticky={true}
					/>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							padding: isVerySmallScreen ? '0rem 0.25rem 2rem 0.25rem' : '0rem 0rem 2rem 0rem',
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
									top:
										(isSearchActive && searchedValue) || (isSearchActive && filterValue?.trim())
											? !isMobileSize
												? '10rem'
												: '12.5rem'
											: isMobileSize
												? '10.25rem'
												: '8rem',
									left: isMobileSize ? 0 : '10rem',
									right: 0,
									zIndex: 99,
									backgroundColor: theme.palette.background.paper,
									boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
									display: 'table',
									tableLayout: 'fixed',
									width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
								},
								'& .MuiTableHead-root .MuiTableCell-root': {
									backgroundColor: theme.palette.background.paper,
									padding: '0.25rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableHead-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								'& .MuiTableBody-root .MuiTableCell-root': {
									padding: '0.25rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableBody-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								// Column widths for header cells
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isVerySmallScreen ? '80px' : '100px',
									width: isVerySmallScreen ? '30%' : '14%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isVerySmallScreen ? '200px' : '100px',
									width: isVerySmallScreen ? '40%' : '14%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isVerySmallScreen ? '100px' : '120px',
									width: isVerySmallScreen ? '30%' : '12%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isVerySmallScreen ? '0px' : '150px',
									width: isVerySmallScreen ? '0%' : '30%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isVerySmallScreen ? '0px' : '80px',
									width: isVerySmallScreen ? '0%' : '12%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
									minWidth: isVerySmallScreen ? '0px' : '80px',
									width: isVerySmallScreen ? '0%' : '10%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(7)': {
									minWidth: isVerySmallScreen ? '0px' : '80px',
									width: isVerySmallScreen ? '0%' : '10%',
								},
								// Column widths for body cells - exact same as header
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isVerySmallScreen ? '80px' : '100px',
									width: isVerySmallScreen ? '30%' : '14%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isVerySmallScreen ? '200px' : '100px',
									width: isVerySmallScreen ? '40%' : '14%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isVerySmallScreen ? '100px' : '120px',
									width: isVerySmallScreen ? '30%' : '12%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isVerySmallScreen ? '0px' : '150px',
									width: isVerySmallScreen ? '0%' : '30%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isVerySmallScreen ? '0px' : '80px',
									width: isVerySmallScreen ? '0%' : '12%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(6)': {
									minWidth: isVerySmallScreen ? '0px' : '80px',
									width: isVerySmallScreen ? '0%' : '10%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(7)': {
									minWidth: isVerySmallScreen ? '0px' : '80px',
									width: isVerySmallScreen ? '0%' : '10%',
								},
							}}
							size='small'
							aria-label='a dense table'>
							{/* Spacer row to ensure header alignment */}
							<TableRow sx={{ height: 0, visibility: 'hidden' }}>
								<TableCell sx={{ width: isVerySmallScreen ? '30%' : '14%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isVerySmallScreen ? '40%' : '14%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isVerySmallScreen ? '30%' : '12%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isVerySmallScreen ? '0%' : '30%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isVerySmallScreen ? '0%' : '12%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isVerySmallScreen ? '0%' : '10%', padding: 0, border: 'none' }} />
								<TableCell sx={{ width: isVerySmallScreen ? '0%' : '10%', padding: 0, border: 'none' }} />
							</TableRow>
							<CustomTableHead<User>
								orderBy={orderBy as keyof User}
								order={order}
								handleSort={(property: keyof User) => handleSort(property as string)}
								columns={getColumns(isVerySmallScreen)}
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
													<CustomActionBtn
														title='Edit'
														onClick={() => {
															toggleUserEditModal(index);
															openEditUserModal(index);
														}}
														icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
														disabled={user._id === userId}
													/>

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
														disabled={user._id === userId}
													/>

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
						{isVerySmallScreen && <CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />}
						<CustomTablePagination count={usersNumberOfPages} page={currentPage} onChange={handlePageChange} />
					</Box>
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminUsers;
