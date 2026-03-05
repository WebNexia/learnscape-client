import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableRow,
	Snackbar,
	Alert,
	DialogContent,
	Typography,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import { useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useState, useCallback } from 'react';
import { KeyboardBackspaceOutlined, Visibility, Delete } from '@mui/icons-material';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import axios from '../utils/axiosInstance';
import { Consultation, ConsultationAppointment } from '../interfaces/consultation';
import { dateTimeFormatter } from '../utils/dateFormatter';
import CustomTableHead from '../components/layouts/table/CustomTableHead';
import CustomTableCell from '../components/layouts/table/CustomTableCell';
import CustomTablePagination from '../components/layouts/table/CustomTablePagination';
import CustomActionBtn from '../components/layouts/table/CustomActionBtn';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import CustomInfoMessageAlignedLeft from '../components/layouts/infoMessage/CustomInfoMessageAlignedLeft';
import AppointmentDetailModal from '../components/consultations/AppointmentDetailModal';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { consultationsService } from '../services/consultationsService';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;
const pageSize = 100;

const AdminConsultationAppointments = () => {
	const { consultationId } = useParams();
	const navigate = useNavigate();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [consultation, setConsultation] = useState<Consultation | null>(null);
	const [appointments, setAppointments] = useState<ConsultationAppointment[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [page, setPage] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [filterStatus, setFilterStatus] = useState<string>('');
	const [searchValue, setSearchValue] = useState('');
	const [searchApplied, setSearchApplied] = useState('');
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
		open: false,
		message: '',
		severity: 'success',
	});
	const [detailOpen, setDetailOpen] = useState(false);
	const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
	const [appointmentIdToDelete, setAppointmentIdToDelete] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [orderBy, setOrderBy] = useState<string>('appointmentDate');
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');

	const fetchConsultation = useCallback(async () => {
		if (!consultationId) return;
		try {
			const res = await axios.get(`${base_url}/consultations/${consultationId}`);
			if (res.data?.data) setConsultation(res.data.data);
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to load consultation');
		}
	}, [consultationId]);

	const fetchAppointments = useCallback(async () => {
		if (!consultationId) return;
		setLoading(true);
		setError('');
		try {
			const params = new URLSearchParams();
			params.set('page', String(page));
			params.set('limit', String(pageSize));
			if (filterStatus) params.set('status', filterStatus);
			if (searchApplied) params.set('search', searchApplied);
			const res = await axios.get(`${base_url}/consultations/${consultationId}/appointments?${params.toString()}`);
			if (res.data?.status === 200) {
				setAppointments(res.data.data || []);
				setTotalItems(res.data.totalItems ?? 0);
				setTotalPages(res.data.pagination?.totalPages ?? 1);
			}
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to load appointments');
			setAppointments([]);
		} finally {
			setLoading(false);
		}
	}, [consultationId, page, filterStatus, searchApplied]);

	useEffect(() => {
		fetchConsultation();
	}, [fetchConsultation]);

	useEffect(() => {
		fetchAppointments();
	}, [fetchAppointments]);

	const handlePageChange = (newPage: number) => {
		setPage(newPage);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const handleFilterChange = (value: string) => {
		setFilterStatus(value);
		setPage(1);
	};

	const handleSearch = () => {
		setSearchApplied(searchValue.trim());
		setPage(1);
	};

	const handleReset = () => {
		setSearchValue('');
		setSearchApplied('');
		setFilterStatus('');
		setPage(1);
	};

	const openDetail = (appointmentId: string) => {
		setSelectedAppointmentId(appointmentId);
		setDetailOpen(true);
	};

	const closeDetail = () => {
		setDetailOpen(false);
		setSelectedAppointmentId(null);
	};

	const onDetailUpdated = () => {
		fetchAppointments();
	};

	const openDeleteConfirm = (appointmentId: string) => setAppointmentIdToDelete(appointmentId);
	const closeDeleteConfirm = () => {
		if (!deleting) setAppointmentIdToDelete(null);
	};

	const handleDeleteAppointment = async () => {
		if (!appointmentIdToDelete) return;
		setDeleting(true);
		try {
			await consultationsService.deleteAppointment(appointmentIdToDelete);
			setSnackbar({ open: true, message: 'Appointment deleted successfully.', severity: 'success' });
			closeDeleteConfirm();
			fetchAppointments();
		} catch (err: any) {
			setSnackbar({
				open: true,
				message: err.response?.data?.message || 'Failed to delete appointment.',
				severity: 'error',
			});
		} finally {
			setDeleting(false);
		}
	};

	const getColumns = () => {
		const cols = [
			{ key: 'appointmentDate', label: 'Date & time' },
			{ key: 'guestName', label: 'Guest' },
			{ key: 'assignedConsultantId', label: 'Consultant' },
			{ key: 'status', label: 'Status' },
			...(isMobileSize ? [] : [{ key: 'payment', label: 'Payment' }]),
			{ key: 'actions', label: 'Actions' },
		];
		return cols;
	};

	const consultantDisplay = (apt: ConsultationAppointment) => {
		const c = apt.assignedConsultantId;
		if (typeof c === 'object' && c) {
			return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
		}
		return '—';
	};

	const paymentDisplay = (apt: ConsultationAppointment) => {
		const p = apt.paymentRef;
		if (typeof p === 'object' && p) return p.status || '—';
		return apt.paymentStatus || '—';
	};

	const getSortValue = (apt: ConsultationAppointment, key: string): string | number => {
		switch (key) {
			case 'appointmentDate':
				return new Date(apt.appointmentDate).getTime();
			case 'guestName':
				return `${apt.guestName || ''} ${apt.guestEmail || ''}`.trim().toLowerCase();
			case 'assignedConsultantId':
				return consultantDisplay(apt).toLowerCase();
			case 'status':
				return (apt.status || '').toLowerCase();
			case 'payment':
				return paymentDisplay(apt).toLowerCase();
			default:
				return '';
		}
	};

	const handleSort = (property: string) => {
		if (property === 'actions') return;
		const isAsc = orderBy === property && order === 'asc';
		setOrderBy(property);
		setOrder(isAsc ? 'desc' : 'asc');
	};

	const sortedAppointments = [...appointments].sort((a, b) => {
		const aVal = getSortValue(a, orderBy);
		const bVal = getSortValue(b, orderBy);
		if (aVal < bVal) return order === 'asc' ? -1 : 1;
		if (aVal > bVal) return order === 'asc' ? 1 : -1;
		return 0;
	});

	if (loading && (!appointments || appointments.length === 0) && !error) {
		return (
			<AdminPageErrorBoundary pageName='Appointments'>
				<DashboardPagesLayout pageName='Appointments' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
					<AdminTableSkeleton />
				</DashboardPagesLayout>
			</AdminPageErrorBoundary>
		);
	}

	return (
		<AdminPageErrorBoundary pageName='Appointments'>
			<DashboardPagesLayout pageName='Appointments' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', height: '100%' }}>
					<FilterSearchRow
						filterValue={filterStatus}
						onFilterChange={handleFilterChange}
						filterOptions={[
							{ value: '', label: 'All statuses' },
							{ value: 'pending', label: 'Pending' },
							{ value: 'confirmed', label: 'Confirmed' },
							{ value: 'completed', label: 'Completed' },
							{ value: 'cancelled', label: 'Cancelled' },
						]}
						filterPlaceholder='Status'
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						onSearch={handleSearch}
						onReset={handleReset}
						searchPlaceholder='Search by guest name or email'
						isSearchActive={!!searchApplied}
						searchResultsTotalItems={totalItems}
						totalItems={totalItems}
						searchedValue={searchApplied}
						onResetSearch={() => { setSearchValue(''); setSearchApplied(''); setPage(1); }}
						onResetFilter={() => { setFilterStatus(''); setPage(1); }}
						isSticky={true}
						actionButtons={[
							{
								label: consultation?.title ? `Back to ${consultation.title}` : 'Back',
								startIcon: <KeyboardBackspaceOutlined fontSize='small' />,
								onClick: () => navigate(`/admin/consultation-edit/consultation/${consultationId}`),
							},
						]}
					/>

					{error && (
						<CustomInfoMessageAlignedLeft message={error} sx={{ marginTop: '2rem', marginBottom: '1rem' }} />
					)}

					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							padding: isMobileSize ? '0rem 0.25rem 2rem 0.25rem' : '0rem 0rem 2rem 0rem',
							width: '100%',
						}}
					>
						<Table
							sx={{
								mb: '2rem',
								tableLayout: 'fixed',
								width: '100%',
								borderCollapse: 'collapse',
								'& .MuiTableHead-root': {
									position: 'fixed',
									top: isMobileSize ? '10.25rem' : '8rem',
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
									padding: '1rem',
									boxSizing: 'border-box',
								},
								'& .MuiTableBody-root .MuiTableCell-root': {
									padding: '0.75rem 1rem',
									boxSizing: 'border-box',
								},
							}}
							size='small'
							aria-label='appointments table'
						>
							<TableBody>
								<TableRow sx={{ height: 0, visibility: 'hidden' }}>
									{getColumns().map((_, idx) => (
										<TableCell key={idx} sx={{ padding: 0, border: 'none' }} />
									))}
								</TableRow>
							</TableBody>
							<CustomTableHead
								orderBy={orderBy as keyof ConsultationAppointment}
								order={order}
								handleSort={handleSort}
								columns={getColumns()}
							/>
							<TableBody>
								{!loading &&
									sortedAppointments.map((apt) => (
										<TableRow key={apt._id} hover>
											<CustomTableCell value={dateTimeFormatter(apt.appointmentDate)} />
											<CustomTableCell value={`${apt.guestName || '—'} ${apt.guestEmail ? `(${apt.guestEmail})` : ''}`.trim()} />
											<CustomTableCell value={consultantDisplay(apt)} />
											<CustomTableCell value={apt.status ? apt.status.charAt(0).toUpperCase() + apt.status.slice(1) : '—'} />
											{!isMobileSize && <CustomTableCell value={paymentDisplay(apt)} />}
											<TableCell sx={{ textAlign: 'center' }}>
												<CustomActionBtn
													title='View'
													onClick={() => openDetail(apt._id)}
													icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
												<CustomActionBtn
													title='Delete'
													onClick={() => openDeleteConfirm(apt._id)}
													icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
												/>
											</TableCell>
										</TableRow>
									))}
							</TableBody>
						</Table>

						{!loading && appointments.length === 0 && (
							<CustomInfoMessageAlignedLeft
								message={searchApplied || filterStatus ? 'No appointments match your filters.' : 'No appointments yet.'}
								sx={{ marginTop: '3rem', marginBottom: '1rem' }}
							/>
						)}

						{totalPages > 1 && (
							<CustomTablePagination count={totalPages} page={page} onChange={handlePageChange} />
						)}
					</Box>

					<AppointmentDetailModal
						appointmentId={selectedAppointmentId}
						open={detailOpen}
						onClose={closeDetail}
						onUpdated={onDetailUpdated}
					/>

					<CustomDialog
						openModal={!!appointmentIdToDelete}
						closeModal={closeDeleteConfirm}
						title='Delete appointment'
						content=''
						maxWidth='xs'
					>
						<DialogContent>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
								Are you sure you want to delete this appointment?
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem', mt: '1.5rem' }}>This cannot be undone.</Typography>
						</DialogContent>
						<CustomDialogActions
							onCancel={closeDeleteConfirm}
							deleteBtn={true}
							onDelete={handleDeleteAppointment}
							actionSx={{ mb: '0.5rem' }}
							isDeleting={deleting}
						/>
					</CustomDialog>

					<Snackbar
						open={snackbar.open}
						autoHideDuration={4000}
						anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
						sx={{ mt: '4rem' }}
						onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
					>
						<Alert
							onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
							severity={snackbar.severity}
							sx={{ width: isMobileSize ? '60%' : '100%', fontSize: isMobileSize ? '0.75rem' : undefined }}
						>
							{snackbar.message}
						</Alert>
					</Snackbar>
				</Box>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminConsultationAppointments;
