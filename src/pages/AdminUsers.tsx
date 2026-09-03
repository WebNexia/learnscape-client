import { Box, DialogContent, FormControl, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography, Avatar, IconButton, Collapse, LinearProgress, CircularProgress, DialogActions } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { Edit, Person, PersonOff, Videocam, DeleteForever, Visibility, ExpandMore, ExpandLess } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import { useFilterSearch } from '../hooks/useFilterSearch';
import FilterSearchRow from '../components/layouts/FilterSearchRow';

import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import CustomTextField from '../components/forms/customFields/CustomTextField';
import { UsersContext } from '../contexts/UsersContextProvider';
import { User } from '../interfaces/user';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import theme from '../themes';
import { isLearnerRole, Roles } from '../interfaces/enums';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';
import { dateFormatter } from '../utils/dateFormatter';

const isUserHiddenFromViewer = (userRole: string, viewerRole?: string): boolean => {
	if (viewerRole === Roles.OWNER) return false;
	if (viewerRole === Roles.SUPER_ADMIN) return userRole === Roles.OWNER;
	if (viewerRole === Roles.ADMIN) return userRole === Roles.SUPER_ADMIN || userRole === Roles.OWNER;
	return false;
};

// Responsive column configuration
const getColumns = (isVerySmallScreen: boolean) => {
	return isVerySmallScreen
		? [
				{ key: 'avatar', label: '' },
				{ key: 'username', label: 'Username' },
				{ key: 'email', label: 'Email Address' },
				{ key: 'actions', label: 'Actions' },
			]
		: [
				{ key: 'avatar', label: '' },
				{ key: 'fullName', label: 'Full Name' },
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

	const { userId, user: loggedInUser } = useContext(UserAuthContext);

	const { users, loading, error, fetchMoreUsers, updateUser, removeUser, totalItems, loadedPages, setUsersPageNumber } =
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
		currentPage: usersCurrentPage,
		searchResultsTotalItems,
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
		removeFromSearchResults,
	} = useFilterSearch<User>({
		getEndpoint: () => `${base_url}/users/organisation/${orgId}`,
		limit: 200,
		pageSize,
		contextData: users,
		setContextPageNumber: setUsersPageNumber,
		fetchMoreContextData: fetchMoreUsers,
		contextLoadedPages: loadedPages,
		contextTotalItems: totalItems,
		defaultOrderBy: 'username',
		defaultOrder: 'asc',
	});

	const sortedUsers =
		[...(displayUsers || [])]?.sort((a, b) => {
			const aValue = orderBy === 'fullName' ? `${a.firstName || ''} ${a.lastName || ''}`.trim() : ((a as any)[orderBy] ?? '');
			const bValue = orderBy === 'fullName' ? `${b.firstName || ''} ${b.lastName || ''}`.trim() : ((b as any)[orderBy] ?? '');

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			}
			return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
		}) || [];

	const paginatedUsers = sortedUsers;

	// Modal states
	const [isUserStatusUpdateModalOpen, setIsUserStatusUpdateModalOpen] = useState<boolean[]>([]);
	const [isUserEditModalOpen, setIsUserEditModalOpen] = useState<boolean[]>([]);
	const [isZoomHostModalOpen, setIsZoomHostModalOpen] = useState<boolean[]>([]);
	const [isDeleteLearningDataModalOpen, setIsDeleteLearningDataModalOpen] = useState<boolean[]>([]);
	const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState<boolean[]>([]);
	const [isUserCoursesModalOpen, setIsUserCoursesModalOpen] = useState<boolean[]>([]);
	const [userCoursesData, setUserCoursesData] = useState<{
		[key: string]: {
			courses: Array<{
				courseId: string;
				courseTitle: string;
				registrationDate: string;
				groupName: string | null;
				progressPercentage: number;
				completedLessons: number;
				totalLessons: number;
				totalEarnedScore: number;
				totalPossibleScore: number;
				rank: number | null;
				totalStudents: number;
			}>;
			loading: boolean;
		};
	}>({});
	const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
	const [isDeletingLearningData, setIsDeletingLearningData] = useState<boolean>(false);
	const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);
	const [isDownloadingUsers, setIsDownloadingUsers] = useState<boolean>(false);
	const [singleUser, setSingleUser] = useState<User | null>(null);

	useEffect(() => {
		setIsUserStatusUpdateModalOpen(Array(paginatedUsers.length).fill(false));
		setIsUserEditModalOpen(Array(paginatedUsers.length).fill(false));
		setIsZoomHostModalOpen(Array(paginatedUsers.length).fill(false));
		setIsDeleteLearningDataModalOpen(Array(paginatedUsers.length).fill(false));
		setIsDeleteUserModalOpen(Array(paginatedUsers.length).fill(false));
		setIsUserCoursesModalOpen(Array(paginatedUsers.length).fill(false));
	}, [usersCurrentPage, filterValue, searchValue]);

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
		setIsDownloadingUsers(true);
		try {
			const params = new URLSearchParams();
			if (isSearchActive) {
				if (searchedValue?.trim()) {
					params.append('search', searchedValue.trim());
				}
				if (filterValue?.trim()) {
					params.append('filter', filterValue.trim());
				}
			}

			const queryString = params.toString();
			const response = await axios.get(`${base_url}/users/export-excel/${orgId}${queryString ? `?${queryString}` : ''}`, {
				responseType: 'blob',
			});

			let filename = `${organisation?.orgName}_Users_${new Date().toISOString().split('T')[0]}.xlsx`;
			const disposition = response.headers['content-disposition'];
			if (disposition && disposition.indexOf('filename=') !== -1) {
				filename = disposition.split('filename=')[1].replace(/['"]/g, '').trim();
			}

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', filename);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Download error:', error);
		} finally {
			setIsDownloadingUsers(false);
		}
	};

	const handleUserStatus = async (index: number): Promise<void> => {
		if (!singleUser?._id) return;

		try {
			await axios.patch(`${base_url}/users/${singleUser._id}`, {
				isActive: !singleUser.isActive,
			});
			updateUser({ ...singleUser, isActive: !singleUser.isActive });
			closeStatusUpdateUserModal(index);
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

	const toggleZoomHostModal = (index: number) => {
		const next = [...isZoomHostModalOpen];
		next[index] = !next[index];
		setIsZoomHostModalOpen(next);
	};

	const openZoomHostModal = (index: number) => {
		const userToEdit: User = paginatedUsers[index];
		setSingleUser(userToEdit);
		toggleZoomHostModal(index);
	};

	const closeZoomHostModal = (index: number) => {
		const next = [...isZoomHostModalOpen];
		next[index] = false;
		setIsZoomHostModalOpen(next);
	};

	const handleUpdateZoomHostUser = async (index: number) => {
		try {
			const zoomHostUser = (singleUser?.zoomHostUser || '').toString().trim();
			await axios.patch(`${base_url}/users/${singleUser?._id}`, {
				zoomHostUser,
			});
			updateUser({ ...singleUser!, zoomHostUser });
			closeZoomHostModal(index);
		} catch (error) {
			console.error('Update Zoom host user error:', error);
		}
	};

	const handleUpdateUserRole = async (index: number) => {
		if (!singleUser?._id || !singleUser.role) return;

		try {
			await axios.patch(`${base_url}/users/${singleUser._id}`, {
				role: singleUser.role,
			});

			if (isUserHiddenFromViewer(singleUser.role, loggedInUser?.role)) {
				removeUser(singleUser._id);
				if (isSearchActive) {
					removeFromSearchResults(singleUser._id);
				}
			} else {
				updateUser(singleUser);
			}

			closeUserEditModal(index);
		} catch (error) {
			console.error('Update user role error:', error);
		}
	};

	const openDeleteLearningDataModal = (index: number) => {
		const userToEdit: User = paginatedUsers[index];
		setSingleUser(userToEdit);
		const newModalState = [...isDeleteLearningDataModalOpen];
		newModalState[index] = true;
		setIsDeleteLearningDataModalOpen(newModalState);
	};

	const closeDeleteLearningDataModal = (index: number) => {
		const newModalState = [...isDeleteLearningDataModalOpen];
		newModalState[index] = false;
		setIsDeleteLearningDataModalOpen(newModalState);
	};

	const handleDeleteUserLearningData = async (index: number) => {
		if (!singleUser?._id) return;

		setIsDeletingLearningData(true);
		try {
			await axios.delete(`${base_url}/users/${singleUser._id}/learning-data`);
			closeDeleteLearningDataModal(index);
			// Optionally refresh users or show success message
		} catch (error) {
			console.error('Error deleting user learning data:', error);
		} finally {
			setIsDeletingLearningData(false);
		}
	};

	const openDeleteUserModal = (index: number) => {
		const userToEdit: User = paginatedUsers[index];
		setSingleUser(userToEdit);
		const newModalState = [...isDeleteUserModalOpen];
		newModalState[index] = true;
		setIsDeleteUserModalOpen(newModalState);
	};

	const closeDeleteUserModal = (index: number) => {
		const newModalState = [...isDeleteUserModalOpen];
		newModalState[index] = false;
		setIsDeleteUserModalOpen(newModalState);
	};

	const openUserCoursesModal = async (index: number) => {
		const user: User = paginatedUsers[index];
		if (!user._id) return;

		const newModalState = [...isUserCoursesModalOpen];
		newModalState[index] = true;
		setIsUserCoursesModalOpen(newModalState);

		// Set loading state
		setUserCoursesData((prev) => ({
			...prev,
			[user._id!]: { ...prev[user._id!], loading: true },
		}));

		try {
			const response = await axios.get(`${base_url}/userCourses/user/${user._id}/courses`);
			const data = response.data.data;
			setUserCoursesData((prev) => ({
				...prev,
				[user._id!]: {
					courses: data.courses || [],
					loading: false,
				},
			}));
		} catch (err: any) {
			console.error('Error fetching user courses:', err);
			setUserCoursesData((prev) => ({
				...prev,
				[user._id!]: { ...prev[user._id!], loading: false },
			}));
		}
	};

	const closeUserCoursesModal = (index: number) => {
		const newModalState = [...isUserCoursesModalOpen];
		newModalState[index] = false;
		setIsUserCoursesModalOpen(newModalState);
	};

	const toggleCourseExpanded = (courseId: string) => {
		setExpandedCourses((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(courseId)) {
				newSet.delete(courseId);
			} else {
				newSet.add(courseId);
			}
			return newSet;
		});
	};

	const handleDeleteUser = async (index: number) => {
		if (!singleUser?._id) return;

		setIsDeletingUser(true);
		try {
			await axios.delete(`${base_url}/users/${singleUser._id}`);
			removeUser(singleUser._id);
			if (isSearchActive) {
				removeFromSearchResults(singleUser._id);
			}
			closeDeleteUserModal(index);
		} catch (error) {
			console.error('Error deleting user:', error);
		} finally {
			setIsDeletingUser(false);
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
							{ value: 'test learners', label: 'Test Learners' },
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
						totalItems={totalItems || users?.length || 0}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
						actionButtons={[
							{
								label: isMobileSize ? 'Download' : `Download ${isSearchActive ? 'Filtered' : 'All'} Users`,
								onClick: handleDownloadUsers,
								startIcon: <DownloadIcon />,
								disabled: (paginatedUsers && paginatedUsers.length === 0) || isDownloadingUsers,
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
									backgroundColor: theme.bgColor?.secondary,
									boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
									display: 'table',
									tableLayout: 'fixed',
									width: isMobileSize ? '100%' : 'calc(100% - 10rem)',
								},
								'& .MuiTableHead-root .MuiTableCell-root': {
									backgroundColor: theme.bgColor?.secondary,
									padding: '0.75rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableHead-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								'& .MuiTableBody-root .MuiTableCell-root': {
									padding: '0.5rem 1rem',
									boxSizing: 'border-box',
									margin: 0,
									verticalAlign: 'center',
								},
								'& .MuiTableBody-root .MuiTableCell-root:last-child': {
									borderRight: 'none',
								},
								// Column widths for header cells
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isVerySmallScreen ? '35px' : '50px',
									width: isVerySmallScreen ? '7%' : '3%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isVerySmallScreen ? '80px' : '100px',
									width: isVerySmallScreen ? '30%' : '18%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isVerySmallScreen ? '200px' : '100px',
									width: isVerySmallScreen ? '30%' : '12%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isVerySmallScreen ? '100px' : '120px',
									width: isVerySmallScreen ? '33%' : '28%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isVerySmallScreen ? '0px' : '150px',
									width: isVerySmallScreen ? '0%' : '10%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
									minWidth: isVerySmallScreen ? '0px' : '80px',
									width: isVerySmallScreen ? '0%' : '10%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(7)': {
									minWidth: isVerySmallScreen ? '0px' : '120px',
									width: isVerySmallScreen ? '0%' : '20%',
								},
								// Column widths for body cells - exact same as header
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isVerySmallScreen ? '35px' : '50px',
									width: isVerySmallScreen ? '7%' : '3%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isVerySmallScreen ? '80px' : '100px',
									width: isVerySmallScreen ? '30%' : '18%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isVerySmallScreen ? '200px' : '100px',
									width: isVerySmallScreen ? '30%' : '12%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isVerySmallScreen ? '100px' : '120px',
									width: isVerySmallScreen ? '33%' : '28%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isVerySmallScreen ? '0px' : '150px',
									width: isVerySmallScreen ? '0%' : '10%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(6)': {
									minWidth: isVerySmallScreen ? '0px' : '80px',
									width: isVerySmallScreen ? '0%' : '10%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(7)': {
									minWidth: isVerySmallScreen ? '0px' : '120px',
									width: isVerySmallScreen ? '0%' : '20%',
								},
							}}
							size='small'
							aria-label='a dense table'>
							{/* Spacer row to ensure header alignment */}
							<TableBody>
								<TableRow sx={{ height: 0, visibility: 'hidden' }}>
									<TableCell sx={{ width: isVerySmallScreen ? '10%' : '5%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isVerySmallScreen ? '30%' : '18%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isVerySmallScreen ? '30%' : '12%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isVerySmallScreen ? '30%' : '28%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isVerySmallScreen ? '0%' : '10%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isVerySmallScreen ? '0%' : '10%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isVerySmallScreen ? '0%' : '17%', padding: 0, border: 'none' }} />
								</TableRow>
							</TableBody>
							<CustomTableHead<User>
								orderBy={orderBy as any}
								order={order}
								handleSort={(property: any) => handleSort(property as string)}
								columns={getColumns(isVerySmallScreen)}
							/>
							<TableBody>
								{paginatedUsers &&
									paginatedUsers?.map((user: User, index) => {
										const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unnamed User';
										return (
											<TableRow key={user._id} hover>
												<TableCell>
													<Avatar
														src={user.imageUrl || 'https://img.sportsbookreview.com/images/avatars/default-avatar.jpg'}
														sx={{
															width: isVerySmallScreen ? 30 : 38,
															height: isVerySmallScreen ? 30 : 38,
														}}>
													</Avatar>
												</TableCell>
												{!isVerySmallScreen && <CustomTableCell value={fullName} />}
												<CustomTableCell value={user.username} />
												<CustomTableCell value={user.email} />
												{!isVerySmallScreen && <CustomTableCell value={user.isActive ? 'Active' : 'Deactivated'} />}
												{!isVerySmallScreen && (
													<CustomTableCell
														value={
															user.role === Roles.TEST_LEARNER
																? 'Test Learner'
																: user.role?.charAt?.(0)?.toUpperCase?.() + user.role?.slice(1)
														}
													/>
												)}

												<TableCell
													sx={{
														textAlign: 'center',
														padding: isMobileSizeSmall ? '0' : undefined,
													}}>
													<CustomActionBtn
														title='Edit'
														onClick={() => {
															openEditUserModal(index);
														}}
														icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
														disabled={user._id === userId}
													/>

													{(loggedInUser?.role === Roles.OWNER || loggedInUser?.role === Roles.ADMIN || loggedInUser?.role === Roles.SUPER_ADMIN) && (
														<CustomActionBtn
															title='User Courses'
															disabled={!isLearnerRole(user?.role)}
															onClick={() => {
																openUserCoursesModal(index);
															}}
															icon={<Visibility
																fontSize='small' 
																sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
														/>
													)}

													{isUserEditModalOpen[index] && <CustomDialog
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
																	{[Roles.SUPER_ADMIN, Roles.ADMIN, Roles.INSTRUCTOR, Roles.USER, Roles.TEST_LEARNER]
																		.filter((type) => {
																			// Only owner can see super-admin role
																			if (type === Roles.SUPER_ADMIN) {
																				return loggedInUser?.role === Roles.OWNER;
																			}
																			return true;
																		})
																		.map((type) => (
																			<MenuItem
																				value={type}
																				key={type}
																				sx={{
																					fontSize: isMobileSize ? '0.65rem' : '0.85rem',
																					textTransform: type === Roles.TEST_LEARNER ? 'none' : 'capitalize',
																					padding: isMobileSize ? '0.25rem 0.5rem' : undefined,
																					minHeight: '2rem',
																				}}>
																				{type === Roles.TEST_LEARNER ? 'Test Learner' : type}
																			</MenuItem>
																		))}
																</Select>
															</FormControl>
															<CustomDialogActions
																onCancel={() => {
																	closeUserEditModal(index);
																}}
																submitBtnText='Save'
																actionSx={{ mt: '1rem', mb: '0.5rem' }}
																submitBtnType='submit'
															/>
														</form>
													</CustomDialog>}

													{(loggedInUser?.role === Roles.OWNER || loggedInUser?.role === Roles.SUPER_ADMIN) && (
														<>
															<CustomActionBtn
																title='Zoom Host'
																onClick={() => {
																	openZoomHostModal(index);
																}}
																icon={<Videocam fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
																disabled={user._id === userId}
															/>

															{isZoomHostModalOpen[index] && <CustomDialog
																openModal={isZoomHostModalOpen[index]}
																closeModal={() => closeZoomHostModal(index)}
																maxWidth='xs'
																title='Zoom Host'>
																<form
																	style={{ display: 'flex', flexDirection: 'column' }}
																	onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
																		e.preventDefault();
																		await handleUpdateZoomHostUser(index);
																	}}>
																	<Box sx={{ px: '1.5rem', pt: '0.5rem' }}>
																		<Typography
																			variant='body2'
																			sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.75rem', lineHeight: 1.7 }}>
																			Set the Zoom host <b>email address</b> that should own meetings created by this user. Leave empty to use the
																			default shared host.
																		</Typography>
																		<CustomTextField
																			label='Zoom Host Email'
																			value={singleUser?.zoomHostUser || ''}
																			onChange={(e) => setSingleUser((prev) => (prev ? { ...prev, zoomHostUser: e.target.value } : prev))}
																			required={false}
																		/>
																	</Box>
																	<CustomDialogActions
																		onCancel={() => closeZoomHostModal(index)}
																		submitBtnText='Save'
																		actionSx={{ mt: '1rem', mb: '0.5rem' }}
																		submitBtnType='submit'
																	/>
																</form>
															</CustomDialog>}
														</>
													)}

													{loggedInUser?.role === Roles.OWNER && (
														<>
															<CustomActionBtn
																title='Delete Learning Data'
																onClick={() => openDeleteLearningDataModal(index)}
																icon={<DeleteForever fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
																disabled={user._id === userId}
															/>
															<CustomActionBtn
																title='Delete User Account'
																onClick={() => openDeleteUserModal(index)}
																icon={<DeleteForever fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined, color: 'error.main' }} />}
																disabled={user._id === userId}
															/>
														</>
													)}

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

													{loggedInUser?.role === Roles.OWNER && isDeleteLearningDataModalOpen[index] && (
														<CustomDialog
															openModal={isDeleteLearningDataModalOpen[index]}
															closeModal={() => {
																if (!isDeletingLearningData) {
																	closeDeleteLearningDataModal(index);
																}
															}}
															title='Delete User Learning Data'
															maxWidth='xs'>
															<DialogContent>
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7 }}>
																	Are you sure you want to delete all learning data for {singleUser?.firstName} {singleUser?.lastName} ({singleUser?.username})?
																</Typography>
																<Typography
																	variant='body2'
																	sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7, mt: '0.75rem', fontWeight: 600 }}>
																	This will permanently delete:
																</Typography>
																<Box component='ul' sx={{ pl: '1.5rem', mt: '0.5rem', mb: '0.5rem' }}>
																	<Typography component='li' variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		All course enrollments
																	</Typography>
																	<Typography component='li' variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		All lesson progress
																	</Typography>
																	<Typography component='li' variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		All question answers
																	</Typography>
																	<Typography component='li' variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		All quiz submissions
																	</Typography>
																</Box>
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7, mt: '0.75rem' }}>
																	This action cannot be undone.
																</Typography>
															</DialogContent>
															<CustomDialogActions
																onCancel={() => {
																	if (!isDeletingLearningData) {
																		closeDeleteLearningDataModal(index);
																	}
																}}
																onDelete={() => handleDeleteUserLearningData(index)}
																deleteBtn={true}
																deleteBtnText='Delete All Data'
																isDeleting={isDeletingLearningData}
																disableCancelBtn={isDeletingLearningData}
																actionSx={{ marginBottom: '0.5rem' }}
															/>
															</CustomDialog>
													)}

													{loggedInUser?.role === Roles.OWNER && isDeleteUserModalOpen[index] && (
														<CustomDialog
															openModal={isDeleteUserModalOpen[index]}
															closeModal={() => {
																if (!isDeletingUser) {
																	closeDeleteUserModal(index);
																}
															}}
															title='Delete User Account'
															maxWidth='xs'>
															<DialogContent>
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7 }}>
																	Are you sure you want to permanently delete {singleUser?.firstName} {singleUser?.lastName} ({singleUser?.username})?
																</Typography>
																<Typography
																	variant='body2'
																	sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7, mt: '0.75rem', fontWeight: 600 }}>
																	This will permanently delete:
																</Typography>
																<Box component='ul' sx={{ pl: '1.5rem', mt: '0.5rem', mb: '0.5rem' }}>
																	<Typography component='li' variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		User account from MongoDB
																	</Typography>
																	<Typography component='li' variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		User account from Firebase Authentication
																	</Typography>
																	<Typography component='li' variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		All Firestore data (users, notifications, chats)
																	</Typography>
																	<Typography component='li' variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		All learning data (course enrollments, lesson progress, question answers, quiz submissions)
																	</Typography>
																</Box>
																<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', lineHeight: 1.7, mt: '0.75rem' }}>
																	This action cannot be undone. The user will no longer be able to access the system.
																</Typography>
															</DialogContent>
															<CustomDialogActions
																onCancel={() => {
																	if (!isDeletingUser) {
																		closeDeleteUserModal(index);
																	}
																}}
																onDelete={() => handleDeleteUser(index)}
																deleteBtn={true}
																deleteBtnText='Delete User'
																isDeleting={isDeletingUser}
																disableCancelBtn={isDeletingUser}
																actionSx={{ marginBottom: '0.5rem' }}
															/>
														</CustomDialog>
													)}

													{isUserStatusUpdateModalOpen[index] && (
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
																onDelete={async () => {
																	await handleUserStatus(index);
																}}
																onSubmit={async () => {
																	await handleUserStatus(index);
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
						{paginatedUsers && paginatedUsers.length === 0 && (
							<CustomInfoMessageAlignedLeft
								message={isSearchActive ? 'No users found matching your search criteria.' : 'No users found.'}
								sx={{ marginTop: isMobileSize ? '3rem' : '5rem', marginBottom: '1rem' }}
							/>
						)}
						{isMobileSize && !(paginatedUsers && paginatedUsers.length === 0) && (
							<CustomInfoMessageAlignedLeft message='Rotate your device or use desktop for more info' />
						)}
						<CustomTablePagination count={usersNumberOfPages} page={usersCurrentPage} onChange={handlePageChange} />
					</Box>
				</Box>

				{/* User Courses Dialogs */}
				{paginatedUsers &&
					paginatedUsers.map((user: User, index) => {
						const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unnamed User';
						const coursesData = user._id ? userCoursesData[user._id] : undefined;
						return isUserCoursesModalOpen[index] ? (
							<CustomDialog
								key={`user-courses-${user._id || index}`}
								openModal={isUserCoursesModalOpen[index] || false}
								closeModal={() => closeUserCoursesModal(index)}
								title={`Courses - ${fullName}`}
								maxWidth='sm'>
								<DialogContent sx={{ p: '2rem' }}>
									{coursesData?.loading ? (
										<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
											<CircularProgress size={40} />
										</Box>
									) : coursesData?.courses && coursesData.courses.length > 0 ? (
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
											{coursesData.courses.map((course) => {
												const isExpanded = expandedCourses.has(course.courseId);
												return (
													<Box
														key={course.courseId}
														sx={{
															margin: '0.35rem 0 0rem 0',
															width: '100%',
															padding: '0.75rem 0.75rem 0.25rem 0.75rem',
															boxShadow: '0 0.3rem 0.5rem 0 rgba(0,0,0,0.25)',
															transition: '0.3s',
															borderRadius: '0.3rem',
															'&:hover': {
																boxShadow: '0 0.3rem 0.5rem 0.2rem rgba(0,0,0,0.35)',
															},
														}}>
														{/* Course Header - Clickable */}
														<Box
															onClick={() => toggleCourseExpanded(course.courseId)}
															sx={{
																display: 'flex',
																justifyContent: 'space-between',
																alignItems: 'center',
																backgroundColor: theme.bgColor?.adminHeader,
																padding: isMobileSize ? '0.25rem 0.25rem' : '0.25rem 0.5rem',
																borderRadius: '0.35rem',
																marginBottom: '0.5rem',
																transition: 'background-color 0.2s ease',
																cursor: 'pointer',
																gap: '1rem',
																'&:hover': {
																	backgroundColor: theme.bgColor?.adminPaper,
																},
															}}>
															<Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
																<IconButton
																	size='small'
																	sx={{
																		color: 'white',
																		marginRight: isMobileSize ? '0.5rem' : '1rem',
																		padding: '0rem',
																		transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
																		transition: 'transform 0.3s ease',
																		cursor: 'pointer',
																		border: 'solid 0.5px white',
																	}}>
																	{isExpanded ? (
																		<ExpandLess fontSize='small' />
																	) : (
																		<ExpandMore fontSize='small' />
																	)}
																</IconButton>
																<Typography
																	variant='subtitle1'
																	sx={{
																		fontWeight: 'bold',
																		fontSize: isMobileSize ? '0.75rem' : '0.85rem',
																		color: 'white',
																		flex: 1,
																		textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
																	}}>
																	{course.courseTitle}
																</Typography>
															</Box>
														</Box>

														{/* Course Details - Collapsible */}
														<Collapse in={isExpanded}>
															<Box
																sx={{
																	padding: isMobileSize ? '1rem' : '1.5rem',
																	display: 'flex',
																	flexDirection: 'column',
																	gap: '1rem',
																	backgroundColor: theme.bgColor?.common,
																	borderRadius: '0 0 0.35rem 0.35rem',
																}}>
																{/* Registration Date */}
																<Box>
																	<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: '0.5rem' }}>
																		Registration Date:
																	</Typography>
																	<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		{course.registrationDate ? dateFormatter(course.registrationDate) : 'N/A'}
																	</Typography>
																</Box>

																{/* Group Name */}
																{course.groupName && (
																	<Box>
																		<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: '0.5rem' }}>
																			Group:
																		</Typography>
																		<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																			{course.groupName}
																		</Typography>
																	</Box>
																)}

																{/* Progress */}
																<Box>
																	<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: '0.5rem' }}>
																		Progress:
																	</Typography>
																	<Box sx={{ mb: '0.5rem' }}>
																		<LinearProgress
																			variant='determinate'
																			value={course.progressPercentage || 0}
																			sx={{
																				height: 8,
																				borderRadius: 4,
																				backgroundColor: theme.bgColor?.primary,
																				'& .MuiLinearProgress-bar': {
																					backgroundColor: theme.bgColor?.greenSecondary,
																				},
																			}}
																		/>
																	</Box>
																	<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		{course.completedLessons || 0} of {course.totalLessons || 0} lessons completed ({course.progressPercentage || 0}%)
																	</Typography>
																</Box>

																{/* Total Score */}
																<Box>
																	<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: '0.5rem' }}>
																		Total Score:
																	</Typography>
																	<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		{course.totalEarnedScore || 0} / {course.totalPossibleScore || 0} points
																		{course.totalPossibleScore && course.totalPossibleScore > 0
																			? ` (${Math.round(((course.totalEarnedScore || 0) / course.totalPossibleScore) * 100)}%)`
																			: ''}
																	</Typography>
																</Box>

																{/* Rank */}
																<Box>
																	<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.8rem' : '0.9rem', mb: '0.5rem' }}>
																		Rank:
																	</Typography>
																	<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		{course.rank !== null && course.rank !== undefined
																			? `#${course.rank}${course.totalStudents ? ` out of ${course.totalStudents} students` : ''}`
																			: 'N/A'}
																	</Typography>
																</Box>
															</Box>
														</Collapse>
													</Box>
												);
											})}
										</Box>
									) : (
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', textAlign: 'center', py: '2rem' }}>
											No courses found
										</Typography>
									)}
								</DialogContent>
								<DialogActions>
									<CustomCancelButton sx={{ margin: '0 1.35rem 0.5rem 0' }} onClick={() => closeUserCoursesModal(index)}>
										Close
									</CustomCancelButton>
								</DialogActions>
							</CustomDialog>
						) : null;
					})}
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminUsers;
