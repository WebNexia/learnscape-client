import {
	Box,
	Table,
	TableBody,
	TableRow,
	TableCell,
	Typography,
	FormControl,
	Select,
	MenuItem,
	SelectChangeEvent,
	Avatar,
	IconButton,
	DialogContent,
	LinearProgress,
	CircularProgress,
	Tooltip,
	DialogActions,
} from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '@utils/axiosInstance';
import { Edit, Visibility } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import { dateFormatter } from '../utils/dateFormatter';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import theme from '../themes';
import { SingleCourse } from '../interfaces/course';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import { useAuth } from '../hooks/useAuth';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomCancelButton from '../components/forms/customButtons/CustomCancelButton';

interface RosterUser {
	_id?: string;
	username?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	firebaseUserId?: string;
	imageUrl?: string;
	userCourseId?: string;
	currentGroupName?: string | null;
}

// Responsive column configuration
const getColumns = (isMobileSize: boolean) => {
	return isMobileSize
		? [
				{ key: 'avatar', label: '' },
				{ key: 'name', label: 'Name' },
				{ key: 'email', label: 'Email' },
				{ key: 'group', label: 'Group' },
				{ key: 'actions', label: '' },
			]
		: [
				{ key: 'avatar', label: '' },
				{ key: 'name', label: 'Name' },
				{ key: 'username', label: 'Username' },
				{ key: 'email', label: 'Email' },
				{ key: 'group', label: 'Group' },
				{ key: 'actions', label: '' },
			];
};

