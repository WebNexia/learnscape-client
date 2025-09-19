import { Box, FormControl, InputAdornment, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography, Chip } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { Edit, Person, PersonOff, Search } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';

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

	const [searchValue, setSearchValue] = useState<string>('');
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchResults, setSearchResults] = useState<User[]>([]);
	const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
	const [searchResultsPage, setSearchResultsPage] = useState<number>(1);
	const [searchResultsLoadedPages, setSearchResultsLoadedPages] = useState<number[]>([]);
	const [searchResultsTotalItems, setSearchResultsTotalItems] = useState<number>(0);
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);
	const [searchedValue, setSearchedValue] = useState<string>('');

	const [orderBy, setOrderBy] = useState<keyof User>('username');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');

	// Use search results if active, otherwise use context data
	const displayUsers = isSearchActive ? searchResults : users;

	// For pagination, use total items from server when not searching
	const usersNumberOfPages = isSearchActive ? Math.ceil(searchResultsTotalItems / pageSize) : Math.ceil(totalItems / pageSize);

	// Use appropriate page number for pagination
	const currentPage = isSearchActive ? searchResultsPage : usersPageNumber;
	const sortedUsers =
		[...(displayUsers || [])]?.sort((a, b) => {
			const aValue = a[orderBy] ?? '';
			const bValue = b[orderBy] ?? '';

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
	}, []); // Only on mount

	useEffect(() => {
		setIsUserStatusUpdateModalOpen(Array(paginatedUsers.length).fill(false));
		setIsUserEditModalOpen(Array(paginatedUsers.length).fill(false));
	}, [usersPageNumber, filterValue, searchValue]);

	const handlePageChange = async (newPage: number) => {
		// Set appropriate page number based on search state
		if (isSearchActive) {
			setSearchResultsPage(newPage);
		} else {
			setUsersPageNumber(newPage);
		}

		// If in search mode, handle search results pagination
		if (isSearchActive) {
			// Check if we need to fetch more search results
			const requiredRecords = newPage * pageSize;
			if (searchResults.length < requiredRecords) {
				// Build search parameters
				const params = new URLSearchParams({
					limit: '300',
				});

				if (searchValue && searchValue.trim()) {
					params.append('search', searchValue.trim());
				}
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
				}
				if (orderBy) {
					params.append('sortBy', orderBy);
				}
				if (order) {
					params.append('sortOrder', order);
				}

				// Calculate which pages we need to fetch
				const currentLoadedPages = searchResultsLoadedPages && searchResultsLoadedPages.length > 0 ? Math.max(...searchResultsLoadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 300);

				// Fetch all missing pages in sequence
				for (let page = currentLoadedPages + 1; page <= targetPage; page++) {
					if (!searchResultsLoadedPages?.includes(page)) {
						await fetchMoreSearchResults(page, params);
					}
				}
			}
		} else {
			// Check if we need to fetch more data for context
			const requiredRecords = newPage * pageSize;
			if (users.length < requiredRecords && newPage <= usersNumberOfPages) {
				// Calculate which pages we need to fetch
				const currentLoadedPages = loadedPages && loadedPages.length > 0 ? Math.max(...loadedPages) : 0;
				const targetPage = Math.ceil((newPage * pageSize) / 300);

				// Fetch all missing pages in sequence
				if (currentLoadedPages < targetPage) {
					await fetchMoreUsers(currentLoadedPages + 1, targetPage);
				}
			}
		}
	};

	const handleSort = (property: keyof User) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const handleSearch = async () => {
		try {
			// Reset to first page when searching
			setUsersPageNumber(1);
			setSearchResultsPage(1);

			// Search button only works when search value exists
			if (searchValue && searchValue.trim()) {
				// Store the searched value
				setSearchedValue(searchValue.trim());
				// Build query parameters
				const params = new URLSearchParams({
					limit: '300',
					search: searchValue.trim(),
				});

				// Add filter if it exists
				if (filterValue && filterValue.trim()) {
					params.append('filter', filterValue.trim());
				}
				if (orderBy) {
					params.append('sortBy', orderBy);
				}
				if (order) {
					params.append('sortOrder', order);
				}

				const response = await axios.get(`${base_url}/users/organisation/${orgId}?${params.toString()}`);
				setSearchResults(response.data.data);
				setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
				setSearchResultsLoadedPages([1]);
				setIsSearchActive(true);
				setSearchButtonClicked(true);
			} else {
				// If no search value, clear search results
				setSearchResults([]);
				setSearchResultsLoadedPages([]);
				setSearchResultsTotalItems(0);
				setIsSearchActive(false);
				setSearchButtonClicked(false);
			}
		} catch (error) {
			console.error('Search error:', error);
		}
	};

	const fetchMoreSearchResults = async (page: number, searchParams: URLSearchParams) => {
		try {
			// Add page parameter
			searchParams.set('page', page.toString());

			const response = await axios.get(`${base_url}/users/organisation/${orgId}?${searchParams.toString()}`);

			if (page === 1) {
				// First page - replace all data
				setSearchResults(response.data.data);
				setSearchResultsLoadedPages([1]);
			} else {
				// Subsequent pages - append data
				setSearchResults((prev) => {
					const newData = [...prev, ...response.data.data];

					return newData;
				});
				setSearchResultsLoadedPages((prev) => [...prev, page]);
			}

			setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
		} catch (error) {
			console.error('Fetch more search results error:', error);
		}
	};

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

			if (isSearchActive) {
				// If search is active, use the search results (already filtered)
				dataToExport = searchResults;
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
	if (loading || !users || users.length === 0) {
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
											onChange={async (e) => {
												const newFilterValue = e.target.value;
												setFilterValue(newFilterValue);

												// Auto-search when filter is selected
												if (newFilterValue && newFilterValue.trim()) {
													setUsersPageNumber(1);
													setSearchResultsPage(1);
													setIsSearchActive(true);
													setSearchResultsLoadedPages([]);

													try {
														const params = new URLSearchParams({
															limit: '300',
															filter: newFilterValue.trim(),
														});

														// Include existing search value if it exists
														if (searchValue && searchValue.trim()) {
															params.append('search', searchValue.trim());
														}

														if (orderBy) {
															params.append('sortBy', orderBy);
														}
														if (order) {
															params.append('sortOrder', order);
														}

														const response = await axios.get(`${base_url}/users/organisation/${orgId}?${params.toString()}`);
														setSearchResults(response.data.data);
														setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
														setSearchResultsLoadedPages([1]);
													} catch (error) {
														console.error('Filter search error:', error);
													}
												} else {
													// If filter is cleared but search value exists, auto-search with search value
													if (searchValue && searchValue.trim()) {
														setUsersPageNumber(1);
														setSearchResultsPage(1);
														setIsSearchActive(true);
														setSearchResultsLoadedPages([]);

														try {
															const params = new URLSearchParams({
																limit: '300',
																search: searchValue.trim(),
															});

															if (orderBy) {
																params.append('sortBy', orderBy);
															}
															if (order) {
																params.append('sortOrder', order);
															}

															const response = await axios.get(`${base_url}/users/organisation/${orgId}?${params.toString()}`);
															setSearchResults(response.data.data);
															setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
															setSearchResultsLoadedPages([1]);
														} catch (error) {
															console.error('Auto-search error:', error);
														}
													} else {
														// If no search value, reset to context data
														setIsSearchActive(false);
														setSearchResults([]);
														setSearchResultsLoadedPages([]);
														setSearchResultsTotalItems(0);
													}
												}
											}}
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
											{['Admin Users', 'Learners', 'Active Users', 'Inactive Users']?.map((type) => (
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
								<CustomSubmitButton onClick={handleSearch} sx={{ marginLeft: '1rem' }} disabled={!searchValue}>
									Search
								</CustomSubmitButton>
								<CustomDeleteButton
									onClick={() => {
										setSearchValue('');
										setFilterValue('');
										setSearchedValue('');
										setSearchButtonClicked(false);
										setSearchResults([]);
										setSearchResultsLoadedPages([]);
										setSearchResultsTotalItems(0);
										setIsSearchActive(false);
										setUsersPageNumber(1);
										setSearchResultsPage(1);
									}}>
									Reset
								</CustomDeleteButton>
								<Box sx={{ height: '2rem', ml: '1rem', display: 'flex', alignItems: 'center' }}>
									{isSearchActive ? (
										<Typography
											variant='body2'
											sx={{
												color: 'text.secondary',
												fontSize: isMobileSize ? '0.7rem' : '0.85rem',
												whiteSpace: 'nowrap',
											}}>
											{searchResultsTotalItems} results
										</Typography>
									) : (
										<Typography
											variant='body2'
											sx={{
												color: 'text.secondary',
												fontSize: isMobileSize ? '0.7rem' : '0.85rem',
												whiteSpace: 'nowrap',
											}}>
											{totalItems} items
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
								Download {isSearchActive ? 'Filtered' : 'All'} Users
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
										onDelete={() => {
											setFilterValue('');
											// If search exists, keep search results
											if (searchValue && searchValue.trim()) {
												// Trigger search without filter value
												const params = new URLSearchParams({
													limit: '300',
													search: searchValue.trim(),
												});
												if (orderBy) params.append('sortBy', orderBy);
												if (order) params.append('sortOrder', order);

												axios
													.get(`${base_url}/users/organisation/${orgId}?${params.toString()}`)
													.then((response) => {
														setSearchResults(response.data.data);
														setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
														setSearchResultsLoadedPages([1]);
														setIsSearchActive(true);
														setUsersPageNumber(1);
														setSearchResultsPage(1);
													})
													.catch((error) => console.error('Search error:', error));
											} else {
												// No search, reset to context data
												setIsSearchActive(false);
												setSearchResults([]);
												setSearchResultsLoadedPages([]);
												setSearchResultsTotalItems(0);
											}
										}}
										variant='outlined'
										color='secondary'
										size='small'
										sx={{ backgroundColor: '#1976d2', color: 'white', fontSize: '0.9rem', letterSpacing: '0.025rem' }}
									/>
								)}
								{isSearchActive && searchedValue && searchButtonClicked && (
									<Chip
										label={`Search: "${searchedValue}"`}
										onDelete={() => {
											setSearchValue('');
											setSearchedValue('');
											setSearchButtonClicked(false);
											// If filter exists, keep filter results
											if (filterValue && filterValue.trim()) {
												// Trigger filter search without search value
												const params = new URLSearchParams({
													limit: '300',
													filter: filterValue.trim(),
												});
												if (orderBy) params.append('sortBy', orderBy);
												if (order) params.append('sortOrder', order);

												axios
													.get(`${base_url}/users/organisation/${orgId}?${params.toString()}`)
													.then((response) => {
														setSearchResults(response.data.data);
														setSearchResultsTotalItems(response.data.totalItems || response.data.data.length);
														setSearchResultsLoadedPages([1]);
														setIsSearchActive(true);
														setUsersPageNumber(1);
														setSearchResultsPage(1);
													})
													.catch((error) => console.error('Filter search error:', error));
											} else {
												// No filter, reset to context data
												setIsSearchActive(false);
												setSearchResults([]);
												setSearchResultsLoadedPages([]);
												setSearchResultsTotalItems(0);
											}
										}}
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
								orderBy={orderBy}
								order={order}
								handleSort={handleSort}
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
																	{[Roles.ADMIN, Roles.USER]?.map((type) => (
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
