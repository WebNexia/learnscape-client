import {
	Box,
	Typography,
	DialogContent,
	TextField,
	Button,
	Snackbar,
	Alert,
	Link,
	CircularProgress,
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

interface AppointmentDetailModalProps {
	appointmentId: string | null;
	open: boolean;
	onClose: () => void;
	onUpdated: () => void; // refetch list after notes/cancel
}

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

const AppointmentDetailModal = ({ appointmentId, open, onClose, onUpdated }: AppointmentDetailModalProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [appointment, setAppointment] = useState<ConsultationAppointment | null>(null);
	const [loading, setLoading] = useState(false);
	const [notesValue, setNotesValue] = useState('');
	const [savingNotes, setSavingNotes] = useState(false);
	const [cancelling, setCancelling] = useState(false);
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
			.then((res) => {
				if (res.data?.data && !cancelled) {
					setAppointment(res.data.data);
					setNotesValue(res.data.data.adminNotes || '');
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

	const handleCancelAppointment = async () => {
		if (!appointmentId || appointment?.status === 'cancelled') return;
		if (!window.confirm('Cancel this appointment? The slot will become available again.')) return;
		setCancelling(true);
		try {
			await axios.patch(`${base_url}/consultations/appointments/${appointmentId}/cancel`, {});
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
		<CustomDialog openModal={open} closeModal={onClose} title='Appointment details' maxWidth='sm'>
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
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						<Box>
							<Typography variant='caption' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
								Consultation
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
								{consultationTitle}
							</Typography>
						</Box>
						<Box>
							<Typography variant='caption' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
								Date & time
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
								{dateTimeFormatter(appointment.appointmentDate)}
							</Typography>
						</Box>
						<Box>
							<Typography variant='caption' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
								Guest
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
								{appointment.guestName || '—'} {appointment.guestEmail && `(${appointment.guestEmail})`}
							</Typography>
							{appointment.guestPhone && (
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mt: 0.25 }}>
									{appointment.guestPhone}
								</Typography>
							)}
						</Box>
						<Box>
							<Typography variant='caption' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
								Consultant
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
								{consultantName}
							</Typography>
						</Box>
						<Box>
							<Typography variant='caption' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
								Status
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', textTransform: 'capitalize' }}>
								{appointment.status}
							</Typography>
						</Box>
						<Box>
							<Typography variant='caption' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
								Payment
							</Typography>
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
								{paymentStatus}
							</Typography>
						</Box>

						{appointment.zoomJoinUrl && appointment.status !== 'cancelled' && (
							<Box sx={{ mt: 1 }}>
								<Typography variant='caption' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
									Zoom link (guest)
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
									<Link href={appointment.zoomJoinUrl} target='_blank' rel='noopener noreferrer' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Join meeting
									</Link>
									<Button size='small' startIcon={<ContentCopy fontSize='small' />} onClick={handleCopyZoomLink}>
										{copySuccess ? 'Copied' : 'Copy'}
									</Button>
								</Box>
							</Box>
						)}

						<Box sx={{ mt: 1 }}>
							<Typography variant='caption' color='text.secondary' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
								Admin notes
							</Typography>
							<TextField
								multiline
								minRows={2}
								maxRows={6}
								value={notesValue}
								onChange={(e) => setNotesValue(e.target.value)}
								placeholder='Add internal notes...'
								fullWidth
								size='small'
								sx={{ mt: 0.5, backgroundColor: theme.bgColor?.common }}
							/>
							<Button
								variant='outlined'
								size='small'
								onClick={handleSaveNotes}
								disabled={savingNotes}
								sx={{ mt: 1 }}
							>
								{savingNotes ? 'Saving...' : 'Save notes'}
							</Button>
						</Box>

						{appointment.status !== 'cancelled' && (
							<Box sx={{ mt: 1 }}>
								<Button variant='outlined' color='error' size='small' onClick={handleCancelAppointment} disabled={cancelling}>
									{cancelling ? 'Cancelling...' : 'Cancel appointment'}
								</Button>
							</Box>
						)}
					</Box>
				)}
			</DialogContent>
			<CustomDialogActions onCancel={onClose} hideSubmit cancelBtnText='Close' />
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
		</CustomDialog>
	);
};

export default AppointmentDetailModal;