const CourseRoster = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { courseId } = useParams<{ courseId: string }>();
	const navigate = useNavigate();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { isInstructor, hasAdminAccess } = useAuth();
	const { courses } = useContext(CoursesContext);

	const [course, setCourse] = useState<SingleCourse | null>(null);
	const [roster, setRoster] = useState<RosterUser[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [filterValue, setFilterValue] = useState<string>('');
	const [searchValue, setSearchValue] = useState<string>('');
	const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
	const [updatingUserCourseIds, setUpdatingUserCourseIds] = useState<Set<string>>(new Set());
	const [studentDetailsModalOpen, setStudentDetailsModalOpen] = useState<boolean[]>([]);
	const [studentDetails, setStudentDetails] = useState<{
		[key: string]: {
			registrationDate?: string;
			progressPercentage?: number;
			completedLessons?: number;
			totalLessons?: number;
			totalEarnedScore?: number;
			totalPossibleScore?: number;
			rank?: number | null;
			totalStudents?: number;
			loading?: boolean;
		};
	}>({});

	const pageSize = 100;
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalItems, setTotalItems] = useState<number>(0);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [orderBy, setOrderBy] = useState<string>('name');
	const [order, setOrder] = useState<'asc' | 'desc'>('asc');
	const [searchedValue, setSearchedValue] = useState<string>('');
	const [searchButtonClicked, setSearchButtonClicked] = useState<boolean>(false);

	// Get course from context or fetch if not available
	useEffect(() => {
		if (!courseId) return;

		// Try to find course in context first
		const courseFromContext = courses?.find((c) => c._id === courseId);
		if (courseFromContext) {
			setCourse(courseFromContext);
			return;
		}

		// If not in context, fetch it
		const fetchCourse = async () => {
			try {
				const endpoint = isInstructor ? `/courses/instructor/${courseId}` : `/courses/${courseId}`;
				const response = await axios.get(`${base_url}${endpoint}`);
				const courseData = response.data.data;
				setCourse(courseData);
			} catch (err: any) {
				setError(err.response?.data?.message || 'Failed to load course');
			}
		};
		fetchCourse();
	}, [courseId, base_url, isInstructor, courses]);

	// Fetch roster - with filter, search, and pagination from backend (sorting done on FE)
	useEffect(() => {
		const fetchRoster = async () => {
			if (!courseId) return;
			setLoading(true);
			try {
				const params = new URLSearchParams();
				params.append('page', currentPage.toString());
				params.append('limit', pageSize.toString());
				if (filterValue && filterValue.trim()) {
					// Send groupName directly (backend will handle conversion)
					params.append('groupName', filterValue === 'unassigned' ? '' : filterValue);
				}
				if (searchButtonClicked && searchedValue.trim()) {
					params.append('search', searchedValue.trim());
				}
				const response = await axios.get(`${base_url}/userCourses/course/${courseId}?${params.toString()}`);
				setRoster(response.data.users || []);
				setTotalItems(response.data.totalItems || 0);
				setTotalPages(response.data.totalPages || 1);
			} catch (err: any) {
				setError(err.response?.data?.message || 'Failed to load roster');
			} finally {
				setLoading(false);
			}
		};
		fetchRoster();
	}, [courseId, filterValue, base_url, searchedValue, searchButtonClicked, currentPage, pageSize]);

	// Sort roster on frontend
	const sortedRoster = useMemo(() => {
		if (!roster || roster.length === 0) return [];
		
		const sorted = [...roster].sort((a, b) => {
			let aValue = '';
			let bValue = '';

			if (orderBy === 'name') {
				const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username || '';
				const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.username || '';
				aValue = aName.toLowerCase();
				bValue = bName.toLowerCase();
			} else if (orderBy === 'username') {
				aValue = (a.username || '').toLowerCase();
				bValue = (b.username || '').toLowerCase();
			} else if (orderBy === 'email') {
				aValue = (a.email || '').toLowerCase();
				bValue = (b.email || '').toLowerCase();
			} else {
				aValue = (a[orderBy as keyof RosterUser] || '').toString().toLowerCase();
				bValue = (b[orderBy as keyof RosterUser] || '').toString().toLowerCase();
			}

			if (order === 'asc') {
				return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
			} else {
				return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
			}
		});

		return sorted;
	}, [roster, orderBy, order]);

	// Use sorted roster (already filtered and searched from backend, sorted on FE)
	const paginatedRoster = sortedRoster;

	// Initialize modal state array when roster changes
	useEffect(() => {
		setStudentDetailsModalOpen(new Array(paginatedRoster.length).fill(false));
	}, [paginatedRoster.length]);

	// Function to open student details modal and fetch data
	const openStudentDetailsModal = async (index: number, userId: string) => {
		if (!courseId || !userId) return;

		// Open modal
		const newModalState = [...studentDetailsModalOpen];
		newModalState[index] = true;
		setStudentDetailsModalOpen(newModalState);

		// Set loading state
		setStudentDetails((prev) => ({
			...prev,
			[userId]: { ...prev[userId], loading: true },
		}));

		try {
			const response = await axios.get(`${base_url}/userCourses/student/${courseId}/${userId}`);
			const data = response.data.data;
			setStudentDetails((prev) => ({
				...prev,
				[userId]: {
					registrationDate: data.registrationDate,
					progressPercentage: data.progressPercentage,
					completedLessons: data.completedLessons,
					totalLessons: data.totalLessons,
					totalEarnedScore: data.totalEarnedScore,
					totalPossibleScore: data.totalPossibleScore,
					rank: data.rank,
					totalStudents: data.totalStudents,
					loading: false,
				},
			}));
		} catch (err: any) {
			console.error('Error fetching student details:', err);
			setStudentDetails((prev) => ({
				...prev,
				[userId]: { ...prev[userId], loading: false },
			}));
		}
	};

	const closeStudentDetailsModal = (index: number) => {
		const newModalState = [...studentDetailsModalOpen];
		newModalState[index] = false;
		setStudentDetailsModalOpen(newModalState);
	};

	// Build filter options from course groups - use group names directly
	const filterOptions = useMemo(() => {
		const options = [{ value: '', label: 'All Learners' }, { value: 'unassigned', label: 'Unassigned' }];
		if (course?.groups && Array.isArray(course.groups) && course.groups.length > 0) {
			course.groups.forEach((group: any) => {
				const groupName = group.name;
				if (groupName) {
					options.push({ value: groupName, label: groupName });
				}
			});
		}
		return options;
	}, [course]);

	const handleGroupChange = async (userCourseId: string, newGroupName: string | null, currentGroupName: string) => {
		if (!userCourseId) return;

		const newGroupNameStr = newGroupName || '';
		const currentGroupNameStr = currentGroupName || '';
		if (newGroupNameStr === currentGroupNameStr) return;

		setUpdatingUserCourseIds((prev) => new Set(prev).add(userCourseId));

		try {
			await axios.patch(`${base_url}/userCourses/${userCourseId}`, {
				groupName: newGroupName || null,
			});

			// Refresh roster - preserve search and filter (sorting done on FE)
			const params = new URLSearchParams();
			params.append('page', currentPage.toString());
			params.append('limit', pageSize.toString());
			if (filterValue && filterValue.trim()) {
				params.append('groupName', filterValue === 'unassigned' ? '' : filterValue);
			}
			if (searchButtonClicked && searchedValue.trim()) {
				params.append('search', searchedValue.trim());
			}
			const response = await axios.get(`${base_url}/userCourses/course/${courseId}?${params.toString()}`);
			setRoster(response.data.users || []);
			setTotalItems(response.data.totalItems || 0);
			setTotalPages(response.data.totalPages || 1);
			setSelectedUserIds(new Set()); // Clear selection after update
		} catch (error) {
			console.error('Error updating student group:', error);
		} finally {
			setUpdatingUserCourseIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(userCourseId);
				return newSet;
			});
		}
	};

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			const allIds = paginatedRoster.map((user) => user.userCourseId).filter((id): id is string => !!id);
			setSelectedUserIds(new Set(allIds));
		} else {
			setSelectedUserIds(new Set());
		}
	};

	const handleSearch = () => {
		setSearchedValue(searchValue.trim());
		setSearchButtonClicked(true);
		setCurrentPage(1);
	};

	const handleFilterChange = (newFilterValue: string) => {
		setFilterValue(newFilterValue);
		setCurrentPage(1); // Reset to first page when filter changes, but keep search active
	};

	const handleSort = (property: string | number) => {
		const propertyStr = String(property);
		// Only allow sorting on sortable columns
		if (['name', 'username', 'email'].includes(propertyStr)) {
			const isAsc = orderBy === propertyStr && order === 'asc';
			setOrder(isAsc ? 'desc' : 'asc');
			setOrderBy(propertyStr);
		}
	};

	const handlePageChange = (newPage: number) => {
		setCurrentPage(newPage);
	};

	const resetSearch = () => {
		setSearchValue('');
		setSearchedValue('');
		setSearchButtonClicked(false);
		setCurrentPage(1);
	};

	const resetFilter = () => {
		setFilterValue('');
		setCurrentPage(1);
	};

	const resetAll = () => {
		setSearchValue('');
		setFilterValue('');
		setSearchedValue('');
		setSearchButtonClicked(false);
		setCurrentPage(1);
	};

	// isSearchActive should be true when search OR filter is active (for FilterSearchRow chip display)
	// But we track search separately for the actual search functionality
	const isSearchActive = (searchButtonClicked && !!searchedValue.trim()) || !!(filterValue && filterValue.trim());
	const searchResultsTotalItems = totalItems;

	const handleDownloadRoster = async () => {
		try {
			// Fetch all roster data for export (without pagination, but with filter/search)
			const params = new URLSearchParams();
			params.append('limit', '10000'); // Large limit to get all data
			params.append('page', '1');
			if (filterValue && filterValue.trim()) {
				params.append('groupName', filterValue === 'unassigned' ? '' : filterValue);
			}
			if (isSearchActive && searchedValue.trim()) {
				params.append('search', searchedValue.trim());
			}
			const response = await axios.get(`${base_url}/userCourses/course/${courseId}?${params.toString()}`);
			let dataToExport = response.data.users || [];
			
			// Apply sorting to exported data (same as display)
			dataToExport = dataToExport.sort((a: RosterUser, b: RosterUser) => {
				let aValue = '';
				let bValue = '';

				if (orderBy === 'name') {
					const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username || '';
					const bName = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.username || '';
					aValue = aName.toLowerCase();
					bValue = bName.toLowerCase();
				} else if (orderBy === 'username') {
					aValue = (a.username || '').toLowerCase();
					bValue = (b.username || '').toLowerCase();
				} else if (orderBy === 'email') {
					aValue = (a.email || '').toLowerCase();
					bValue = (b.email || '').toLowerCase();
				} else {
					aValue = (a[orderBy as keyof RosterUser] || '').toString().toLowerCase();
					bValue = (b[orderBy as keyof RosterUser] || '').toString().toLowerCase();
				}

				if (order === 'asc') {
					return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
				} else {
					return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
				}
			});

			// Format data for Excel
			const excelData = dataToExport.map((user: RosterUser) => {
				const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unnamed User';
				const groupName = user.currentGroupName || 'Unassigned';

				return {
					'First Name': user.firstName || '',
					'Last Name': user.lastName || '',
					'Full Name': fullName,
					'Username': user.username || '',
					'Email': user.email || '',
					'Group': groupName,
				};
			});

			// Create and download Excel file
			const XLSX = await import('xlsx');
			const ws = XLSX.utils.json_to_sheet(excelData);
			const wb = XLSX.utils.book_new();
			const fileName = course
				? `${course.title.replace(/[^a-z0-9]/gi, '_')}_Roster_${new Date().toISOString().split('T')[0]}.xlsx`
				: `Course_Roster_${new Date().toISOString().split('T')[0]}.xlsx`;
			XLSX.utils.book_append_sheet(wb, ws, 'Roster');
			XLSX.writeFile(wb, fileName);
		} catch (error) {
			console.error('Download error:', error);
		}
	};

	if (error) {
		return (
			<DashboardPagesLayout pageName='Course Roster'>
				<CustomInfoMessageAlignedLeft message={error} />
			</DashboardPagesLayout>
		);
	}

	return (
		<AdminPageErrorBoundary pageName={`Course Roster${course ? ` - ${course.title}` : ''}`}>
			<DashboardPagesLayout pageName={isMobileSize ? (course?.title || 'Course Roster') : `Roster${course ? ` - ${course.title}` : ''}`} customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			

				<FilterSearchRow
					filterValue={filterValue}
					onFilterChange={handleFilterChange}
					filterOptions={filterOptions}
					filterPlaceholder='Filter by Group'
					searchValue={searchValue}
					onSearchChange={setSearchValue}
					onSearch={handleSearch}
					onReset={resetAll}
					searchPlaceholder='Search by name, username, or email'
					isSearchActive={isSearchActive}
					isSearchLoading={false}
					searchResultsTotalItems={searchResultsTotalItems}
					totalItems={roster.length}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					actionButtons={[
						{
							label: isMobileSize ? 'Download' : `Download ${(filterValue && filterValue.trim()) || isSearchActive ? 'Filtered' : 'All'} Roster`,
							onClick: handleDownloadRoster,
							startIcon: <DownloadIcon />,
							disabled: paginatedRoster && paginatedRoster.length === 0,
						},
						{
							label: isMobileSize ? 'Course' : 'Edit Course',
							onClick: () => {
								if (!courseId) return;
								const basePath = hasAdminAccess ? '/admin' : '/instructor';
								navigate(`${basePath}/course-edit/course/${courseId}`);
							},
							startIcon: <Edit />,
						},
					]}
					isSticky={true}
				/>

				{loading ? (
					<AdminTableSkeleton />
				) : (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							padding: isMobileSize ? '0rem 0.25rem 2rem 0.25rem' : '0rem 0rem 2rem 0rem',
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
										(isSearchActive && searchedValue) || (isSearchActive && filterValue && filterValue.trim())
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
									fontWeight: 600,
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
									minWidth: isMobileSize ? '40px' : '50px',
									width: isMobileSize ? '10%' : '5%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isMobileSize ? '40px' : '50px',
									width: isMobileSize ? '15%' : '15%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isMobileSize ? '100px' : '150px',
									width: isMobileSize ? '30%' : '25%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isMobileSize ? '0px' : '120px',
									width: isMobileSize ? '35%' : '20%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isMobileSize ? '120px' : '150px',
									width: isMobileSize ? '10%' : '25%',
								},
								'& .MuiTableHead-root .MuiTableCell-root:nth-of-type(6)': {
									minWidth: isMobileSize ? '120px' : '150px',
									width: isMobileSize ? '0%' : '5%',
								},
							
								// Column widths for body cells - exact same as header
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(1)': {
									minWidth: isMobileSize ? '40px' : '50px',
									width: isMobileSize ? '10%' : '5%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(2)': {
									minWidth: isMobileSize ? '40px' : '50px',
									width: isMobileSize ? '15%' : '15%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3)': {
									minWidth: isMobileSize ? '100px' : '150px',
									width: isMobileSize ? '30%' : '25%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(4)': {
									minWidth: isMobileSize ? '0px' : '120px',
									width: isMobileSize ? '35%' : '20%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
									minWidth: isMobileSize ? '120px' : '150px',
									width: isMobileSize ? '10%' : '25%',
								},
								'& .MuiTableBody-root .MuiTableCell-root:nth-of-type(6)': {
									minWidth: isMobileSize ? '120px' : '150px',
									width: isMobileSize ? '0%' : '5%',
								},
							
							}}
							size='small'
							aria-label='roster table'>
							<TableBody>
								<TableRow sx={{visibility: 'hidden' }}>
									<TableCell sx={{ width: isMobileSize ? '10%' : '5%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '15%' : '15%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '30%' : '25%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '35%' : '20%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '10%' : '25%', padding: 0, border: 'none' }} />
									<TableCell sx={{ width: isMobileSize ? '0%' : '5%', padding: 0, border: 'none' }} />
								</TableRow>
							</TableBody>
							<CustomTableHead
								orderBy={orderBy as any}
								order={order}
								handleSort={handleSort}
								columns={getColumns(isMobileSize)}
								selectAll={selectedUserIds.size === paginatedRoster.length && paginatedRoster.length > 0}
								onSelectAll={handleSelectAll}
							/>
							<TableBody>
								{paginatedRoster.length === 0 ? (
									<TableRow>
										<TableCell colSpan={getColumns(isMobileSize).length} align='center' sx={{ py: '2rem' }}>
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												No students found
											</Typography>
										</TableCell>
									</TableRow>
								) : (
									paginatedRoster.map((user, index) => {
										const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unnamed User';
										const isUpdating = updatingUserCourseIds.has(user.userCourseId || '');
										const currentGroupName = user.currentGroupName || '';

										return (
											<TableRow key={user.userCourseId || index} hover>
												<TableCell>
													<Avatar
														src={user.imageUrl}
														sx={{
															width: isMobileSize ? 32 : 40,
															height: isMobileSize ? 32 : 40,
															bgcolor: theme.bgColor?.primary,
														}}>
														{fullName.charAt(0).toUpperCase()}
													</Avatar>
												</TableCell>
												<CustomTableCell value={fullName} />
												<CustomTableCell value={user.username || 'N/A'} />
												{!isMobileSize && <CustomTableCell value={user.email || 'N/A'} />}
												<TableCell sx={{ textAlign:'center'}}>
													<FormControl size='small' sx={{ minWidth: isMobileSize ? '6.5rem' : '10rem' }}>
														<Select
															value={currentGroupName}
															onChange={(e: SelectChangeEvent<string>) => {
																if (user.userCourseId) {
																	handleGroupChange(user.userCourseId, e.target.value || null, currentGroupName);
																}
															}}
															disabled={isUpdating}
															displayEmpty
															renderValue={(selected) => {
																if (!selected || selected === '') {
																	return <Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>Unassigned</Typography>;
																}
																return <Typography sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>{selected}</Typography>;
															}}
															sx={{
																fontSize: isMobileSize ? '0.7rem' : '0.75rem',
																backgroundColor: theme.bgColor?.common,
															}}>
															<MenuItem value='' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
																Unassigned
															</MenuItem>
															{course?.groups?.map((group) => (
																<MenuItem key={group._id || group.name} value={group.name || ''} sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
																	{group.name}
																</MenuItem>
															))}
														</Select>
													</FormControl>
												</TableCell>
												<TableCell sx={{ textAlign: 'center' }}>
													<Tooltip title='Progress' placement='top' arrow>
													<IconButton
														size='small'
														onClick={() => {
															if (user._id) {
																openStudentDetailsModal(index, user._id);
															}
														}}
														sx={{
															padding: isMobileSize ? '0.25rem' : '0.5rem',
														}}>
														<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem', color: theme.textColor?.primary.main }} />
													</IconButton>
													</Tooltip>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>

						{/* Pagination */}
						<CustomTablePagination
							count={totalPages}
							page={currentPage}
							onChange={handlePageChange}
						/>
					</Box>
				)}

				{/* Student Details Dialogs */}
				{paginatedRoster.map((user, index) => {
					const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unnamed User';
					const details = user._id ? studentDetails[user._id] : undefined;
					return (
						<CustomDialog
							key={`student-details-${user._id || index}`}
							openModal={studentDetailsModalOpen[index] || false}
							closeModal={() => closeStudentDetailsModal(index)}
							title={`Student Details - ${fullName}`}
							maxWidth='sm'>
							<DialogContent sx={{ p: '2rem' }}>
								{details?.loading ? (
									<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
										<CircularProgress size={40} />
									</Box>
								) : details ? (
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
										{/* Registration Date */}
										<Box>
											<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.85rem' : '0.95rem', mb: '0.5rem' }}>
												Registration Date:
											</Typography>
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												{details.registrationDate ? dateFormatter(details.registrationDate) : 'N/A'}
											</Typography>
										</Box>

										{/* Progress */}
										<Box>
											<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.85rem' : '0.95rem', mb: '0.5rem' }}>
												Progress:
											</Typography>
											<Box sx={{ mb: '0.5rem' }}>
												<LinearProgress
													variant='determinate'
													value={details.progressPercentage || 0}
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
												{details.completedLessons || 0} of {details.totalLessons || 0} lessons completed ({details.progressPercentage || 0}%)
											</Typography>
										</Box>

										{/* Total Score */}
										<Box>
											<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.85rem' : '0.95rem', mb: '0.5rem' }}>
												Total Score:
											</Typography>
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												{details.totalEarnedScore || 0} / {details.totalPossibleScore || 0} points
												{details.totalPossibleScore && details.totalPossibleScore > 0
													? ` (${Math.round(((details.totalEarnedScore || 0) / details.totalPossibleScore) * 100)}%)`
													: ''}
											</Typography>
										</Box>

										{/* Rank */}
										<Box>
											<Typography variant='subtitle2' sx={{ fontWeight: 'bold', fontSize: isMobileSize ? '0.85rem' : '0.95rem', mb: '0.5rem' }}>
												Rank:
											</Typography>
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												{details.rank !== null && details.rank !== undefined
													? `#${details.rank}${details.totalStudents ? ` out of ${details.totalStudents} students` : ''}`
													: 'N/A'}
											</Typography>
										</Box>
									</Box>
								) : (
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										No details available
									</Typography>
								)}
							</DialogContent>
							<DialogActions>
								<CustomCancelButton 
								sx={{margin:'0 0.5rem 0.5rem 0'}}onClick={() => closeStudentDetailsModal(index)}>Close</CustomCancelButton>
							</DialogActions>
						</CustomDialog>
					);
				})}
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default CourseRoster;
