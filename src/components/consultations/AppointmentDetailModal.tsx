import {
	Box,
	Typography,
	DialogContent,
	Button,
	Snackbar,
	Alert,
	Link,
	CircularProgress,
	DialogActions,
} from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { dateTimeFormatter } from '../../utils/dateFormatter';
import { ConsultationAppointment } from '../../interfaces/consultation';
import theme from '../../themes';
import { useContext, useEffect, useState } from 'react';
import axios from '../../utils/axiosInstance';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import ContentCopy from '@mui/icons-material/ContentCopy';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import CustomTextField from '../forms/customFields/CustomTextField';

interface AppointmentDetailModalProps {
	appointmentId: string | null;
	open: boolean;
	onClose: () => void;
	onUpdated: () => void; // refetch list after notes/cancel
}

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

const InfoRow = ({
	label,
	value,
	isMobileSize,
	capitalize,
}: {
	label: string;
	value: string | undefined;
	isMobileSize: boolean;
	capitalize?: boolean;
}) => (
	<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
		<Typography variant='caption' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
			{label}
		</Typography>
		<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.85rem', textTransform: capitalize ? 'capitalize' : undefined }}>
			{value ?? '—'}
		</Typography>
	</Box>
);

const AppointmentDetailModal = ({ appointmentId, open, onClose, onUpdated }: AppointmentDetailModalProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [appointment, setAppointment] = useState<ConsultationAppointment | null>(null);
	const [loading, setLoading] = useState(false);
	const [notesValue, setNotesValue] = useState('');
	const [savingNotes, setSavingNotes] = useState(false);
	const [cancelling, setCancelling] = useState(false);
	const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
		open: false,
		message: '',
		severity: 'success',
	});
	const [copySuccess, setCopySuccess] = useState(false);

	useEffect(() => {
		if (!open || !appointmentId) {
			setAppointment(null);
			setNotesValue('');
			return;
		}
		let cancelled = false;
		setLoading(true);
		axios
			.get(`${base_url}/consultations/appointments/${appointmentId}`)
			.then((appRes) => {
				if (cancelled) return;
				if (appRes.data?.data) {
					setAppointment(appRes.data.data);
					setNotesValue(appRes.data.data.adminNotes || '');
				}
			})
			.catch(() => {
				if (!cancelled) setAppointment(null);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [open, appointmentId]);

	const consultantName =
		appointment?.assignedConsultantId && typeof appointment.assignedConsultantId === 'object'
			? [appointment.assignedConsultantId.firstName, appointment.assignedConsultantId.lastName].filter(Boolean).join(' ')
			: '—';

	const consultationTitle =
		appointment?.consultationId && typeof appointment.consultationId === 'object'
			? appointment.consultationId.title
			: '—';

	const paymentStatus =
		appointment?.paymentRef && typeof appointment.paymentRef === 'object' ? appointment.paymentRef.status : appointment?.paymentStatus || '—';

	const handleSaveNotes = async () => {
		if (!appointmentId) return;
		setSavingNotes(true);
		try {
			await axios.patch(`${base_url}/consultations/appointments/${appointmentId}/notes`, { adminNotes: notesValue });
			setSnackbar({ open: true, message: 'Notes saved.', severity: 'success' });
			onUpdated();
		} catch (err: any) {
			setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to save notes', severity: 'error' });
		} finally {
			setSavingNotes(false);
		}
	};

	const handleCancelAppointment = () => {
		if (!appointmentId || appointment?.status === 'cancelled') return;
		setCancelConfirmOpen(true);
	};

	const confirmCancelAppointment = async () => {
		if (!appointmentId) return;
		setCancelling(true);
		try {
			await axios.patch(`${base_url}/consultations/appointments/${appointmentId}/cancel`, {});
			setCancelConfirmOpen(false);
			setSnackbar({ open: true, message: 'Appointment cancelled.', severity: 'success' });
			onUpdated();
			onClose();
		} catch (err: any) {
			setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to cancel', severity: 'error' });
		} finally {
			setCancelling(false);
		}
	};

	const handleCopyZoomLink = () => {
		const url = appointment?.zoomJoinUrl;
		if (!url) return;
		navigator.clipboard.writeText(url).then(() => {
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		});
	};

	return (
		<CustomDialog openModal={open} closeModal={onClose} title='Appointment Details' maxWidth='sm'>
			<DialogContent>
				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
						<CircularProgress size={32} />
					</Box>
				) : !appointment ? (
					<Typography variant='body2' color='text.secondary'>
						Could not load appointment.
					</Typography>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						{/* Appointment — Consultation & Date */}
						<Box sx={{ pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant='subtitle2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
								Appointment
							</Typography>
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								<InfoRow label='Consultation' value={consultationTitle} isMobileSize={isMobileSize} />
								<InfoRow label='Date & time' value={dateTimeFormatter(appointment.appointmentDate)} isMobileSize={isMobileSize} />
							</Box>
							{/* Consultant, Status, Payment — same row */}
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: isMobileSize ? 1.5 : 2.5, mt: 1.5, justifyContent: 'space-between' }}>
								<InfoRow label='Consultant' value={consultantName} isMobileSize={isMobileSize} />
								<InfoRow label='Status' value={appointment.status} isMobileSize={isMobileSize} capitalize />
								<InfoRow label='Payment' value={paymentStatus} isMobileSize={isMobileSize} />
							</Box>
						</Box>

						{/* Guest — name, email, phone on one row */}
						<Box sx={{ pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
							<Typography variant='subtitle2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
								Guest
							</Typography>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: isMobileSize ? 1 : 2, alignItems: 'baseline', justifyContent: 'space-between' }}>
								<InfoRow label='Name' value={appointment.guestName || '—'} isMobileSize={isMobileSize} />
								<InfoRow label='Email' value={appointment.guestEmail} isMobileSize={isMobileSize} />
								<InfoRow label='Phone' value={appointment.guestPhone} isMobileSize={isMobileSize} />
							</Box>
						</Box>

						{appointment.zoomJoinUrl && appointment.status !== 'cancelled' && (
							<Box sx={{ pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
								<Typography variant='subtitle2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
									Meeting link
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
									<Link href={appointment.zoomJoinUrl} target='_blank' rel='noopener noreferrer' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', }}>
										Join meeting
									</Link>
									<Button size='small' startIcon={<ContentCopy fontSize='small' />} onClick={handleCopyZoomLink}>
										{copySuccess ? 'Copied' : 'Copy link'}
									</Button>
								</Box>
							</Box>
						)}

						{/* Admin notes */}
						<Box>
							<Typography variant='subtitle2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', fontWeight: 600, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
								Admin notes
							</Typography>
							<CustomTextField
								multiline
								resizable
								rows={2}
								value={notesValue}
								onChange={(e) => setNotesValue(e.target.value)}
								placeholder='Add internal notes...'
								fullWidth
								size='small'
								sx={{ backgroundColor: theme.bgColor?.common }}
							/>
							<CustomSubmitButton onClick={handleSaveNotes} disabled={savingNotes} sx={{ mt: 1 }}>
								{savingNotes ? 'Saving...' : 'Save notes'}
							</CustomSubmitButton>
						</Box>


					</Box>
				)}
			</DialogContent>
			<DialogActions sx={{ justifyContent: appointment?.status !== 'cancelled' ? 'space-between' : 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 1, py: '0rem' }}>
				{appointment?.status !== 'cancelled' && (
					<CustomDeleteButton size='small' onClick={handleCancelAppointment} disabled={cancelling}>
						{cancelling ? 'Cancelling...' : 'Cancel appointment'}
					</CustomDeleteButton>
				)}
				<CustomDialogActions onCancel={onClose} hideSubmit cancelBtnText='Close' actionSx={{ margin: '0.5rem 0rem 0rem 0rem' }} />
			</DialogActions>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
			>
				<Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
					{snackbar.message}
				</Alert>
			</Snackbar>

			<CustomDialog
				openModal={cancelConfirmOpen}
				closeModal={() => setCancelConfirmOpen(false)}
				title='Cancel Appointment'
				content='The slot will become available again.'
				maxWidth='xs'
			>
				<CustomDialogActions
					onCancel={() => setCancelConfirmOpen(false)}
					onDelete={confirmCancelAppointment}
					cancelBtnText='Keep'
					deleteBtnText='Yes, cancel'
					deleteBtn
					isDeleting={cancelling}
					disableBtn={cancelling}
					actionSx={{ mb: '0.5rem' }}
				/>
			</CustomDialog>
		</CustomDialog>
	);
};

export default AppointmentDetailModal;
