import {
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	IconButton,
	Tooltip,
	Chip,
	FormControl,
	MenuItem,
	Select,
	SelectChangeEvent,
} from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { useContext, useState } from 'react';
import { ConsultationSlot } from '../../interfaces/consultation';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';
import { dateTimeFormatter } from '../../utils/dateFormatter';
import CustomActionBtn from '../layouts/table/CustomActionBtn';
import NoContentBoxAdmin from '../layouts/noContentBox/NoContentBoxAdmin';

interface ConsultationSlotsListProps {
	slots: ConsultationSlot[];
	onEdit: (slot: ConsultationSlot) => void;
	onDelete: (slotId: string) => void;
	onViewAppointment?: (slot: ConsultationSlot) => void;
	consultationDuration: number;
}

const ConsultationSlotsList = ({
	slots,
	onEdit,
	onDelete,
	onViewAppointment,
	consultationDuration,
}: ConsultationSlotsListProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [statusFilter, setStatusFilter] = useState<string>('all');

	const filteredSlots = slots.filter((slot) => {
		if (statusFilter === 'available') {
			return !slot.appointmentRef;
		} else if (statusFilter === 'booked') {
			return !!slot.appointmentRef;
		}
		return true;
	});

	const formatSlotDateTime = (dateString: string) => {
		return dateTimeFormatter(dateString);
	};

	const getConsultantNames = (slot: ConsultationSlot): string => {
		if (slot.availableConsultantIds && Array.isArray(slot.availableConsultantIds)) {
			if (slot.availableConsultantIds.length === 0) {
				// Use createdBy as fallback
				if (typeof slot.createdBy === 'object' && slot.createdBy) {
					return `${slot.createdBy.firstName} ${slot.createdBy.lastName}`;
				}
				return 'Default';
			}
			// Check if it's an array of objects (populated) or strings
			const firstItem = slot.availableConsultantIds[0];
			if (typeof firstItem === 'object' && firstItem !== null) {
				return slot.availableConsultantIds
					.map((c: any) => `${c.firstName} ${c.lastName}`)
					.join(', ');
			}
		}
		// Fallback to createdBy
		if (typeof slot.createdBy === 'object' && slot.createdBy) {
			return `${slot.createdBy.firstName} ${slot.createdBy.lastName}`;
		}
		return 'Default';
	};

	const isSlotBooked = (slot: ConsultationSlot) => {
		return !!slot.appointmentRef;
	};

	const getAppointmentInfo = (slot: ConsultationSlot) => {
		if (!slot.appointmentRef || typeof slot.appointmentRef === 'string') {
			return null;
		}
		return slot.appointmentRef;
	};

	const sectionSx = {
		backgroundColor: theme.bgColor?.common,
		borderRadius: '0.75rem',
		padding: isMobileSize ? '1rem' : '1.25rem',
		border: `1px solid ${theme.palette.divider}`,
		boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
	};

	if (slots.length === 0) {
		return (
			<Box sx={{ ...sectionSx, mt: '2rem', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '8rem' }}>
				<Typography variant='body1' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem' }}>
					No slots created for this consultation
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ ...sectionSx, mt: '2rem' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1rem' }}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
					Consultation Slots ({filteredSlots.length})
				</Typography>
				<FormControl size='small' sx={{ minWidth: 120 }}>
					<Select
						value={statusFilter}
						onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
						sx={{
							backgroundColor: theme.bgColor?.common,
							fontSize: isMobileSize ? '0.75rem' : '0.85rem',
						}}>
						<MenuItem value='all' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
							All Slots
						</MenuItem>
						<MenuItem value='available' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
							Available
						</MenuItem>
						<MenuItem value='booked' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
							Booked
						</MenuItem>
					</Select>
				</FormControl>
			</Box>

			{filteredSlots.length === 0 ? (
				<NoContentBoxAdmin
					content={statusFilter === 'all' ? 'No slots created' : `No ${statusFilter} slots`}
				/>
			) : (
				<Box sx={{ overflowX: 'auto' }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 'bold' }}>
									Date & Time
								</TableCell>
								{!isMobileSize && (
									<TableCell sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 'bold' }}>
										Duration
									</TableCell>
								)}
								{!isMobileSize && (
									<TableCell sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 'bold' }}>
										Consultants
									</TableCell>
								)}
								<TableCell sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 'bold' }}>
									Status
								</TableCell>
								<TableCell sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 'bold' }}>
									Actions
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{filteredSlots.map((slot) => {
								const isBooked = isSlotBooked(slot);
								const appointment = getAppointmentInfo(slot);

								return (
									<TableRow key={slot._id} hover>
										<TableCell sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											{formatSlotDateTime(slot.slotStart)}
										</TableCell>
										{!isMobileSize && (
											<TableCell sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												{slot.duration || consultationDuration} min
											</TableCell>
										)}
										{!isMobileSize && (
											<TableCell sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												{getConsultantNames(slot)}
											</TableCell>
										)}
										<TableCell>
											<Chip
												label={isBooked ? 'Booked' : 'Available'}
												size='small'
												sx={{
													fontSize: isMobileSize ? '0.7rem' : '0.75rem',
													height: isMobileSize ? '1.5rem' : '1.75rem',
													backgroundColor: isBooked
														? theme.palette.grey[300]
														: theme.palette.success.light + '40',
													color: isBooked ? theme.palette.text.secondary : theme.palette.success.main,
												}}
											/>
											{appointment && (
												<Tooltip
													title={`Booked by: ${appointment.guestName || appointment.guestEmail || 'Guest'}`}
													arrow>
													<IconButton size='small' sx={{ ml: '0.5rem', padding: '0.25rem' }}>
														<Visibility fontSize='small' />
													</IconButton>
												</Tooltip>
											)}
										</TableCell>
										<TableCell>
											<Box sx={{ display: 'flex', gap: '0.5rem' }}>
												{!isBooked && (
													<>
														<CustomActionBtn
															title='Edit'
															onClick={() => onEdit(slot)}
															icon={<Edit fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
														/>
														<CustomActionBtn
															title='Delete'
															onClick={() => onDelete(slot._id)}
															icon={<Delete fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
														/>
													</>
												)}
												{isBooked && onViewAppointment && (
													<CustomActionBtn
														title='View Appointment'
														onClick={() => onViewAppointment(slot)}
														icon={<Visibility fontSize='small' sx={{ fontSize: isMobileSize ? '0.8rem' : undefined }} />}
													/>
												)}
											</Box>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Box>
			)}
		</Box>
	);
};

export default ConsultationSlotsList;
