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
	CircularProgress,
	Paper,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import AdminTableSkeleton from '../components/layouts/skeleton/AdminTableSkeleton';
import { useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useState, useCallback } from 'react';
import { KeyboardBackspaceOutlined, Visibility, Delete, Description, Person, Email, AccessTime, Star, StarBorder } from '@mui/icons-material';
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
	const [formDialogAppointmentId, setFormDialogAppointmentId] = useState<string | null>(null);
	const [formDialogGuest, setFormDialogGuest] = useState<{ name?: string; email?: string }>({});
	const [formSubmissionDetail, setFormSubmissionDetail] = useState<{
		title: string;
		fields: Array<{ fieldId: string; label: string; type: string; order: number }>;
		responses: Array<{ fieldId: string; value: unknown }>;
		submittedAt?: string;
	} | null>(null);
	const [formSubmissionLoading, setFormSubmissionLoading] = useState(false);
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

	useEffect(() => {
		if (!formDialogAppointmentId) return;
		setFormSubmissionLoading(true);
		axios
			.get(`${base_url}/consultations/appointments/${formDialogAppointmentId}/form-submissions`)
			.then((subRes) => {
				const list = subRes.data?.data;
				if (!Array.isArray(list) || list.length === 0) {
					setFormSubmissionDetail(null);
					return;
				}
				const firstId = list[0]._id;
				return axios.get(`${base_url}/feedback-forms/submissions/${firstId}`);
			})
			.then((detailRes) => {
				if (!detailRes?.data?.data) return;
				const data = detailRes.data.data;
				const form = data.formId;
				const title = (form && (typeof form === 'object' ? form.title : null)) || 'Form submission';
				const fields = (form && typeof form === 'object' && Array.isArray(form.fields)) ? form.fields : [];
				setFormSubmissionDetail({
					title,
					fields: fields.map((f: any) => ({ fieldId: f.fieldId, label: f.label, type: f.type || 'text', order: f.order ?? 0 })),
					responses: Array.isArray(data.responses) ? data.responses : [],
					submittedAt: data.submittedAt,
				});
			})
			.catch(() => setFormSubmissionDetail(null))
			.finally(() => setFormSubmissionLoading(false));
	}, [formDialogAppointmentId]);

	const formatSubmissionFieldValue = (field: { type: string }, value: unknown): string => {
		if (value === undefined || value === null) return '—';
		if (field.type === 'rating') return String(value);
		if (field.type === 'checkbox') return Array.isArray(value) ? value.join(', ') : String(value);
		if (field.type === 'date') return value ? new Date(value as string).toLocaleDateString() : '—';
		return String(value);
	};

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

	const openFormDialog = (appointmentId: string, guestName?: string, guestEmail?: string) => {
		setFormDialogAppointmentId(appointmentId);
		setFormDialogGuest({ name: guestName, email: guestEmail });
		setFormSubmissionDetail(null);
	};

	const closeFormDialog = () => {
		setFormDialogAppointmentId(null);
		setFormDialogGuest({});
		setFormSubmissionDetail(null);
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
												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
													<CustomActionBtn
														title='View'
														onClick={() => openDetail(apt._id)}
														icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>
													<CustomActionBtn
														title='View Client Answers'
														onClick={() => openFormDialog(apt._id, apt.guestName, apt.guestEmail)}
														icon={<Description fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>
													<CustomActionBtn
														title='Delete'
														onClick={() => openDeleteConfirm(apt._id)}
														icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>
												</Box>
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
						openModal={!!formDialogAppointmentId}
						closeModal={closeFormDialog}
						title='Client Answers'
						maxWidth='sm'
					>
						<DialogContent sx={{ pt: 1 }}>
							{formSubmissionLoading ? (
								<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
									<CircularProgress size={32} />
								</Box>
							) : formSubmissionDetail ? (
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									{/* Submitter Information */}
									<Paper
										elevation={0}
										sx={{
											p: 2,
											borderRadius: 1.5,
											border: `1px solid ${theme.palette.divider}`,
											backgroundColor: theme.bgColor?.secondary || theme.palette.grey[50],
										}}
									>
										<Typography
											variant='subtitle2'
											sx={{
												fontWeight: 700,
												color: theme.palette.primary.main,
												fontSize: isMobileSize ? '0.8rem' : '0.9rem',
												mb: 1.5,
											}}
										>
											Client Information
										</Typography>
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<Person sx={{ fontSize: '1.1rem', color: theme.palette.text.secondary }} />
												<Typography variant='body2' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
													Name:
												</Typography>
												<Typography variant='body2' sx={{ fontWeight: 500, color: theme.palette.primary.main, fontSize: isMobileSize ? '0.8rem' : '0.85rem' }}>
													{formDialogGuest.name || '—'}
												</Typography>
											</Box>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
												<Email sx={{ fontSize: '1.1rem', color: theme.palette.text.secondary }} />
												<Typography variant='body2' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
													Email:
												</Typography>
												<Typography variant='body2' sx={{ fontWeight: 500, color: theme.palette.primary.main, fontSize: isMobileSize ? '0.8rem' : '0.85rem' }}>
													{formDialogGuest.email || '—'}
												</Typography>
											</Box>
											{formSubmissionDetail.submittedAt && (
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													<AccessTime sx={{ fontSize: '1.1rem', color: theme.palette.text.secondary }} />
													<Typography variant='body2' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
														Submitted At:
													</Typography>
													<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.85rem' }}>
														{dateTimeFormatter(formSubmissionDetail.submittedAt)}
													</Typography>
												</Box>
											)}
										</Box>
									</Paper>

									{/* Responses */}
									<Box>
										<Typography
											variant='subtitle2'
											sx={{
												fontWeight: 700,
												color: theme.palette.primary.main,
												fontSize: isMobileSize ? '0.8rem' : '0.9rem',
												mb: 1.25,
											}}
										>
											Responses
										</Typography>
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
											{[...formSubmissionDetail.fields]
												.sort((a, b) => a.order - b.order)
												.map((field) => {
													const response = formSubmissionDetail.responses.find((r) => r.fieldId === field.fieldId);
													const value = response?.value;
													const isRating = field.type === 'rating';
													const ratingNum = isRating ? Number(value) : 0;
													const maxStars = 5;
													return (
														<Paper
															key={field.fieldId}
															elevation={0}
															sx={{
																p: 1.5,
																borderRadius: 1.5,
																border: `1px solid ${theme.palette.divider}`,
																backgroundColor: theme.bgColor?.secondary || theme.palette.grey[50],
															}}
														>
															<Typography
																variant='body2'
																sx={{
																	mb: 0.75,
																	fontSize: isMobileSize ? '0.75rem' : '0.8rem',
																	fontWeight: 500,
																	color: theme.palette.primary.main,
																}}
															>
																{field.label}
															</Typography>
															{isRating ? (
																<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
																	{Array.from({ length: maxStars }, (_, i) =>
																		i < Math.floor(ratingNum) ? (
																			<Star key={i} sx={{ fontSize: '1.25rem', color: '#ffc107' }} />
																		) : (
																			<StarBorder key={i} sx={{ fontSize: '1.25rem', color: theme.palette.text.secondary }} />
																		)
																	)}
																	<Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.85rem', ml: 0.5 }}>
																		{formatSubmissionFieldValue(field, value)}
																	</Typography>
																</Box>
															) : (
																<Typography
																	variant='body2'
																	sx={{
																		fontSize: isMobileSize ? '0.85rem' : '0.9rem',
																		color: theme.palette.text.primary,
																		whiteSpace: 'pre-wrap',
																	}}
																>
																	{formatSubmissionFieldValue(field, value)}
																</Typography>
															)}
														</Paper>
													);
												})}
										</Box>
									</Box>
								</Box>
							) : (
								<Typography variant='body2' color='text.secondary'>
									{formDialogAppointmentId ? 'No form submission or could not load.' : ''}
								</Typography>
							)}
						</DialogContent>
						<CustomDialogActions onCancel={closeFormDialog} hideSubmit cancelBtnText='Close' actionSx={{ margin: '0.5rem 0.5rem 0rem 0rem' }} />
					</CustomDialog>

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
