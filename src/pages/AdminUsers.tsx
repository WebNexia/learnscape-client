import { Alert, Box, Button, Checkbox, DialogContent, FormControl, FormControlLabel, MenuItem, Select, Table, TableBody, TableCell, TableRow, Typography, Avatar, IconButton, Collapse, LinearProgress, CircularProgress, DialogActions, TextField } from '@mui/material';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useContext, useEffect, useState } from 'react';
import axios from '@utils/axiosInstance';
import { Edit, Person, PersonOff, Videocam, DeleteForever, Visibility, ExpandMore, ExpandLess, PersonAdd, GroupAdd } from '@mui/icons-material';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
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
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import { dateFormatter } from '../utils/dateFormatter';

const BULK_ACCOUNT_LIMIT = 50;

type BulkAccountRow = {
	line: number;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	countryCode: string;
	error: string;
};

type BulkAccountResult = {
	row: number;
	email: string;
	status: string;
	message: string;
	emailSent?: boolean;
	username?: string;
	password?: string;
	userId?: string;
};

const splitBulkLine = (line: string) => {
	const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
	return line.split(delimiter).map((part) => part.trim().replace(/^["']|["']$/g, ''));
};

const parseBulkAccounts = (raw: string): { rows: BulkAccountRow[]; tooMany: boolean; wrongFormat: boolean } => {
	const lines = raw
		.replace(/^\uFEFF/, '')
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
	if (lines.length === 0) return { rows: [], tooMany: false, wrongFormat: false };

	const firstCell = splitBulkLine(lines[0])[0] || '';
	const hasHeader = /^(ad|isim|first\s*name|firstname|name)$/i.test(firstCell);
	const dataLines = hasHeader ? lines.slice(1) : lines;
	const tooMany = dataLines.length > BULK_ACCOUNT_LIMIT;
	const wrongFormat = dataLines.length > 0 && dataLines.every((line) => splitBulkLine(line).length < 4);
	const limited = dataLines.slice(0, BULK_ACCOUNT_LIMIT);
	const seen = new Set<string>();

	const rows = limited.map((line, index) => {
		const cells = splitBulkLine(line);
		const [firstName = '', lastName = '', email = '', phone = '', country = ''] = cells;
		const countryCode = (country || 'TR').trim().toUpperCase().slice(0, 2) || 'TR';
		const normalizedEmail = email.trim().toLowerCase();
		let error = '';
		if (cells.length < 4) error = 'Ad, soyad, e-posta ve telefon gerekli.';
		else if (!firstName || !lastName) error = 'Ad ve soyad gerekli.';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) error = 'E-posta geçersiz.';
		else if (phone.replace(/\D/g, '').length < 7) error = 'Telefon geçersiz.';
		else if (seen.has(normalizedEmail)) error = 'Bu e-posta listede tekrar ediyor.';
		if (normalizedEmail) seen.add(normalizedEmail);
		return { line: index + 1, firstName, lastName, email: normalizedEmail, phone, countryCode, error };
	});

	return { rows, tooMany, wrongFormat };
};

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

	const { users, loading, error, fetchUsers, fetchMoreUsers, updateUser, removeUser, totalItems, loadedPages, setUsersPageNumber } =
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
				hasPaid?: boolean;
			}>;
			loading: boolean;
		};
	}>({});
	const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
	const [isDeletingLearningData, setIsDeletingLearningData] = useState<boolean>(false);
	const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);
	const [isDownloadingUsers, setIsDownloadingUsers] = useState<boolean>(false);
	const [singleUser, setSingleUser] = useState<User | null>(null);
	const [editUserMessage, setEditUserMessage] = useState('');
	const [editUserCanMove, setEditUserCanMove] = useState(false);
	const [editUserSubmitting, setEditUserSubmitting] = useState(false);
	const [createAccountOpen, setCreateAccountOpen] = useState(false);
	const [createFirstName, setCreateFirstName] = useState('');
	const [createLastName, setCreateLastName] = useState('');
	const [createEmail, setCreateEmail] = useState('');
	const [createPhone, setCreatePhone] = useState('');
	const [createCountryCode, setCreateCountryCode] = useState('TR');
	const [createAccountError, setCreateAccountError] = useState('');
	const [createAccountSuccess, setCreateAccountSuccess] = useState('');
	const [createAccountSubmitting, setCreateAccountSubmitting] = useState(false);
	const [createAccountFallback, setCreateAccountFallback] = useState<{ username: string; password: string } | null>(null);
	const [createCourseId, setCreateCourseId] = useState('');
	const [createGroupId, setCreateGroupId] = useState('');
	const [createGroups, setCreateGroups] = useState<Array<{ _id: string; name: string }>>([]);
	const [sendCreatePaymentLink, setSendCreatePaymentLink] = useState(false);
	const [copyCreatePaymentLink, setCopyCreatePaymentLink] = useState(false);
	const [createPaymentLinkUrl, setCreatePaymentLinkUrl] = useState('');
	const [createConfirmMode, setCreateConfirmMode] = useState<'single' | 'bulk' | null>(null);
	const [bulkAccountOpen, setBulkAccountOpen] = useState(false);
	const [bulkAccountText, setBulkAccountText] = useState('');
	const [bulkAccountRows, setBulkAccountRows] = useState<BulkAccountRow[]>([]);
	const [bulkAccountError, setBulkAccountError] = useState('');
	const [bulkAccountSubmitting, setBulkAccountSubmitting] = useState(false);
	const [bulkAccountResults, setBulkAccountResults] = useState<BulkAccountResult[] | null>(null);
	const [bulkAccountTooMany, setBulkAccountTooMany] = useState(false);
	const [bulkAccountWrongFormat, setBulkAccountWrongFormat] = useState(false);
	const [bulkAccountFileName, setBulkAccountFileName] = useState('');
	const [bulkAccountFileIssue, setBulkAccountFileIssue] = useState('');
	const [enrollFormUserId, setEnrollFormUserId] = useState<string | null>(null);
	const [courseOptions, setCourseOptions] = useState<Array<{ _id: string; title: string; isTestCourse?: boolean }>>([]);
	const [courseOptionsLoading, setCourseOptionsLoading] = useState(false);
	const [selectedEnrollCourseId, setSelectedEnrollCourseId] = useState('');
	const [enrollGroups, setEnrollGroups] = useState<Array<{ _id: string; name: string }>>([]);
	const [selectedEnrollGroupId, setSelectedEnrollGroupId] = useState('');
	const [enrollError, setEnrollError] = useState('');
	const [enrollSubmitting, setEnrollSubmitting] = useState(false);
	const [paymentLinkSubmitting, setPaymentLinkSubmitting] = useState(false);
	const [paymentLinkCopying, setPaymentLinkCopying] = useState(false);
	const [paymentLinkMessage, setPaymentLinkMessage] = useState('');
	const [paymentLinkUrl, setPaymentLinkUrl] = useState('');
	const [enrolledLinkCourseId, setEnrolledLinkCourseId] = useState('');
	const [enrolledLinkBusy, setEnrolledLinkBusy] = useState<'send' | 'copy' | null>(null);
	const [enrolledLinkMessage, setEnrolledLinkMessage] = useState('');
	const [enrolledLinkError, setEnrolledLinkError] = useState('');
	const [enrolledLinkUrl, setEnrolledLinkUrl] = useState('');

	useEffect(() => {
		if (orgId) fetchUsers();
		// Reload so email verification and course enrollment come from the current records.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [orgId]);

	useEffect(() => {
		setIsUserStatusUpdateModalOpen(Array(paginatedUsers.length).fill(false));
		setIsUserEditModalOpen(Array(paginatedUsers.length).fill(false));
		setIsZoomHostModalOpen(Array(paginatedUsers.length).fill(false));
		setIsDeleteLearningDataModalOpen(Array(paginatedUsers.length).fill(false));
		setIsDeleteUserModalOpen(Array(paginatedUsers.length).fill(false));
		setIsUserCoursesModalOpen(Array(paginatedUsers.length).fill(false));
	}, [usersCurrentPage, filterValue, searchValue]);

	const resetCreateAccountForm = () => {
		setCreateFirstName('');
		setCreateLastName('');
		setCreateEmail('');
		setCreatePhone('');
		setCreateCountryCode('TR');
		setCreateAccountError('');
		setCreateAccountSuccess('');
		setCreateAccountFallback(null);
		setCreateCourseId('');
		setCreateGroupId('');
		setCreateGroups([]);
		setSendCreatePaymentLink(false);
		setCopyCreatePaymentLink(false);
		setCreatePaymentLinkUrl('');
	};

	const resetBulkAccountForm = () => {
		setBulkAccountText('');
		setBulkAccountRows([]);
		setBulkAccountError('');
		setBulkAccountResults(null);
		setBulkAccountTooMany(false);
		setBulkAccountWrongFormat(false);
		setBulkAccountFileName('');
		setBulkAccountFileIssue('');
		setBulkAccountSubmitting(false);
		setCreateCourseId('');
		setCreateGroupId('');
		setCreateGroups([]);
		setSendCreatePaymentLink(false);
		setCopyCreatePaymentLink(false);
		setCreatePaymentLinkUrl('');
	};

	const previewBulkAccounts = (value: string, fileName = '') => {
		setBulkAccountText(value);
		setBulkAccountResults(null);
		setBulkAccountFileName(fileName);
		setBulkAccountFileIssue('');
		const parsed = parseBulkAccounts(value);
		setBulkAccountRows(parsed.rows);
		setBulkAccountTooMany(parsed.tooMany);
		setBulkAccountWrongFormat(parsed.wrongFormat);
		setBulkAccountError('');
	};

	const loadBulkAccountFile = async (file: File | undefined) => {
		if (!file) return;
		const name = file.name.toLowerCase();
		if (!name.endsWith('.csv') && !name.endsWith('.txt')) {
			setBulkAccountText('');
			setBulkAccountRows([]);
			setBulkAccountResults(null);
			setBulkAccountTooMany(false);
			setBulkAccountWrongFormat(false);
			setBulkAccountFileName(file.name);
			setBulkAccountFileIssue(`"${file.name}" uygun değil. Yalnızca CSV yükleyin. Excel'de Farklı Kaydet ve CSV seçin.`);
			return;
		}
		const text = await file.text();
		previewBulkAccounts(text, file.name);
	};

	const selectCreateCourse = async (courseId: string) => {
		setCreateCourseId(courseId);
		setCreateGroupId('');
		setCreateGroups([]);
		if (!courseId) {
			setSendCreatePaymentLink(false);
			setCopyCreatePaymentLink(false);
			return;
		}
		try {
			const response = await axios.get(`${base_url}/courses/${courseId}/staff-info`);
			const groups = (response.data?.data?.groups || []) as Array<{ _id?: string; name?: string }>;
			setCreateGroups(groups.filter((group): group is { _id: string; name: string } => Boolean(group._id && group.name)));
		} catch {
			setCreateGroups([]);
		}
	};

	const enrollCreatedUser = async (userId: string) => {
		await axios.post(`${base_url}/userCourses/`, {
			userId,
			courseId: createCourseId,
			orgId,
			manualEnrollment: true,
			...(createGroupId ? { groupId: createGroupId } : {}),
		});
	};

	const sendCreatedPaymentLink = async (userId: string, sendEmail = true) => {
		const response = await axios.post(`${base_url}/payments/admin/course-link`, {
			userId,
			courseId: createCourseId,
			sendEmail,
			...(createGroupId ? { groupId: createGroupId } : {}),
		});
		return (response.data?.checkoutUrl || '') as string;
	};

	const copyPaymentLinkUrl = async (url: string) => {
		await navigator.clipboard.writeText(url);
	};

	const requestCreateConfirm = (mode: 'single' | 'bulk') => {
		if (mode === 'single') {
			setCreateAccountError('');
			if (!createFirstName.trim() || !createLastName.trim() || !createEmail.trim() || createPhone.replace(/\D/g, '').length < 7) {
				setCreateAccountError('First name, last name, email, country, and phone are required.');
				return;
			}
		} else {
			setBulkAccountError('');
			if (bulkAccountRows.filter((row) => !row.error).length === 0) {
				setBulkAccountError('Add at least one valid person.');
				return;
			}
		}
		if ((sendCreatePaymentLink || (mode === 'single' && copyCreatePaymentLink)) && !createCourseId) {
			const message = 'Select a course to send the payment link.';
			if (mode === 'single') setCreateAccountError(message);
			else setBulkAccountError(message);
			return;
		}
		if (createCourseId && createGroups.length > 0 && !createGroupId) {
			const message = 'Select a group.';
			if (mode === 'single') setCreateAccountError(message);
			else setBulkAccountError(message);
			return;
		}
		setCreateConfirmMode(mode);
	};

	const submitBulkAccounts = async () => {
		if (bulkAccountTooMany || bulkAccountWrongFormat || bulkAccountRows.some((row) => row.error)) return;
		const ready = bulkAccountRows.filter((row) => !row.error);
		if (ready.length === 0) {
			setBulkAccountError('Add at least one valid person.');
			return;
		}
		if (createCourseId && createGroups.length > 0 && !createGroupId) {
			setBulkAccountError('Select a group.');
			return;
		}
		setBulkAccountSubmitting(true);
		setBulkAccountError('');
		try {
			const response = await axios.post(`${base_url}/users/admin-create-bulk`, {
				users: ready.map((row) => ({
					row: row.line,
					firstName: row.firstName,
					lastName: row.lastName,
					email: row.email,
					phone: row.phone,
					countryCode: row.countryCode,
				})),
			});
			const createdResults = (response.data?.results || []) as BulkAccountResult[];
			if (createCourseId) {
				for (const result of createdResults) {
					if (result.status !== 'created' || !result.userId) continue;
					try {
						await enrollCreatedUser(result.userId);
						result.message = `${result.message} Kursa eklendi.`;
					} catch (error: any) {
						result.message = `${result.message} Kursa eklenemedi: ${error?.response?.data?.message || 'enrollment failed.'}`;
					}
					if (!sendCreatePaymentLink) continue;
					try {
						await sendCreatedPaymentLink(result.userId);
						result.message = `${result.message} Ödeme bağlantısı gönderildi.`;
					} catch (error: any) {
						result.message = `${result.message} Ödeme bağlantısı gönderilemedi: ${error?.response?.data?.message || 'payment link failed.'}`;
					}
				}
			}
			const invalidResults: BulkAccountResult[] = bulkAccountRows
				.filter((row) => row.error)
				.map((row) => ({ row: row.line, email: row.email, status: 'invalid', message: row.error }));
			setBulkAccountResults([...createdResults, ...invalidResults].sort((a, b) => a.row - b.row));
			if ((response.data?.created || 0) > 0) await fetchUsers();
		} catch (error: any) {
			setBulkAccountError(error?.response?.data?.message || 'Could not create the accounts.');
		} finally {
			setBulkAccountSubmitting(false);
		}
	};

	const submitCreateAccount = async () => {
		setCreateAccountError('');
		setCreateAccountSuccess('');
		setCreateAccountFallback(null);
		setCreatePaymentLinkUrl('');
		if (!createFirstName.trim() || !createLastName.trim() || !createEmail.trim() || createPhone.replace(/\D/g, '').length < 7) {
			setCreateAccountError('First name, last name, email, country, and phone are required.');
			return;
		}
		if (createCourseId && createGroups.length > 0 && !createGroupId) {
			setCreateAccountError('Select a group.');
			return;
		}
		setCreateAccountSubmitting(true);
		try {
			const response = await axios.post(`${base_url}/users/admin-create`, {
				firstName: createFirstName.trim(),
				lastName: createLastName.trim(),
				email: createEmail.trim(),
				phone: createPhone,
				countryCode: createCountryCode,
			});
			let message = response.data?.message || 'Account created.';
			let stayOpen = false;
			const createdUserId = response.data?.user?._id;
			if (createCourseId && createdUserId) {
				try {
					await enrollCreatedUser(createdUserId);
					message = `${message} Kursa eklendi.`;
				} catch (enrollError: any) {
					stayOpen = true;
					message = `${message} Kursa eklenemedi: ${enrollError?.response?.data?.message || 'enrollment failed.'}`;
				}
				if (sendCreatePaymentLink || copyCreatePaymentLink) {
					try {
						const checkoutUrl = await sendCreatedPaymentLink(createdUserId, sendCreatePaymentLink);
						if (sendCreatePaymentLink) message = `${message} Ödeme bağlantısı e-postaya gönderildi.`;
						if (copyCreatePaymentLink && checkoutUrl) {
							try {
								await copyPaymentLinkUrl(checkoutUrl);
								message = `${message} Link copied.`;
							} catch {
								stayOpen = true;
								setCreatePaymentLinkUrl(checkoutUrl);
								message = `${message} Link is ready below.`;
							}
						}
					} catch (linkError: any) {
						stayOpen = true;
						const detail = linkError?.response?.data?.message || 'payment link failed.';
						message = sendCreatePaymentLink
							? `${message} Ödeme bağlantısı gönderilemedi: ${detail}`
							: `${message} Ödeme bağlantısı kopyalanamadı: ${detail}`;
					}
				}
			}
			if (response.data?.emailSent === false && response.data?.username && response.data?.password) {
				stayOpen = true;
				setCreateAccountFallback({ username: response.data.username, password: response.data.password });
			}
			await fetchUsers();
			if (stayOpen) {
				setCreateAccountSuccess(message);
			} else {
				resetCreateAccountForm();
				setCreateAccountOpen(false);
			}
		} catch (error: any) {
			setCreateAccountError(error?.response?.data?.message || 'Could not create the account.');
		} finally {
			setCreateAccountSubmitting(false);
		}
	};

	const loadCourseOptions = async () => {
		if (courseOptions.length > 0 || !orgId) return;
		setCourseOptionsLoading(true);
		try {
			const response = await axios.get(`${base_url}/courses/organisation/${orgId}?limit=200&sortBy=title&sortOrder=asc`);
			const rows = (response.data?.data || []) as Array<{ _id: string; title: string; isTestCourse?: boolean }>;
			setCourseOptions(rows.filter((course) => course._id && course.title));
		} catch {
			setEnrollError('Could not load courses.');
		} finally {
			setCourseOptionsLoading(false);
		}
	};

	const openEnrollForm = async (targetUserId: string) => {
		setEnrollFormUserId(targetUserId);
		setSelectedEnrollCourseId('');
		setSelectedEnrollGroupId('');
		setEnrollGroups([]);
		setEnrollError('');
		setPaymentLinkMessage('');
		setPaymentLinkUrl('');
		await loadCourseOptions();
	};

	const selectEnrollCourse = async (courseId: string) => {
		setSelectedEnrollCourseId(courseId);
		setSelectedEnrollGroupId('');
		setEnrollGroups([]);
		setEnrollError('');
		setPaymentLinkMessage('');
		setPaymentLinkUrl('');
		if (!courseId) return;
		try {
			const response = await axios.get(`${base_url}/courses/${courseId}/staff-info`);
			const groups = (response.data?.data?.groups || []) as Array<{ _id?: string; name?: string }>;
			setEnrollGroups(groups.filter((group): group is { _id: string; name: string } => Boolean(group._id && group.name)));
		} catch {
			setEnrollError('Could not load groups for this course.');
		}
	};

	const submitManualEnrollment = async (targetUserId: string) => {
		if (!selectedEnrollCourseId) {
			setEnrollError('Select a course.');
			return;
		}
		if (enrollGroups.length > 0 && !selectedEnrollGroupId) {
			setEnrollError('Select a group.');
			return;
		}
		setEnrollSubmitting(true);
		setEnrollError('');
		try {
			const response = await axios.post(`${base_url}/userCourses/`, {
				userId: targetUserId,
				courseId: selectedEnrollCourseId,
				orgId,
				manualEnrollment: true,
				...(selectedEnrollGroupId ? { groupId: selectedEnrollGroupId } : {}),
			});
			const coursesResponse = await axios.get(`${base_url}/userCourses/user/${targetUserId}/courses`);
			setUserCoursesData((prev) => ({
				...prev,
				[targetUserId]: { courses: coursesResponse.data?.data?.courses || [], loading: false },
			}));
			if (response.data?.alreadyEnrolled) {
				setEnrollError('This user is already enrolled in that course.');
				return;
			}
			setEnrollFormUserId(null);
			setSelectedEnrollCourseId('');
			setSelectedEnrollGroupId('');
			setEnrollGroups([]);
		} catch (error: any) {
			setEnrollError(error?.response?.data?.message || 'Could not add the course.');
		} finally {
			setEnrollSubmitting(false);
		}
	};

	const requestCoursePaymentLink = async (targetUserId: string, sendEmail: boolean) => {
		if (!selectedEnrollCourseId) {
			setEnrollError('Select a course.');
			return;
		}
		if (sendEmail) setPaymentLinkSubmitting(true);
		else setPaymentLinkCopying(true);
		setEnrollError('');
		setPaymentLinkMessage('');
		setPaymentLinkUrl('');
		try {
			const response = await axios.post(`${base_url}/payments/admin/course-link`, {
				userId: targetUserId,
				courseId: selectedEnrollCourseId,
				sendEmail,
				...(selectedEnrollGroupId ? { groupId: selectedEnrollGroupId } : {}),
			});
			const checkoutUrl = response.data?.checkoutUrl || '';
			setPaymentLinkUrl(checkoutUrl);
			if (!sendEmail && checkoutUrl) {
				try {
					await navigator.clipboard.writeText(checkoutUrl);
					setPaymentLinkMessage('Link copied.');
				} catch {
					setPaymentLinkMessage('Link is ready. Copy it below.');
				}
				return;
			}
			setPaymentLinkMessage(response.data?.message || 'Payment link sent.');
		} catch (error: any) {
			setEnrollError(error?.response?.data?.message || (sendEmail ? 'Could not send the payment link.' : 'Could not create the payment link.'));
		} finally {
			if (sendEmail) setPaymentLinkSubmitting(false);
			else setPaymentLinkCopying(false);
		}
	};

	const sendEnrolledCoursePaymentLink = async (targetUserId: string, courseId: string, sendEmail: boolean) => {
		setEnrolledLinkCourseId(courseId);
		setEnrolledLinkBusy(sendEmail ? 'send' : 'copy');
		setEnrolledLinkMessage('');
		setEnrolledLinkError('');
		setEnrolledLinkUrl('');
		try {
			const response = await axios.post(`${base_url}/payments/admin/course-link`, {
				userId: targetUserId,
				courseId,
				sendEmail,
			});
			const checkoutUrl = response.data?.checkoutUrl || '';
			setEnrolledLinkUrl(checkoutUrl);
			if (!sendEmail && checkoutUrl) {
				try {
					await navigator.clipboard.writeText(checkoutUrl);
					setEnrolledLinkMessage('Link copied.');
				} catch {
					setEnrolledLinkMessage('Link is ready. Copy it below.');
				}
				return;
			}
			setEnrolledLinkMessage(response.data?.message || 'Payment link sent.');
		} catch (error: any) {
			setEnrolledLinkError(error?.response?.data?.message || (sendEmail ? 'Could not send the payment link.' : 'Could not create the payment link.'));
		} finally {
			setEnrolledLinkBusy(null);
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

	const openEditUserModal = async (index: number) => {
		const userToEdit: User = paginatedUsers[index];
		setSingleUser(userToEdit);
		setEditUserMessage('');
		setEditUserCanMove(false);
		toggleUserEditModal(index);

		if (!userToEdit?.firebaseUserId) return;
		try {
			const response = await axios.get(`${base_url}/users/${userToEdit.firebaseUserId}`);
			const fullUser = response.data?.data?.[0];
			if (!fullUser) return;
			setSingleUser((prev) => {
				if (!prev || prev._id !== userToEdit._id) return prev;
				return {
					...prev,
					phone: fullUser.phone || prev.phone || '',
					countryCode: fullUser.countryCode || prev.countryCode || '',
				};
			});
		} catch (error) {
			console.error('Load user contact details error:', error);
		}
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

	const handleUpdateUserRole = async (index: number, moveEnrollment = false) => {
		if (!singleUser?._id || !singleUser.role) return;
		const original = paginatedUsers[index];
		const nextEmail = (singleUser.email || '').trim();
		const emailChanged = nextEmail.toLowerCase() !== (original?.email || '').toLowerCase();
		const nextFirstName = (singleUser.firstName || '').trim();
		const nextLastName = (singleUser.lastName || '').trim();
		const nextUsername = (singleUser.username || '').trim();
		const nextPhone = (singleUser.phone || '').trim();
		const nextCountry = (singleUser.countryCode || '').trim().toUpperCase().slice(0, 2);

		const payload: Record<string, string | boolean> = {};
		if (nextFirstName !== (original?.firstName || '')) payload.firstName = nextFirstName;
		if (nextLastName !== (original?.lastName || '')) payload.lastName = nextLastName;
		if (nextUsername.toLowerCase() !== (original?.username || '').toLowerCase()) payload.username = nextUsername;
		if (nextPhone !== (original?.phone || '')) payload.phone = nextPhone;
		if (nextCountry !== (original?.countryCode || '').toUpperCase()) payload.countryCode = nextCountry;
		if (singleUser.isActive !== original?.isActive) payload.isActive = singleUser.isActive;
		if (!!singleUser.isEmailVerified !== !!original?.isEmailVerified) payload.isEmailVerified = !!singleUser.isEmailVerified;
		if (!!singleUser.hasRegisteredCourse !== !!original?.hasRegisteredCourse) payload.hasRegisteredCourse = !!singleUser.hasRegisteredCourse;
		if (singleUser.role !== original?.role) payload.role = singleUser.role;

		setEditUserSubmitting(true);
		setEditUserMessage('');
		if (!moveEnrollment) setEditUserCanMove(false);

		try {
			let savedUser = {
				...singleUser,
				firstName: nextFirstName,
				lastName: nextLastName,
				username: nextUsername,
				phone: nextPhone,
				countryCode: nextCountry,
			};

			if (Object.keys(payload).length > 0) {
				await axios.patch(`${base_url}/users/${singleUser._id}`, payload);
			}

			if (emailChanged) {
				const response = await axios.post(`${base_url}/users/${singleUser._id}/correct-login-email`, {
					email: nextEmail,
					moveEnrollment,
				});
				if (response.data?.moved) {
					await fetchUsers();
					closeUserEditModal(index);
					return;
				}
				savedUser = { ...savedUser, email: response.data.email, isEmailVerified: true };
			}

			if (isUserHiddenFromViewer(savedUser.role, loggedInUser?.role)) {
				removeUser(savedUser._id);
				if (isSearchActive) removeFromSearchResults(savedUser._id);
			} else if (Object.keys(payload).length > 0 || emailChanged) {
				updateUser(savedUser);
			}

			closeUserEditModal(index);
		} catch (error: any) {
			const data = error?.response?.data;
			setEditUserMessage(data?.message || 'Could not save the user.');
			setEditUserCanMove(data?.code === 'EMAIL_IN_USE');
		} finally {
			setEditUserSubmitting(false);
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
		setEnrollFormUserId(null);
		setEnrollError('');
		setSelectedEnrollCourseId('');
		setSelectedEnrollGroupId('');
		setEnrollGroups([]);
		setEnrolledLinkCourseId('');
		setEnrolledLinkBusy(null);
		setEnrolledLinkMessage('');
		setEnrolledLinkError('');
		setEnrolledLinkUrl('');
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

	const bulkInvalidCount = bulkAccountRows.filter((row) => row.error).length;
	const bulkAccountSuitable = bulkAccountRows.length > 0 && !bulkAccountTooMany && !bulkAccountWrongFormat && bulkInvalidCount === 0 && !bulkAccountFileIssue;
	const bulkAccountLabel = bulkAccountFileName ? `"${bulkAccountFileName}"` : 'Liste';
	const bulkAccountNotice = bulkAccountWrongFormat
		? `${bulkAccountLabel} uygun değil. Sütunlar First name, Last name, Email, Phone, Country sırasında olmalı.`
		: bulkAccountTooMany
			? `${bulkAccountLabel} uygun değil. En fazla ${BULK_ACCOUNT_LIMIT} kişi olabilir.`
			: bulkAccountRows.length === 0
				? `${bulkAccountLabel} uygun değil. İçinde kişi satırı yok.`
				: bulkInvalidCount > 0
					? `${bulkAccountLabel} uygun değil. ${bulkInvalidCount} satır düzeltilmeli.`
					: `${bulkAccountLabel} uygun. ${bulkAccountRows.length} kişi oluşturulabilir.`;

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
								label: isMobileSize ? 'Create' : 'Create User',
								onClick: () => {
									resetCreateAccountForm();
									setCreateAccountOpen(true);
									void loadCourseOptions();
								},
								startIcon: <PersonAdd />,
							},
							{
								label: isMobileSize ? 'Bulk' : 'Create Users',
								onClick: () => {
									resetBulkAccountForm();
									setBulkAccountOpen(true);
									void loadCourseOptions();
								},
								startIcon: <GroupAdd />,
							},
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
																: user.role === Roles.PRESENTATION
																	? 'Presentation'
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
														maxWidth='sm'
														title='Edit User'>
														<form
															style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0 1.5rem 0.25rem' }}
															onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
																e.preventDefault();
																handleUpdateUserRole(index);
															}}>
															<Box sx={{ display: 'flex', gap: '0.75rem', flexDirection: isMobileSize ? 'column' : 'row' }}>
																<Box sx={{ flex: 1, minWidth: 0 }}>
																	<CustomTextField
																		label='First name'
																		value={singleUser?.firstName || ''}
																		disabled={editUserSubmitting}
																		onChange={(e) => setSingleUser((prev) => (prev ? { ...prev, firstName: e.target.value } : prev))}
																		InputProps={{ inputProps: { maxLength: 50 } }}
																		sx={{ marginBottom: 0 }}
																	/>
																</Box>
																<Box sx={{ flex: 1, minWidth: 0 }}>
																	<CustomTextField
																		label='Last name'
																		value={singleUser?.lastName || ''}
																		disabled={editUserSubmitting}
																		onChange={(e) => setSingleUser((prev) => (prev ? { ...prev, lastName: e.target.value } : prev))}
																		InputProps={{ inputProps: { maxLength: 50 } }}
																		sx={{ marginBottom: 0 }}
																	/>
																</Box>
															</Box>
															<Box sx={{ display: 'flex', gap: '0.75rem', flexDirection: isMobileSize ? 'column' : 'row' }}>
																<Box sx={{ flex: 1, minWidth: 0 }}>
																	<CustomTextField
																		label='Username'
																		value={singleUser?.username || ''}
																		disabled={editUserSubmitting}
																		onChange={(e) => setSingleUser((prev) => (prev ? { ...prev, username: e.target.value } : prev))}
																		InputProps={{ inputProps: { maxLength: 15 } }}
																		sx={{ marginBottom: 0 }}
																	/>
																</Box>
																<Box sx={{ flex: 1, minWidth: 0 }}>
																	<CustomTextField
																		label='Phone'
																		type='tel'
																		value={singleUser?.phone || ''}
																		disabled={editUserSubmitting}
																		onChange={(e) => setSingleUser((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
																		InputProps={{ inputProps: { maxLength: 20 } }}
																		sx={{ marginBottom: 0 }}
																	/>
																</Box>
															</Box>
															<Box sx={{ display: 'flex', gap: '0.75rem', flexDirection: isMobileSize ? 'column' : 'row' }}>
																<Box sx={{ flex: 1, minWidth: 0 }}>
																	<CustomTextField
																		label='Country'
																		value={singleUser?.countryCode || ''}
																		disabled={editUserSubmitting}
																		onChange={(e) => setSingleUser((prev) => (prev ? { ...prev, countryCode: e.target.value.toUpperCase().slice(0, 2) } : prev))}
																		InputProps={{ inputProps: { maxLength: 2 } }}
																		sx={{ marginBottom: 0 }}
																	/>
																</Box>
																<Box sx={{ flex: 1, minWidth: 0 }}>
																	<CustomTextField
																		label='Email'
																		type='email'
																		value={singleUser?.email || ''}
																		disabled={editUserSubmitting}
																		onChange={(e) => {
																			setSingleUser((prev) => (prev ? { ...prev, email: e.target.value } : prev));
																			setEditUserCanMove(false);
																			setEditUserMessage('');
																		}}
																		InputProps={{ inputProps: { maxLength: 254 } }}
																		sx={{ marginBottom: 0 }}
																	/>
																</Box>
															</Box>
															<Box sx={{ display: 'flex', gap: '0.75rem', flexDirection: isMobileSize ? 'column' : 'row' }}>
																<FormControl size='small' sx={{ flex: 1, minWidth: 0 }}>
																	<Typography sx={{ mb: '0.35rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary' }}>Status</Typography>
																	<Select
																		value={singleUser?.isActive ? 'active' : 'deactivated'}
																		disabled={editUserSubmitting}
																		onChange={(e) => setSingleUser((prev) => (prev ? { ...prev, isActive: e.target.value === 'active' } : prev))}
																		sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		<MenuItem value='active' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>Active</MenuItem>
																		<MenuItem value='deactivated' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>Deactivated</MenuItem>
																	</Select>
																</FormControl>
																<FormControl size='small' sx={{ flex: 1, minWidth: 0 }}>
																	<Typography sx={{ mb: '0.35rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary' }}>Email verified</Typography>
																	<Select
																		value={singleUser?.isEmailVerified ? 'yes' : 'no'}
																		disabled={editUserSubmitting}
																		onChange={(e) => setSingleUser((prev) => (prev ? { ...prev, isEmailVerified: e.target.value === 'yes' } : prev))}
																		sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		<MenuItem value='yes' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>Yes</MenuItem>
																		<MenuItem value='no' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>No</MenuItem>
																	</Select>
																</FormControl>
															</Box>
															<Box sx={{ display: 'flex', gap: '0.75rem', flexDirection: isMobileSize ? 'column' : 'row' }}>
																<FormControl size='small' sx={{ flex: 1, minWidth: 0 }}>
																	<Typography sx={{ mb: '0.35rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary' }}>Registered course</Typography>
																	<Select
																		value={singleUser?.hasRegisteredCourse ? 'yes' : 'no'}
																		disabled={editUserSubmitting}
																		onChange={(e) => setSingleUser((prev) => (prev ? { ...prev, hasRegisteredCourse: e.target.value === 'yes' } : prev))}
																		sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		<MenuItem value='yes' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>Yes</MenuItem>
																		<MenuItem value='no' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>No</MenuItem>
																	</Select>
																</FormControl>
																<FormControl size='small' sx={{ flex: 1, minWidth: 0 }}>
																	<Typography sx={{ mb: '0.35rem', fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary' }}>Role</Typography>
																	<Select
																		value={singleUser?.role}
																		onChange={(e) => setSingleUser((prevData) => ({ ...prevData!, role: e.target.value as Roles }))}
																		required
																		disabled={editUserSubmitting}
																		sx={{
																			backgroundColor: theme.bgColor?.common,
																			fontSize: isMobileSize ? '0.75rem' : '0.85rem',
																			textTransform: 'capitalize',
																		}}>
																		{[Roles.SUPER_ADMIN, Roles.ADMIN, Roles.INSTRUCTOR, Roles.USER, Roles.TEST_LEARNER, Roles.PRESENTATION]
																			.filter((type) => {
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
																						fontSize: isMobileSize ? '0.75rem' : '0.85rem',
																						textTransform: type === Roles.TEST_LEARNER || type === Roles.PRESENTATION ? 'none' : 'capitalize',
																					}}>
																					{type === Roles.TEST_LEARNER ? 'Test Learner' : type === Roles.PRESENTATION ? 'Presentation' : type}
																				</MenuItem>
																			))}
																	</Select>
																</FormControl>
															</Box>
															<Box sx={{ display: 'flex', gap: '0.75rem', flexDirection: isMobileSize ? 'column' : 'row' }}>
																<Box sx={{ flex: 1, minWidth: 0 }}>
																	<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: 'text.secondary' }}>Created</Typography>
																	<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mt: '0.35rem' }}>
																		{singleUser?.createdAt ? dateFormatter(singleUser.createdAt) : '—'}
																	</Typography>
																</Box>
																<Box sx={{ flex: 1, minWidth: 0 }} />
															</Box>
															{editUserMessage && (
																<Typography variant='body2' sx={{ color: 'error.main', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																	{editUserMessage}
																</Typography>
															)}
															{editUserCanMove && (
																<CustomCancelButton
																	type='button'
																	disabled={editUserSubmitting}
																	onClick={() => handleUpdateUserRole(index, true)}
																	sx={{ alignSelf: 'flex-start', margin: 0 }}>
																	Move courses
																</CustomCancelButton>
															)}
															<CustomDialogActions
																onCancel={() => {
																	closeUserEditModal(index);
																}}
																disableBtn={editUserSubmitting}
																submitBtnText={editUserSubmitting ? 'Saving...' : 'Save'}
																actionSx={{ margin: '0 0rem 0rem 0' }}
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
						const selectedEnrollment = (coursesData?.courses || []).find((row) => row.courseId === selectedEnrollCourseId);
						const selectedCoursePaid = Boolean(selectedEnrollment?.hasPaid);
						return isUserCoursesModalOpen[index] ? (
							<CustomDialog
								key={`user-courses-${user._id || index}`}
								openModal={isUserCoursesModalOpen[index] || false}
								closeModal={() => closeUserCoursesModal(index)}
								title={`Courses - ${fullName}`}
								maxWidth='sm'>
								<DialogContent sx={{ p: '2rem' }}>
									{enrollFormUserId === user._id && (
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', mb: '1.25rem' }}>
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												Add opens the course page now. Evergreen courses unlock lessons immediately. Cohort courses keep lessons locked until the start date. Send payment link emails a Stripe page. Copy link puts the same page on the clipboard so you can send it yourself. When they pay, the payment is saved for this user and course.
											</Typography>
											<FormControl fullWidth size='small'>
												<Select
													displayEmpty
													value={selectedEnrollCourseId}
													onChange={(event) => selectEnrollCourse(String(event.target.value))}
													disabled={courseOptionsLoading || enrollSubmitting} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
													<MenuItem value='' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>{courseOptionsLoading ? 'Loading courses...' : 'Select a course'}</MenuItem>
													{courseOptions
														.filter((course) => !(course.isTestCourse && user.role !== Roles.TEST_LEARNER))
														.map((course) => {
															const enrolled = (coursesData?.courses || []).some((row) => row.courseId === course._id);
															return (
																<MenuItem key={course._id} value={course._id} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																	{course.title}
																	{enrolled ? ' (enrolled)' : ''}
																</MenuItem>
															);
														})}
												</Select>
											</FormControl>
											{enrollGroups.length > 0 && (
												<FormControl fullWidth size='small'>
													<Select
														displayEmpty
														value={selectedEnrollGroupId}
														onChange={(event) => setSelectedEnrollGroupId(String(event.target.value))}
														disabled={enrollSubmitting} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
														<MenuItem value='' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>Select a group</MenuItem>
														{enrollGroups.map((group) => (
															<MenuItem key={group._id} value={group._id} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																{group.name}
															</MenuItem>
														))}
													</Select>
												</FormControl>
											)}
											{selectedCoursePaid && (
												<Typography variant='body2' sx={{ color: 'error.main', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
													This user has already paid for this course.
												</Typography>
											)}
											{enrollError && (
												<Typography variant='body2' sx={{ color: 'error.main', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
													{enrollError}
												</Typography>
											)}
											{paymentLinkMessage && (
												<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
													{paymentLinkMessage}
												</Typography>
											)}
											{paymentLinkUrl && (
												<Typography
													variant='body2'
													sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', wordBreak: 'break-all' }}>
													{paymentLinkUrl}
												</Typography>
											)}
											<Box sx={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
												<CustomCancelButton
													disabled={enrollSubmitting || paymentLinkSubmitting || paymentLinkCopying}
													onClick={() => {
														setEnrollFormUserId(null);
														setEnrollError('');
														setPaymentLinkMessage('');
														setPaymentLinkUrl('');
													}}>
													Cancel
												</CustomCancelButton>
												<CustomCancelButton
													type='button'
													disabled={enrollSubmitting || paymentLinkSubmitting || paymentLinkCopying || selectedCoursePaid}
													onClick={() => user._id && requestCoursePaymentLink(user._id, false)}>
													{paymentLinkCopying ? 'Copying...' : 'Copy link'}
												</CustomCancelButton>
												<CustomCancelButton
													type='button'
													disabled={enrollSubmitting || paymentLinkSubmitting || paymentLinkCopying || selectedCoursePaid}
													onClick={() => user._id && requestCoursePaymentLink(user._id, true)}>
													{paymentLinkSubmitting ? 'Sending...' : 'Send payment link'}
												</CustomCancelButton>
												<CustomSubmitButton
													type='button'
													onClick={() => user._id && submitManualEnrollment(user._id)}
													disabled={enrollSubmitting || paymentLinkSubmitting || paymentLinkCopying || Boolean(selectedEnrollment)}>
													{enrollSubmitting ? 'Adding...' : 'Add'}
												</CustomSubmitButton>
											</Box>
										</Box>
									)}
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
														{course.hasPaid ? (
															<Typography variant='body2' sx={{ color: 'error.main', fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
																This user has already paid for this course.
															</Typography>
														) : (
															<Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', mb: '0.5rem' }} onClick={(event) => event.stopPropagation()}>
																<Box sx={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
																	<CustomCancelButton
																		type='button'
																		disabled={enrolledLinkBusy !== null}
																		onClick={() => user._id && sendEnrolledCoursePaymentLink(user._id, course.courseId, false)}>
																		{enrolledLinkBusy === 'copy' && enrolledLinkCourseId === course.courseId ? 'Copying...' : 'Copy link'}
																	</CustomCancelButton>
																	<CustomCancelButton
																		type='button'
																		disabled={enrolledLinkBusy !== null}
																		onClick={() => user._id && sendEnrolledCoursePaymentLink(user._id, course.courseId, true)}>
																		{enrolledLinkBusy === 'send' && enrolledLinkCourseId === course.courseId ? 'Sending...' : 'Send payment link'}
																	</CustomCancelButton>
																</Box>
																{enrolledLinkCourseId === course.courseId && enrolledLinkError && (
																	<Typography variant='body2' sx={{ color: 'error.main', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		{enrolledLinkError}
																	</Typography>
																)}
																{enrolledLinkCourseId === course.courseId && enrolledLinkMessage && (
																	<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
																		{enrolledLinkMessage}
																	</Typography>
																)}
																{enrolledLinkCourseId === course.courseId && enrolledLinkUrl && (
																	<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', wordBreak: 'break-all' }}>
																		{enrolledLinkUrl}
																	</Typography>
																)}
															</Box>
														)}

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
									{enrollFormUserId !== user._id && (
										<CustomSubmitButton
											type='button'
											sx={{ margin: '0 0.5rem 0.5rem 0' }}
											onClick={() => user._id && openEnrollForm(user._id)}>
											Add to course
										</CustomSubmitButton>
									)}
									<CustomCancelButton sx={{ margin: '0 1.35rem 0.5rem 0' }} onClick={() => closeUserCoursesModal(index)}>
										Close
									</CustomCancelButton>
								</DialogActions>
							</CustomDialog>
						) : null;
					})}
				<CustomDialog
					openModal={createAccountOpen}
					closeModal={() => {
						if (!createAccountSubmitting) setCreateAccountOpen(false);
					}}
					disableDismiss={createAccountSubmitting}
					maxWidth='xs'
					title='Create User'>
					<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
						<CustomTextField
							label='First name'
							value={createFirstName}
							onChange={(event) => setCreateFirstName(event.target.value)}
							InputProps={{ inputProps: { maxLength: 50 } }}
							sx={{ mt: '0.5rem' }}
						/>
						<CustomTextField
							label='Last name'
							value={createLastName}
							onChange={(event) => setCreateLastName(event.target.value)}
							InputProps={{ inputProps: { maxLength: 50 } }}
						/>
						<CustomTextField
							label='Email'
							type='email'
							value={createEmail}
							onChange={(event) => setCreateEmail(event.target.value)}
							InputProps={{ inputProps: { maxLength: 254 } }}
						/>
						<Box>
							<Typography variant='caption' sx={{ display: 'block', mb: '0.35rem' }}>
								Country and phone
							</Typography>
							<PhoneInput
								key={createAccountOpen ? 'create-account-phone' : 'create-account-phone-closed'}
								country='tr'
								enableSearch
								countryCodeEditable={false}
								specialLabel=''
								value={createPhone}
								onChange={(phoneNumber, countryData) => {
									const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
									setCreatePhone(formatted);
									const code =
										countryData && typeof countryData === 'object' && 'countryCode' in countryData
											? String(countryData.countryCode || '')
											: '';
									if (code) setCreateCountryCode(code.toUpperCase());
								}}
								inputStyle={{ width: '100%', height: '40px' }}
							/>
						</Box>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							Add to course is optional. The course page opens as soon as the account is created.
						</Typography>
						<FormControl fullWidth size='small'>
							<Select
								displayEmpty
								value={createCourseId}
								onChange={(event) => void selectCreateCourse(String(event.target.value))}
								disabled={createAccountSubmitting || courseOptionsLoading}
								sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								<MenuItem value='' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{courseOptionsLoading ? 'Loading courses...' : 'No course'}
								</MenuItem>
								{courseOptions
									.filter((course) => !course.isTestCourse)
									.map((course) => (
										<MenuItem key={course._id} value={course._id} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											{course.title}
										</MenuItem>
									))}
							</Select>
						</FormControl>
						{createGroups.length > 0 && (
							<FormControl fullWidth size='small'>
								<Select
									displayEmpty
									value={createGroupId}
									onChange={(event) => setCreateGroupId(String(event.target.value))}
									disabled={createAccountSubmitting}
									sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<MenuItem value='' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Select a group
									</MenuItem>
									{createGroups.map((group) => (
										<MenuItem key={`single-${group._id}`} value={group._id} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											{group.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
						<Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: '1rem' }}>
							<FormControlLabel
								sx={{ ml: 0 }}
								control={
									<Checkbox
										size='small'
										checked={sendCreatePaymentLink}
										disabled={!createCourseId || createAccountSubmitting}
										onChange={(event) => setSendCreatePaymentLink(event.target.checked)}
									/>
								}
								label={
									<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Send payment link
									</Typography>
								}
							/>
							<FormControlLabel
								sx={{ ml: 0 }}
								control={
									<Checkbox
										size='small'
										checked={copyCreatePaymentLink}
										disabled={!createCourseId || createAccountSubmitting}
										onChange={(event) => setCopyCreatePaymentLink(event.target.checked)}
									/>
								}
								label={
									<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Copy link
									</Typography>
								}
							/>
						</Box>
						{createAccountError && (
							<Typography variant='body2' sx={{ color: 'error.main' }}>
								{createAccountError}
							</Typography>
						)}
						{createAccountSuccess && <Typography variant='body2'>{createAccountSuccess}</Typography>}
						{createPaymentLinkUrl && (
							<Box>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', wordBreak: 'break-all' }}>
									{createPaymentLinkUrl}
								</Typography>
								<CustomCancelButton
									type='button'
									sx={{ mt: '0.5rem' }}
									onClick={() => {
										void copyPaymentLinkUrl(createPaymentLinkUrl)
											.then(() => setCreateAccountSuccess((current) => (current.includes('Link copied.') ? current : `${current} Link copied.`)))
											.catch(() => setCreateAccountError('Could not copy the payment link.'));
									}}>
									Copy link
								</CustomCancelButton>
							</Box>
						)}
						{createAccountFallback && (
							<Typography variant='body2'>
								Username: {createAccountFallback.username}
								<br />
								Password: {createAccountFallback.password}
							</Typography>
						)}
					</DialogContent>
					<DialogActions>
						<CustomCancelButton sx={{ margin: '0 0.5rem 0.5rem 0' }} disabled={createAccountSubmitting} onClick={() => setCreateAccountOpen(false)}>
							Close
						</CustomCancelButton>
						<CustomSubmitButton type='button' disabled={createAccountSubmitting} onClick={() => requestCreateConfirm('single')} sx={{ margin: '0 1rem 0.5rem 0' }}>
							{createAccountSubmitting ? 'Creating...' : 'Create'}
						</CustomSubmitButton>
					</DialogActions>
				</CustomDialog>
				<CustomDialog
					openModal={bulkAccountOpen}
					closeModal={() => {
						if (!bulkAccountSubmitting) setBulkAccountOpen(false);
					}}
					disableDismiss={bulkAccountSubmitting}
					maxWidth='sm'
					title='Create Users'>
					<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
						<Typography variant='body2'>
							CSV sütun sırası: First name, Last name, Email, Phone, Country.
						</Typography>
						<Typography variant='body2'>
							Ülke boşsa TR olur. En fazla {BULK_ACCOUNT_LIMIT} kişi. Ayırıcı virgül veya noktalı virgül.
						</Typography>
						<Box sx={{ p: 1.25, borderRadius: 1, bgcolor: '#f8fafc', fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem', lineHeight: 1.6 }}>
							First name,Last name,Email,Phone,Country
							<br />
							Ayşe,Duran,ayse@ornek.com,+905551112233,TR
						</Box>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							Add to course is optional and applies to every new account. The course page opens as soon as the account is created.
						</Typography>
						<FormControl fullWidth size='small'>
							<Select
								displayEmpty
								value={createCourseId}
								onChange={(event) => void selectCreateCourse(String(event.target.value))}
								disabled={bulkAccountSubmitting || courseOptionsLoading}
								sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								<MenuItem value='' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{courseOptionsLoading ? 'Loading courses...' : 'No course'}
								</MenuItem>
								{courseOptions
									.filter((course) => !course.isTestCourse)
									.map((course) => (
										<MenuItem key={course._id} value={course._id} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											{course.title}
										</MenuItem>
									))}
							</Select>
						</FormControl>
						{createGroups.length > 0 && (
							<FormControl fullWidth size='small'>
								<Select
									displayEmpty
									value={createGroupId}
									onChange={(event) => setCreateGroupId(String(event.target.value))}
									disabled={bulkAccountSubmitting}
									sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									<MenuItem value='' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Select a group
									</MenuItem>
									{createGroups.map((group) => (
										<MenuItem key={`bulk-${group._id}`} value={group._id} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											{group.name}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
						<FormControlLabel
							sx={{ ml: 0 }}
							control={
								<Checkbox
									size='small'
									checked={sendCreatePaymentLink}
									disabled={!createCourseId || bulkAccountSubmitting}
									onChange={(event) => setSendCreatePaymentLink(event.target.checked)}
								/>
							}
							label={
								<Typography sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									Send payment link to each new account
								</Typography>
							}
						/>
						<TextField
							multiline
							minRows={6}
							maxRows={12}
							value={bulkAccountText}
							onChange={(event) => previewBulkAccounts(event.target.value)}
							placeholder='First name, Last name, Email, Phone, Country'
							disabled={bulkAccountSubmitting}
						/>
						<Button
							component='label'
							variant='outlined'
							size='small'
							disabled={bulkAccountSubmitting}
							sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>
							Upload CSV
							<input
								hidden
								type='file'
								accept='.csv,.txt,text/csv,text/plain'
								onChange={(event) => {
									void loadBulkAccountFile(event.target.files?.[0]);
									event.target.value = '';
								}}
							/>
						</Button>
						{bulkAccountError && (
							<Typography variant='body2' sx={{ color: 'error.main' }}>
								{bulkAccountError}
							</Typography>
						)}
						{(bulkAccountFileIssue || bulkAccountText.trim()) && (
							<Alert severity={bulkAccountSuitable ? 'success' : 'error'}>
								{bulkAccountFileIssue || bulkAccountNotice}
							</Alert>
						)}
						{bulkAccountRows.length > 0 && !bulkAccountResults && (
							<Box>
								<Typography variant='body2' sx={{ mb: 0.5 }}>
									{bulkAccountRows.filter((row) => !row.error).length} hazır, {bulkAccountRows.filter((row) => row.error).length} düzeltilmeli
								</Typography>
								{bulkAccountRows.map((row) => (
									<Typography key={row.line} variant='body2' sx={{ color: row.error ? 'error.main' : 'text.primary' }}>
										{row.line}. {row.firstName} {row.lastName} {row.email ? `· ${row.email}` : ''} {row.error ? `— ${row.error}` : ''}
									</Typography>
								))}
							</Box>
						)}
						{bulkAccountResults && (
							<Box>
								<Typography variant='body2' sx={{ mb: 0.5 }}>
									{bulkAccountResults.filter((result) => result.status === 'created').length} created,{' '}
									{bulkAccountResults.filter((result) => result.status !== 'created').length} not created
								</Typography>
								{bulkAccountResults.map((result) => (
									<Typography key={`${result.row}-${result.email}`} variant='body2' sx={{ color: result.status === 'created' ? 'text.primary' : 'error.main' }}>
										{result.row}. {result.email || '—'} — {result.message}
										{result.username ? ` Username: ${result.username}.` : ''}
										{result.password ? ` Password: ${result.password}` : ''}
									</Typography>
								))}
							</Box>
						)}
					</DialogContent>
					<DialogActions>
						<CustomCancelButton sx={{ margin: '0 0.5rem 0.5rem 0' }} disabled={bulkAccountSubmitting} onClick={() => setBulkAccountOpen(false)}>
							Close
						</CustomCancelButton>
						<CustomSubmitButton
							type='button'
							disabled={bulkAccountSubmitting || !bulkAccountSuitable || Boolean(bulkAccountResults)}
							onClick={() => requestCreateConfirm('bulk')}
							sx={{ margin: '0 1rem 0.5rem 0' }}>
							{bulkAccountSubmitting ? 'Creating...' : 'Create'}
						</CustomSubmitButton>
					</DialogActions>
				</CustomDialog>
				<CustomDialog
					openModal={createConfirmMode !== null}
					closeModal={() => setCreateConfirmMode(null)}
					maxWidth='xs'
					title='Are you sure?'>
					<DialogContent>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							{createConfirmMode === 'bulk'
								? `Are you sure you want to create ${bulkAccountRows.filter((row) => !row.error).length} accounts?`
								: 'Are you sure you want to create this account?'}
						</Typography>
						{createCourseId && (
							<Typography variant='body2' sx={{ mt: 1, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{createConfirmMode === 'bulk' ? 'Each new account will be added to ' : 'This account will be added to '}
								{courseOptions.find((course) => course._id === createCourseId)?.title || 'the selected course'}.
							</Typography>
						)}
						{sendCreatePaymentLink && (
							<Typography variant='body2' sx={{ mt: 1, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								{createConfirmMode === 'bulk'
									? 'A separate payment link email will be sent to each new account.'
									: 'A payment link will be emailed to this account.'}
							</Typography>
						)}
						{createConfirmMode === 'single' && copyCreatePaymentLink && (
							<Typography variant='body2' sx={{ mt: 1, fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
								The payment link will be copied so you can send it yourself.
							</Typography>
						)}
					</DialogContent>
					<DialogActions>
						<CustomCancelButton sx={{ margin: '0 0.5rem 0.5rem 0' }} onClick={() => setCreateConfirmMode(null)}>
							Cancel
						</CustomCancelButton>
						<CustomSubmitButton
							type='button'
							onClick={() => {
								const mode = createConfirmMode;
								setCreateConfirmMode(null);
								if (mode === 'single') void submitCreateAccount();
								if (mode === 'bulk') void submitBulkAccounts();
							}}
							sx={{ margin: '0 1rem 0.5rem 0' }}>
							Create
						</CustomSubmitButton>
					</DialogActions>
				</CustomDialog>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminUsers;
