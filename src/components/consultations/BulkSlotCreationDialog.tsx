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
	Grid,
} from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-gb';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { SearchUser } from '../../interfaces/search';
import ConsultantSearchSelect from '../ConsultantSearchSelect';
import theme from '../../themes';
import { Consultation } from '../../interfaces/consultation';

interface BulkSlotCreationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (slotsData: {
		startDate: string;
		endDate: string;
		startTime: string;
		endTime: string;
		timeZoneOffsetMinutes: number;
		duration: number;
		intervalMinutes: number;
		recurring: boolean;
		recurringDays: number[];
		recurringWeeks: number;
		availableConsultantIds: string[];
		addCreatorAsConsultant: boolean;
	}) => Promise<void>;
	consultation: Consultation | undefined;
}

const BulkSlotCreationDialog = ({ isOpen, onClose, onCreate, consultation }: BulkSlotCreationDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().add(1, 'day'));
	const [endDate, setEndDate] = useState<Dayjs | null>(dayjs().add(7, 'days'));
	const [startTime, setStartTime] = useState<Dayjs | null>(dayjs().hour(9).minute(0));
	const [endTime, setEndTime] = useState<Dayjs | null>(dayjs().hour(17).minute(0));
	const [duration, setDuration] = useState<number>(consultation?.duration ?? 60);
	const [intervalMinutes, setIntervalMinutes] = useState<number>(30);
	const [recurring, setRecurring] = useState<boolean>(false);
	const [recurringDays, setRecurringDays] = useState<number[]>([]);
	const [recurringWeeks, setRecurringWeeks] = useState<number>(1);
	const [addMyselfAsConsultant, setAddMyselfAsConsultant] = useState<boolean>(true);
	const [selectedConsultants, setSelectedConsultants] = useState<SearchUser[]>([]);
	const [consultantSearchValue, setConsultantSearchValue] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [error, setError] = useState<string>('');

	const daysOfWeek = [
		{ value: 0, label: 'Sunday' },
		{ value: 1, label: 'Monday' },
		{ value: 2, label: 'Tuesday' },
		{ value: 3, label: 'Wednesday' },
		{ value: 4, label: 'Thursday' },
		{ value: 5, label: 'Friday' },
		{ value: 6, label: 'Saturday' },
	];

	const handleDayToggle = (day: number) => {
		setRecurringDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
	};

	const handleConsultantSelect = (selectedUser: SearchUser) => {
		if (!selectedConsultants.find((c) => c._id === selectedUser._id)) {
			setSelectedConsultants([...selectedConsultants, selectedUser]);
			setConsultantSearchValue('');
		}
	};

	const removeConsultant = (userId: string) => {
		setSelectedConsultants(selectedConsultants.filter((c) => c._id !== userId));
	};

	const calculateSlotCount = (): number => {
		if (!startDate || !endDate || !startTime || !endTime) return 0;

		if (recurring) {
			if (recurringDays.length === 0) return 0;
			const daysDiff = endDate.diff(startDate, 'day') + 1;
			const weeks = Math.ceil(daysDiff / 7) * recurringWeeks;
			const slotsPerDay = Math.floor(endTime.diff(startTime, 'minute') / (duration + intervalMinutes));
			return weeks * recurringDays.length * slotsPerDay;
		} else {
			const daysDiff = endDate.diff(startDate, 'day') + 1;
			const slotsPerDay = Math.floor(endTime.diff(startTime, 'minute') / (duration + intervalMinutes));
			return daysDiff * slotsPerDay;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!startDate || !endDate || !startTime || !endTime) {
			setError('Please fill in all date and time fields');
			return;
		}

		if (startDate.isAfter(endDate)) {
			setError('Start date must be before end date');
			return;
		}

		if (startTime.isAfter(endTime)) {
			setError('Start time must be before end time');
			return;
		}

		if (recurring && recurringDays.length === 0) {
			setError('Please select at least one day for recurring slots');
			return;
		}

		if (duration <= 0 || intervalMinutes < 0) {
			setError('Duration and interval must be positive numbers');
			return;
		}

		const slotCount = calculateSlotCount();
		if (slotCount === 0) {
			setError('No slots can be created with the current settings');
			return;
		}

		if (slotCount > 100) {
			setError(`Too many slots (${slotCount}). Maximum 100 slots allowed per bulk creation.`);
			return;
		}

		if (!addMyselfAsConsultant && selectedConsultants.length === 0) {
			setError('Select at least one consultant');
			return;
		}

		setIsSubmitting(true);
		try {
			// Send date (YYYY-MM-DD) and time (HH:mm) in admin's local; offset lets server build correct UTC (no server-TZ bugs)
			await onCreate({
				startDate: startDate.format('YYYY-MM-DD'),
				endDate: endDate.format('YYYY-MM-DD'),
				startTime: startTime.format('HH:mm'),
				endTime: endTime.format('HH:mm'),
				timeZoneOffsetMinutes: -new Date().getTimezoneOffset(),
				duration,
				intervalMinutes,
				recurring,
				recurringDays,
				recurringWeeks,
				availableConsultantIds: selectedConsultants.map((c) => c._id),
				addCreatorAsConsultant: addMyselfAsConsultant,
			});
			// Reset form
			setStartDate(dayjs().add(1, 'day'));
			setEndDate(dayjs().add(7, 'days'));
			setStartTime(dayjs().hour(9).minute(0));
			setEndTime(dayjs().hour(17).minute(0));
			setDuration(consultation?.duration ?? 60);
			setIntervalMinutes(30);
			setRecurring(false);
			setRecurringDays([]);
			setRecurringWeeks(1);
			setAddMyselfAsConsultant(true);
			setSelectedConsultants([]);
			setConsultantSearchValue('');
			setError('');
			onClose();
		} catch (err: any) {
			setError(err.response?.data?.message || 'Failed to create slots');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		if (!isSubmitting) {
			setError('');
			onClose();
		}
	};

	const slotCount = calculateSlotCount();

	return (
		<CustomDialog openModal={isOpen} closeModal={handleClose} title='Bulk Create Slots' maxWidth='sm'>
			<form onSubmit={handleSubmit}>
				<DialogContent>
					<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='en-gb'>
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', mt: '0.5rem' }}>
							{/* Date Range */}
							<Box>
								<Grid container spacing={2}>
									<Grid item xs={12} sm={6}>
										<DatePicker
											label='Start Date'
											value={startDate}
											onChange={(newValue) => setStartDate(newValue)}
											minDate={dayjs()}
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
									</Grid>
									<Grid item xs={12} sm={6}>
										<DatePicker
											label='End Date'
											value={endDate}
											onChange={(newValue) => setEndDate(newValue)}
											minDate={startDate || dayjs()}
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
									</Grid>
								</Grid>
							</Box>

							{/* Time Range */}
							<Box>
								<Grid container spacing={2}>
									<Grid item xs={12} sm={6}>
										<TimePicker
											label='Start Time'
											value={startTime}
											onChange={(newValue) => setStartTime(newValue)}
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
									</Grid>
									<Grid item xs={12} sm={6}>
										<TimePicker
											label='End Time'
											value={endTime}
											onChange={(newValue) => setEndTime(newValue)}
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
									</Grid>
								</Grid>
							</Box>

							{/* Duration and Interval */}
							<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
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
								</Grid>
								<Grid item xs={12} sm={6}>
									<FormControl fullWidth>
										<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem', mb: '0.5rem' }}>
											Interval Between Slots (minutes)*
										</Typography>
										<Select
											value={intervalMinutes.toString()}
											onChange={(e: SelectChangeEvent) => setIntervalMinutes(parseInt(e.target.value, 10))}
											size='small'
											required
											sx={{
												backgroundColor: theme.bgColor?.common,
												fontSize: isMobileSize ? '0.75rem' : '0.85rem',
											}}>
											<MenuItem value='0' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												0 (back-to-back)
											</MenuItem>
											<MenuItem value='15' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												15
											</MenuItem>
											<MenuItem value='30' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												30
											</MenuItem>
											<MenuItem value='60' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												60
											</MenuItem>
											<MenuItem value='90' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												90
											</MenuItem>
											<MenuItem value='120' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
												120
											</MenuItem>
										</Select>
									</FormControl>
								</Grid>
							</Grid>

							{/* Recurring Options */}
							<Box>
								<FormControlLabel
									control={
										<Checkbox
											checked={recurring}
											onChange={(e) => setRecurring(e.target.checked)}
											sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}
										/>
									}
									label={
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
											Recurring Weekly Pattern
										</Typography>
									}
								/>

								{recurring && (
									<Box sx={{ mt: '1rem', ml: '1.5rem' }}>
										<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem', mb: '0.5rem' }}>
											Days of Week*
										</Typography>
										<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', mb: '1rem' }}>
											{daysOfWeek.map((day) => (
												<FormControlLabel
													key={day.value}
													control={
														<Checkbox
															checked={recurringDays.includes(day.value)}
															onChange={() => handleDayToggle(day.value)}
															size='small'
														/>
													}
													label={
														<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.75rem' }}>
															{day.label}
														</Typography>
													}
												/>
											))}
										</Box>

										<FormControl fullWidth>
											<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '0.9rem', mb: '0.5rem' }}>
												Repeat for (weeks)*
											</Typography>
											<Select
												value={recurringWeeks.toString()}
												onChange={(e: SelectChangeEvent) => setRecurringWeeks(parseInt(e.target.value, 10))}
												size='small'
												required
												sx={{
													backgroundColor: theme.bgColor?.common,
													fontSize: isMobileSize ? '0.75rem' : '0.85rem',
												}}>
												{[1, 2, 3, 4, 5, 6, 7, 8].map((week) => (
													<MenuItem key={week} value={week.toString()} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.8rem' }}>
														{week} {week === 1 ? 'week' : 'weeks'}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</Box>
								)}
							</Box>

							{/* Consultants */}
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
										{selectedConsultants.map((consultant) => (
											<Box
												key={consultant._id}
												sx={{
													display: 'inline-flex',
													alignItems: 'center',
													padding: '0.25rem 0.75rem',
													backgroundColor: theme.palette.primary.main,
													color: 'white',
													borderRadius: '1rem',
													fontSize: isMobileSize ? '0.7rem' : '0.8rem',
												}}>
												{consultant.firstName} {consultant.lastName}
												<Box
													component='span'
													onClick={() => removeConsultant(consultant._id)}
													sx={{
														marginLeft: '0.5rem',
														cursor: 'pointer',
														'&:hover': { opacity: 0.7 },
													}}>
													×
												</Box>
											</Box>
										))}
									</Box>
								)}
							</Box>

							{/* Slot Count Preview */}
							{slotCount > 0 && (
								<Box
									sx={{
										padding: '1rem',
										backgroundColor: theme.palette.info.light + '20',
										borderRadius: '0.5rem',
										border: `1px solid ${theme.palette.info.main}`,
									}}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontWeight: 'bold' }}>
										Estimated Slots to Create: {slotCount}
									</Typography>
								</Box>
							)}

							{error && (
								<Typography variant='body2' sx={{ color: 'error.main', fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{error}
								</Typography>
							)}
						</Box>
					</LocalizationProvider>
				</DialogContent>
				<CustomDialogActions
					onCancel={handleClose}
					onSubmit={() => {
						handleSubmit({} as React.FormEvent);
					}}
					submitBtnText='Create Slots'
					disableBtn={
						isSubmitting ||
						!startDate ||
						!endDate ||
						!startTime ||
						!endTime ||
						slotCount === 0 ||
						(!addMyselfAsConsultant && selectedConsultants.length === 0)
					}
					isSubmitting={isSubmitting}
					actionSx={{ margin: '0 0.5rem 0.5rem 0' }}
				/>
			</form>
		</CustomDialog>
	);
};

export default BulkSlotCreationDialog;
