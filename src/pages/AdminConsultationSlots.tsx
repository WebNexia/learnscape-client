import {
	Box,
	Typography,
	FormControl,
	MenuItem,
	Select,
	SelectChangeEvent,
	Button,
	Alert,
} from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import AdminPageErrorBoundary from '../components/error/AdminPageErrorBoundary';
import { useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import theme from '../themes';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import axios from '@utils/axiosInstance';
import { Consultation, ConsultationSlot } from '../interfaces/consultation';
import SlotStatistics from '../components/consultations/SlotStatistics';
import ConsultationSlotsList from '../components/consultations/ConsultationSlotsList';
import ConsultationSlotsCalendar from '../components/consultations/ConsultationSlotsCalendar';
import SlotBookingsDialog from '../components/consultations/SlotBookingsDialog';
import CreateConsultationSlotDialog from '../components/consultations/CreateConsultationSlotDialog';
import BulkSlotCreationDialog from '../components/consultations/BulkSlotCreationDialog';
import { exportSlotsToCSV } from '../utils/exportSlots';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import CustomDialog from '../components/layouts/dialog/CustomDialog';
import CustomDialogActions from '../components/layouts/dialog/CustomDialogActions';
import { DialogContent, FormControlLabel, Radio, RadioGroup, Snackbar, TextField } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import CustomDeleteButton from '../components/forms/customButtons/CustomDeleteButton';

const AdminConsultationSlots = () => {
	const { consultationId } = useParams();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const navigate = useNavigate();
	const { isOwner, isSuperAdmin } = useAuth();

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [consultation, setConsultation] = useState<Consultation | undefined>();
	const [slots, setSlots] = useState<ConsultationSlot[]>([]);
	const [isCreateSlotDialogOpen, setIsCreateSlotDialogOpen] = useState<boolean>(false);
	const [isBulkSlotDialogOpen, setIsBulkSlotDialogOpen] = useState<boolean>(false);
	const [editingSlot, setEditingSlot] = useState<ConsultationSlot | null>(null);
	const [isEditSlotDialogOpen, setIsEditSlotDialogOpen] = useState<boolean>(false);
	const [isSlotsLoading, setIsSlotsLoading] = useState<boolean>(false);
	const [slotsError, setSlotsError] = useState<string>('');
	const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
	const [isDeleteSlotDialogOpen, setIsDeleteSlotDialogOpen] = useState<boolean>(false);
	const [isDeletingSlot, setIsDeletingSlot] = useState<boolean>(false);
	const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
	const [urlErrorMessage, setUrlErrorMessage] = useState<string>('');
	const [isUrlErrorOpen, setIsUrlErrorOpen] = useState<boolean>(false);
	const [bulkCreateSnackbarMessage, setBulkCreateSnackbarMessage] = useState<string>('');
	const [isBulkCreateSnackbarOpen, setIsBulkCreateSnackbarOpen] = useState<boolean>(false);
	const [isDeleteOptionsDialogOpen, setIsDeleteOptionsDialogOpen] = useState<boolean>(false);
	const [deleteMyDays, setDeleteMyDays] = useState<string>('7');
	const [deleteAllDays, setDeleteAllDays] = useState<string>('7');
	const [isDeletingUnbooked, setIsDeletingUnbooked] = useState<boolean>(false);
	type DeleteUnbookedOption = 'my' | 'all' | 'my_days' | 'all_days';
	const [deleteUnbookedOption, setDeleteUnbookedOption] = useState<DeleteUnbookedOption>('my');
	const [slotForBookingsView, setSlotForBookingsView] = useState<ConsultationSlot | null>(null);
	const [isSlotBookingsDialogOpen, setIsSlotBookingsDialogOpen] = useState<boolean>(false);

	// Fetch consultation data
	useEffect(() => {
		if (consultationId) {
			const fetchConsultation = async () => {
				try {
					const response = await axios.get(`${base_url}/consultations/${consultationId}`);
					if (response.data.status === 200) {
						setConsultation(response.data.data);
					}
				} catch (error: any) {
					console.error('Error fetching consultation:', error);
					setSlotsError(error.response?.data?.message || 'Failed to load consultation');
				}
			};
			fetchConsultation();
		}
	}, [consultationId, base_url]);

	// Fetch slots
	const fetchSlots = async (id: string) => {
		setIsSlotsLoading(true);
		setSlotsError('');
		try {
			const response = await axios.get(`${base_url}/consultations/${id}/slots/all`);
			if (response.data.status === 200) {
				setSlots(response.data.data || []);
			}
		} catch (error: any) {
			console.error('Error fetching slots:', error);
			setSlotsError(error.response?.data?.message || 'Failed to load slots');
		} finally {
			setIsSlotsLoading(false);
		}
	};

	useEffect(() => {
		if (consultationId) {
			fetchSlots(consultationId);
		}
	}, [consultationId, base_url]);

	const sectionSx = {
		backgroundColor: theme.bgColor?.common,
		borderRadius: '0.75rem',
		padding: isMobileSize ? '1rem' : '1.25rem',
		border: `1px solid ${theme.palette.divider}`,
		boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
	};

	return (
		<AdminPageErrorBoundary>
			<DashboardPagesLayout pageName='Consultation Slots' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
					{/* Back to consultation button */}
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
						<Button
							variant='text'
							startIcon={<KeyboardBackspaceOutlined fontSize='small' />}
							sx={{
								'color': theme.textColor?.primary.main,
								'textTransform': 'inherit',
								'fontFamily': theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}
							onClick={() => {
								if (!consultationId) return;
								navigate(`/admin/consultation-edit/consultation/${consultationId}`);
							}}>
							Back to consultation
						</Button>
						{/* Consultation Title */}
						{consultation && (
							<Typography variant='h5' sx={{ fontSize: isMobileSize ? '1rem' : '1.25rem', fontWeight: 'bold' }}>
								{consultation.title}
							</Typography>
						)}
					</Box>



					{/* Slot Statistics */}
					{slots.length > 0 && <SlotStatistics slots={slots} />}

					{/* Consultation Slots Section */}
					<Box sx={{ ...sectionSx, mb: '2rem' }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
							<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.9rem' : '1rem' }}>
								Consultation Slots
							</Typography>
							<Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
								<FormControl size='small' sx={{ minWidth: 120 }}>
									<Select
										value={viewMode}
										onChange={(e: SelectChangeEvent) => setViewMode(e.target.value as 'list' | 'calendar')}
										sx={{
											backgroundColor: theme.bgColor?.common,
											fontSize: isMobileSize ? '0.75rem' : '0.85rem',
										}}>
										<MenuItem value='list' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
											List View
										</MenuItem>
										<MenuItem value='calendar' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
											Calendar View
										</MenuItem>
									</Select>
								</FormControl>
								{slots.length > 0 && (
									<CustomSubmitButton
										type='button'
										onClick={() => exportSlotsToCSV(slots, consultation?.title || 'Consultation')}
										sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', padding: '0 0.75rem' }}>
										{isMobileSize ? 'CSV' : 'Export CSV'}
									</CustomSubmitButton>
								)}
								<CustomSubmitButton
									type='button'
									onClick={() => {
										setEditingSlot(null);
										setIsCreateSlotDialogOpen(true);
									}}
									sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', padding: '0 0.75rem' }}>
									{isMobileSize ? 'New' : 'Create Slot'}
								</CustomSubmitButton>
								<CustomSubmitButton
									type='button'
									onClick={() => setIsBulkSlotDialogOpen(true)}
									sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', padding: '0 0.75rem' }}>
									{isMobileSize ? 'Bulk' : 'Bulk Create'}
								</CustomSubmitButton>
								<CustomDeleteButton
									type='button'
									onClick={() => setIsDeleteOptionsDialogOpen(true)}
									sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', padding: '0 0.75rem' }}>
									{isMobileSize ? 'Delete' : 'Delete'}
								</CustomDeleteButton>
							</Box>
						</Box>

						{isSlotsLoading ? (
							<Box sx={{ textAlign: 'center', py: '2rem' }}>
								<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									Loading slots...
								</Typography>
							</Box>
						) : slotsError ? (
							<Box sx={{ textAlign: 'center', py: '2rem' }}>
								<Alert severity='error' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{slotsError}
								</Alert>
							</Box>
						) : viewMode === 'calendar' ? (
							<ConsultationSlotsCalendar
								slots={slots}
								onSlotClick={(slot) => {
									setEditingSlot(slot);
									setIsEditSlotDialogOpen(true);
								}}
							/>
						) : (
							<ConsultationSlotsList
								slots={slots}
								onEdit={(slot) => {
									setEditingSlot(slot);
									setIsEditSlotDialogOpen(true);
								}}
								onDelete={(slotId) => {
									setSlotToDelete(slotId);
									setIsDeleteSlotDialogOpen(true);
								}}
								onViewAppointment={(slot) => {
									setSlotForBookingsView(slot);
									setIsSlotBookingsDialogOpen(true);
								}}
								consultationDuration={consultation?.duration ?? 60}
							/>
						)}
					</Box>
				</Box>

				{/* Create/Edit Slot Dialog */}
				<CreateConsultationSlotDialog
					isOpen={isCreateSlotDialogOpen || isEditSlotDialogOpen}
					onClose={() => {
						setIsCreateSlotDialogOpen(false);
						setIsEditSlotDialogOpen(false);
						setEditingSlot(null);
					}}
					onCreate={async (slotData) => {
						try {
							if (editingSlot && consultationId) {
								// Update existing slot
								const response = await axios.put(
									`${base_url}/consultations/${consultationId}/slots/${editingSlot._id}`,
									slotData
								);
								if (response.data.status === 200) {
									setSlots(slots.map((s) => (s._id === editingSlot._id ? response.data.data : s)));
									setIsEditSlotDialogOpen(false);
									setEditingSlot(null);
									if (consultationId) {
										await fetchSlots(consultationId);
									}
								}
							} else if (consultationId) {
								// Create new slot
								const response = await axios.post(`${base_url}/consultations/${consultationId}/slots`, slotData);
								if (response.data.status === 201) {
									setSlots([...slots, response.data.data]);
									setIsCreateSlotDialogOpen(false);
									if (consultationId) {
										await fetchSlots(consultationId);
									}
								}
							}
						} catch (error: any) {
							console.error('Error saving slot:', error);
							throw error;
						}
					}}
					onDelete={async (slotId) => {
						try {
							if (consultationId) {
								await axios.delete(`${base_url}/consultations/${consultationId}/slots/${slotId}`);
								setSlots(slots.filter((s) => s._id !== slotId));
								setIsEditSlotDialogOpen(false);
								setEditingSlot(null);
								if (consultationId) {
									await fetchSlots(consultationId);
								}
							}
						} catch (error: any) {
							console.error('Error deleting slot:', error);
							throw error;
						}
					}}
					consultation={consultation}
					existingSlot={editingSlot}
				/>

				{/* Slot bookings dialog (who booked which consultant) */}
				<SlotBookingsDialog
					slot={slotForBookingsView}
					open={isSlotBookingsDialogOpen}
					onClose={() => {
						setIsSlotBookingsDialogOpen(false);
						setSlotForBookingsView(null);
					}}
				/>

				{/* Bulk Slot Creation Dialog */}
				<BulkSlotCreationDialog
					isOpen={isBulkSlotDialogOpen}
					onClose={() => setIsBulkSlotDialogOpen(false)}
					onCreate={async (bulkData) => {
						if (!consultationId) return;
						const response = await axios.post(`${base_url}/consultations/${consultationId}/slots/bulk`, bulkData);
						if (response.data.status === 201) {
							await fetchSlots(consultationId);
							setIsBulkSlotDialogOpen(false);
							setBulkCreateSnackbarMessage(response.data.message || 'Bulk slot creation completed.');
							setIsBulkCreateSnackbarOpen(true);
						}
					}}
					consultation={consultation}
				/>

				{/* Delete unbooked slots options dialog */}
				<CustomDialog
					openModal={isDeleteOptionsDialogOpen}
					closeModal={() => {
						if (!isDeletingUnbooked) setIsDeleteOptionsDialogOpen(false);
					}}
					title='Delete Unbooked Slots'
					maxWidth='sm'>
					<DialogContent>
						<RadioGroup
							value={deleteUnbookedOption}
							onChange={(e) => setDeleteUnbookedOption(e.target.value as DeleteUnbookedOption)}
							sx={{ gap: '0.5rem' }}>
							<FormControlLabel
								value='my'
								control={<Radio size='small' />}
								label={
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										Delete all my unbooked slots
									</Typography>
								}
							/>
							{(isOwner || isSuperAdmin) && (
								<FormControlLabel
									value='all'
									control={<Radio size='small' />}
									label={
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											Delete all unbooked Slots
										</Typography>
									}
								/>
							)}
							<FormControlLabel
								value='my_days'
								control={<Radio size='small' />}
								label={
									<Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											Delete my unbooked slots within
										</Typography>
										<TextField
											type='number'
											size='small'
											value={deleteMyDays}
											onChange={(e) => {
												const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
												if (raw === '') {
													setDeleteMyDays('');
													return;
												}
												const n = parseInt(raw, 10);
												setDeleteMyDays(n >= 1 ? String(n) : deleteMyDays);
											}}
											onClick={(e) => e.stopPropagation()}
											inputProps={{ min: 1, max: 9999 }}
											sx={{ width: 72, '& .MuiInputBase-input': { fontSize: isMobileSize ? '0.75rem' : '0.85rem' } }}
										/>
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											days
										</Typography>
									</Box>
								}
							/>
							{(isOwner || isSuperAdmin) && (
								<FormControlLabel
									value='all_days'
									control={<Radio size='small' />}
									label={
										<Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												Delete all unbooked slots within
											</Typography>
											<TextField
												type='number'
												size='small'
												value={deleteAllDays}
												onChange={(e) => {
													const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
													if (raw === '') {
														setDeleteAllDays('');
														return;
													}
													const n = parseInt(raw, 10);
													setDeleteAllDays(n >= 1 ? String(n) : deleteAllDays);
												}}
												onClick={(e) => e.stopPropagation()}
												inputProps={{ min: 1, max: 9999 }}
												sx={{ width: 72, '& .MuiInputBase-input': { fontSize: isMobileSize ? '0.75rem' : '0.85rem' } }}
											/>
											<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
												days
											</Typography>
										</Box>
									}
								/>
							)}
						</RadioGroup>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem', lineHeight: '1.8', mt: '1rem' }}>
							* Past unbooked slots will be deleted by system automatically every day. You can delete them manually here.
						</Typography>
					</DialogContent>
					<CustomDialogActions
						onCancel={() => {
							if (!isDeletingUnbooked) setIsDeleteOptionsDialogOpen(false);
						}}
						showCancelBtn={true}
						cancelBtnText='Cancel'
						deleteBtn={true}
						deleteBtnText='Delete'
						onDelete={async () => {
							if (!consultationId) return;
							if (deleteUnbookedOption === 'my_days') {
								const n = parseInt(deleteMyDays, 10);
								if (Number.isNaN(n) || n < 1) {
									setUrlErrorMessage('Enter a positive number of days (at least 1)');
									setIsUrlErrorOpen(true);
									return;
								}
							}
							if (deleteUnbookedOption === 'all_days') {
								const n = parseInt(deleteAllDays, 10);
								if (Number.isNaN(n) || n < 1) {
									setUrlErrorMessage('Enter a positive number of days (at least 1)');
									setIsUrlErrorOpen(true);
									return;
								}
							}
							setIsDeletingUnbooked(true);
							try {
								let url = `${base_url}/consultations/${consultationId}/slots/unbooked?`;
								if (deleteUnbookedOption === 'my') url += 'scope=my';
								else if (deleteUnbookedOption === 'all') url += 'scope=all';
								else if (deleteUnbookedOption === 'my_days') url += `scope=my&days=${parseInt(deleteMyDays, 10)}`;
								else url += `scope=all&days=${parseInt(deleteAllDays, 10)}`;
								const res = await axios.delete(url);
								if (consultationId) await fetchSlots(consultationId);
								setBulkCreateSnackbarMessage(res.data?.message || 'Done');
								setIsBulkCreateSnackbarOpen(true);
								setIsDeleteOptionsDialogOpen(false);
							} catch (e: any) {
								setUrlErrorMessage(e.response?.data?.message || 'Failed to delete');
								setIsUrlErrorOpen(true);
							} finally {
								setIsDeletingUnbooked(false);
							}
						}}
						disableBtn={false}
						disableCancelBtn={isDeletingUnbooked}
						isDeleting={isDeletingUnbooked}
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>

				{/* Delete Slot Confirmation Dialog */}
				<CustomDialog
					openModal={isDeleteSlotDialogOpen}
					closeModal={() => {
						if (!isDeletingSlot) {
							setIsDeleteSlotDialogOpen(false);
							setSlotToDelete(null);
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
							if (!isDeletingSlot) {
								setIsDeleteSlotDialogOpen(false);
								setSlotToDelete(null);
							}
						}}
						deleteBtn={true}
						onDelete={async () => {
							if (slotToDelete && consultationId && !isDeletingSlot) {
								setIsDeletingSlot(true);
								try {
									await axios.delete(`${base_url}/consultations/${consultationId}/slots/${slotToDelete}`);
									setSlots(slots.filter((s) => s._id !== slotToDelete));
									setIsDeleteSlotDialogOpen(false);
									setSlotToDelete(null);
								} catch (error: any) {
									console.error('Error deleting slot:', error);
									setUrlErrorMessage(error.response?.data?.message || 'Failed to delete slot');
									setIsUrlErrorOpen(true);
									setIsDeleteSlotDialogOpen(false);
									setSlotToDelete(null);
								} finally {
									setIsDeletingSlot(false);
								}
							}
						}}
						disableBtn={isDeletingSlot}
						disableCancelBtn={isDeletingSlot}
						isDeleting={isDeletingSlot}
						actionSx={{ marginBottom: '0.5rem' }}
					/>
				</CustomDialog>

				{/* Error Snackbar */}
				<Snackbar
					open={isUrlErrorOpen}
					autoHideDuration={4000}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					onClose={() => setIsUrlErrorOpen(false)}>
					<Alert severity='error' variant='filled' sx={{ width: '100%' }}>
						{urlErrorMessage}
					</Alert>
				</Snackbar>

				{/* Bulk create result Snackbar */}
				<Snackbar
					open={isBulkCreateSnackbarOpen}
					autoHideDuration={5000}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					onClose={() => {
						setIsBulkCreateSnackbarOpen(false);
						setBulkCreateSnackbarMessage('');
					}}>
					<Alert severity='info' variant='filled' sx={{ width: '100%' }} onClose={() => setIsBulkCreateSnackbarOpen(false)}>
						{bulkCreateSnackbarMessage}
					</Alert>
				</Snackbar>
			</DashboardPagesLayout>
		</AdminPageErrorBoundary>
	);
};

export default AdminConsultationSlots;
