import { Box, Typography, DialogContent } from '@mui/material';
import { useContext } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { ConsultationSlot } from '../../interfaces/consultation';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { dateTimeFormatter } from '../../utils/dateFormatter';
import theme from '../../themes';

interface SlotBookingsDialogProps {
	slot: ConsultationSlot | null;
	open: boolean;
	onClose: () => void;
}

const SlotBookingsDialog = ({ slot, open, onClose }: SlotBookingsDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const appointments = slot?.appointments ?? [];
	const consultantName = (apt: (typeof appointments)[0]) => {
		const c = apt.assignedConsultantId;
		if (!c || typeof c === 'string') return '—';
		return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
	};
	const guestLabel = (apt: (typeof appointments)[0]) =>
		apt.guestName || apt.guestEmail || 'Guest';

	return (
		<CustomDialog
			openModal={open}
			closeModal={onClose}
			title="Slot bookings"
			maxWidth="sm"
		>
			<DialogContent>
				{slot && (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						<Box>
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
								Date & time
							</Typography>
							<Typography variant="body2" sx={{ fontSize: isMobileSize ? '0.8rem' : '0.85rem' }}>
								{dateTimeFormatter(slot.slotStart)}
							</Typography>
						</Box>
						<Box>
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
								Bookings
							</Typography>
							{appointments.length === 0 ? (
								<Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									No bookings for this slot.
								</Typography>
							) : (
								<Box component="ul" sx={{ m: 0, pl: 2.5, pt: 1 }}>
									{appointments.map((apt) => (
										<Typography
											key={apt._id}
											component="li"
											variant="body2"
											sx={{
												fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												mb: 0.75,
												color: theme.palette.text.primary,
											}}
										>
											<strong>{consultantName(apt)}</strong> — Booked by {guestLabel(apt)}
											{apt.guestEmail && apt.guestName && ` (${apt.guestEmail})`}
										</Typography>
									))}
								</Box>
							)}
						</Box>
					</Box>
				)}
			</DialogContent>
			<CustomDialogActions onCancel={onClose} hideSubmit cancelBtnText="Close" actionSx={{ margin: '0.5rem 0.5rem 0.5rem 0' }} />
		</CustomDialog>
	);
};

export default SlotBookingsDialog;
