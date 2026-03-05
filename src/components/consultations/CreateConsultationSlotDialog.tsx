import {
	Box,
	DialogContent,
	Typography,
	FormControl,
	MenuItem,
	Select,
	SelectChangeEvent,
	FormControlLabel,
	Checkbox,
	Tooltip,
} from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-gb';
import { useContext, useState, useEffect, useMemo } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { SearchUser } from '../../interfaces/search';
import ConsultantSearchSelect from '../ConsultantSearchSelect';
import theme from '../../themes';
import { Consultation, ConsultationSlot } from '../../interfaces/consultation';
import { useAuth } from '../../hooks/useAuth';

interface CreateConsultationSlotDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (slotData: { slotStart: string; duration: number; availableConsultantIds: string[]; addCreatorAsConsultant: boolean }) => Promise<void>;
	onDelete?: (slotId: string) => Promise<void>;
	consultation: Consultation | undefined;
	existingSlot?: ConsultationSlot | null;
}

const CreateConsultationSlotDialog = ({
	isOpen,
	onClose,
	onCreate,
	onDelete,
	consultation,
	existingSlot,
}: CreateConsultationSlotDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const { user } = useAuth();
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const currentUserId = user?._id;
	// Consultants who have a booking on this slot cannot be removed
	const bookedConsultantIds = useMemo(() => {
		const appointments = existingSlot?.appointments ?? [];
		return new Set(
			appointments.map((a) => {
				const c = a.assignedConsultantId;
				return c && typeof c === 'object' ? (c._id ?? '') : (c ?? '');
			}).filter(Boolean)
		);
	}, [existingSlot?.appointments]);

	const [slotStart, setSlotStart] = useState<Dayjs | null>(null);
	const [duration, setDuration] = useState<number>(consultation?.duration ?? 60);
	const [addMyselfAsConsultant, setAddMyselfAsConsultant] = useState<boolean>(true);
	const [selectedConsultants, setSelectedConsultants] = useState<SearchUser[]>([]);
	const [consultantSearchValue, setConsultantSearchValue] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);

	// Initialize form when dialog opens or existingSlot changes
	useEffect(() => {
		if (isOpen) {
			if (existingSlot) {
				setSlotStart(dayjs(existingSlot.slotStart));
				setDuration(existingSlot.duration ?? consultation?.duration ?? 60);
				// Populate selected consultants from slot (exclude current user — they use "Add myself" checkbox)
				const consultants = existingSlot.availableConsultantIds;
				if (Array.isArray(consultants) && consultants.length > 0) {
					let myselfInSlot = false;
					const list: SearchUser[] = consultants
						.map((c: any) => {
							if (c && typeof c === 'object' && c._id) {
								const idStr = c._id.toString?.() ?? String(c._id);
								if (currentUserId && (currentUserId.toString?.() ?? String(currentUserId)) === idStr) {
									myselfInSlot = true;
									return null; // do not add current user to chips; "Add myself" handles that
								}
								return {
									_id: c._id,
									firebaseUserId: '',
									username: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || c._id,
									firstName: c.firstName ?? '',
									lastName: c.lastName ?? '',
									email: c.email,
									imageUrl: c.imageUrl ?? '',
									role: '',
								};
							}
							return null;
						})
						.filter(Boolean) as SearchUser[];
					setSelectedConsultants(list);
					setAddMyselfAsConsultant(myselfInSlot);
				} else {
					setSelectedConsultants([]);
					setAddMyselfAsConsultant(true);
				}
			} else {
				setSlotStart(dayjs().add(1, 'hour'));
				setDuration(consultation?.duration ?? 60);
				setSelectedConsultants([]);
				setAddMyselfAsConsultant(true);
			}
			setError('');
			setConsultantSearchValue('');
		}
	}, [isOpen, existingSlot, consultation]);

	const handleConsultantSelect = (selectedUser: SearchUser) => {
		const idStr = selectedUser._id?.toString?.() ?? String(selectedUser._id);
		const isSelf = currentUserId && (currentUserId.toString?.() ?? String(currentUserId)) === idStr;
		if (isSelf) {
			setAddMyselfAsConsultant(true);
			setConsultantSearchValue('');
			return;
		}
		if (!selectedConsultants.find((c) => (c._id?.toString?.() ?? String(c._id)) === idStr)) {
			setSelectedConsultants([...selectedConsultants, selectedUser]);
			setConsultantSearchValue('');
		}
	};

	const removeConsultant = (userId: string) => {
		const idStr = userId?.toString?.() ?? String(userId);
		if (bookedConsultantIds.has(idStr)) return; // cannot remove consultant who has a booking
		setSelectedConsultants(selectedConsultants.filter((c) => (c._id?.toString?.() ?? String(c._id)) !== idStr));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!slotStart) {
			setError('Please select a date and time');
			return;
		}

		if (slotStart.isBefore(dayjs())) {
			setError('Slot start time must be in the future');
			return;
		}

		if (duration <= 0) {
			setError('Duration must be greater than 0');
			return;
		}

		if (!addMyselfAsConsultant && selectedConsultants.length === 0) {
			setError('Select at least one consultant');
			return;
		}

		setIsSubmitting(true);
		try {
			await onCreate({
				slotStart: slotStart.toISOString(),
				duration,
				availableConsultantIds: selectedConsultants.map((c) => c._id),
				addCreatorAsConsultant: addMyselfAsConsultant,
			});
			// Reset form
			setSlotStart(dayjs().add(1, 'hour'));
			setDuration(consultation?.duration ?? 60);
			setAddMyselfAsConsultant(true);
			setSelectedConsultants([]);
			setConsultantSearchValue('');
			setError('');
			onClose();
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to create slot');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isSubmitting && !isDeleting) {
			setError('');
			setIsDeleteConfirmOpen(false);
			onClose();
		}
	};

	const handleDelete = async () => {
		if (!existingSlot || !onDelete) return;

		setIsDeleteConfirmOpen(true);
	};

	const confirmDelete = async () => {
		if (!existingSlot || !onDelete) return;

		setIsDeleting(true);
		setError('');
		try {
			await onDelete(existingSlot._id);
			setIsDeleteConfirmOpen(false);
			onClose();
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to delete slot');
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<CustomDialog
			openModal={isOpen}
			closeModal={handleClose}
			title={existingSlot ? 'Edit Consultation Slot' : 'Create Consultation Slot'}
			maxWidth='sm'>
			<form onSubmit={handleSubmit}>
				<DialogContent>
					<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en-gb'>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', mt: '0.5rem' }}>
							<Box>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem', mb: '0.5rem' }}>
									Date & Time*
								</Typography>
								<DateTimePicker
									value={slotStart}
									onChange={(newValue) => setSlotStart(newValue)}
									minDateTime={dayjs()}
									slotProps={{
										textField: {
											required: true,
											fullWidth: true,
											size: 'small',
											sx: {
												backgroundColor: theme.bgColor?.common,
												'& .MuiInputBase-input': {
													fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												},
											},
										},
									}}
								/>
							</Box>

							<FormControl fullWidth>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem', mb: '0.5rem' }}>
									Duration (minutes)*
								</Typography>
								<Select
									value={duration.toString()}
									onChange={(e: SelectChangeEvent) => setDuration(parseInt(e.target.value, 10))}
									size='small'
									required
									sx={{
										backgroundColor: theme.bgColor?.common,
										fontSize: isMobileSize ? '0.75rem' : '0.85rem',
									}}>
									<MenuItem value='30' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
										30
									</MenuItem>
									<MenuItem value='45' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
										45
									</MenuItem>
									<MenuItem value='60' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
										60
									</MenuItem>
									<MenuItem value='75' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
										75
									</MenuItem>
									<MenuItem value='90' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
										90
									</MenuItem>
								</Select>
							</FormControl>

							<Box>
								<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem', mb: '0.5rem' }}>
									Available Consultants*
								</Typography>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem', mb: '0.5rem', color: theme.palette.text.secondary }}>
									Select at least one consultant (yourself and/or others)
								</Typography>
								<FormControlLabel
									control={
										<Checkbox
											checked={addMyselfAsConsultant}
											onChange={(e) => setAddMyselfAsConsultant(e.target.checked)}
											size='small'
										/>
									}
									label={
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
											Add myself as consultant
										</Typography>
									}
									sx={{ mb: '0.25rem', mt: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}
								/>

								<ConsultantSearchSelect
									value={consultantSearchValue}
									onChange={setConsultantSearchValue}
									onSelect={handleConsultantSelect}
									placeholder='Search consultants...'
									selectedUserIds={selectedConsultants.map((c) => c._id)}
								/>

								{selectedConsultants.length > 0 && (
									<Box sx={{ mt: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
										{selectedConsultants.map((consultant) => {
											const cid = consultant._id?.toString?.() ?? String(consultant._id);
											const isBooked = bookedConsultantIds.has(cid);
											return (
												<Tooltip
													key={consultant._id}
													title={isBooked ? 'Has booking – cannot remove' : 'Click × to remove'}
													placement='top'
													arrow
												>
													<Box
														sx={{
															display: 'inline-flex',
															alignItems: 'center',
															padding: '0.25rem 0.75rem',
															backgroundColor: isBooked ? theme.palette.grey[500] : theme.palette.primary.main,
															color: 'white',
															borderRadius: '1rem',
															fontSize: isMobileSize ? '0.7rem' : '0.75rem',
															fontFamily: theme.fontFamily?.main,
														}}
													>
														{consultant.firstName} {consultant.lastName}
														{!isBooked && (
															<Box
																component='span'
																onClick={() => removeConsultant(consultant._id)}
																sx={{
																	marginLeft: '0.5rem',
																	cursor: 'pointer',
																	'&:hover': { opacity: 0.7 },
																}}
															>
																×
															</Box>
														)}
													</Box>
												</Tooltip>
											);
										})}
									</Box>
								)}
							</Box>

							{error && (
								<Typography variant='body2' sx={{ color: 'error.main', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{error}
								</Typography>
							)}
						</Box>
					</LocalizationProvider>
				</DialogContent>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.25rem 0.75rem' }}>
					<Box sx={{ marginBottom: '0.5rem' }}>
						{existingSlot && !existingSlot.appointmentRef && (
							<CustomDeleteButton
								type='button'
								onClick={handleDelete}
								disabled={isSubmitting || isDeleting}
								sx={{ height: isMobileSize ? '1.5rem' : undefined }}>
								{isMobileSize ? 'Delete' : 'Delete Slot'}
							</CustomDeleteButton>
						)}
					</Box>
					<CustomDialogActions
						onCancel={handleClose}
						onSubmit={() => {
							handleSubmit({} as React.FormEvent);
						}}
						submitBtnText={existingSlot ? 'Update' : 'Create'}
						disableBtn={isSubmitting || !slotStart}
						disableCancelBtn={isSubmitting || isDeleting}
						isSubmitting={isSubmitting}
						actionSx={{ marginBottom: '0rem', marginRight: '-0.25rem' }}
					/>
				</Box>
			</form>

			{/* Delete Confirmation Dialog */}
			<CustomDialog
				openModal={isDeleteConfirmOpen}
				closeModal={() => {
					if (!isDeleting) {
						setIsDeleteConfirmOpen(false);
					}
				}}
				title='Delete Slot'
				maxWidth='xs'>
				<DialogContent>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', mb: '0.5rem' }}>
						Are you sure you want to delete this slot?
					</Typography>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 'bold', color: 'error.main', mt: '1rem' }}>
						This action cannot be undone.
					</Typography>
				</DialogContent>
				<CustomDialogActions
					onCancel={() => {
						if (!isDeleting) {
							setIsDeleteConfirmOpen(false);
						}
					}}
					deleteBtn={true}
					onDelete={confirmDelete}
					disableBtn={isDeleting}
					disableCancelBtn={isDeleting}
					isDeleting={isDeleting}
				/>
			</CustomDialog>
		</CustomDialog>
	);
};

export default CreateConsultationSlotDialog;
