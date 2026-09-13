import { Box, Typography, FormControlLabel, Checkbox, FormGroup } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

const DAY_LABELS = [
	{ v: 0, l: 'Sun' },
	{ v: 1, l: 'Mon' },
	{ v: 2, l: 'Tue' },
	{ v: 3, l: 'Wed' },
	{ v: 4, l: 'Thu' },
	{ v: 5, l: 'Fri' },
	{ v: 6, l: 'Sat' },
];

export interface CreateClubFormState {
	title: string;
	description: string;
	daysOfWeek: number[];
	startTime: string;
	durationMinutes: number;
	defaultCapacity: number;
	timezone: string;
}

interface CreateClubDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	form: CreateClubFormState;
	setForm: (form: CreateClubFormState) => void;
	isCreating?: boolean;
}

const CreateClubDialog = ({ isOpen, onClose, onSubmit, form, setForm, isCreating = false }: CreateClubDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const toggleDay = (day: number) => {
		const days = form.daysOfWeek.includes(day)
			? form.daysOfWeek.filter((d) => d !== day)
			: [...form.daysOfWeek, day].sort();
		setForm({ ...form, daysOfWeek: days });
	};

	return (
		<CustomDialog title='Create New Club' openModal={isOpen} closeModal={onClose} maxWidth='sm'>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<CustomTextField
						fullWidth
						label='Title'
						value={form.title}
						onChange={(e) => setForm({ ...form, title: e.target.value })}
						required
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{ sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' } }}
						InputProps={{ inputProps: { maxLength: 120 } }}
					/>
					<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 0 0.5rem 0rem', textAlign: 'right' }}>
						{form.title.length}/120 Characters
					</Typography>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<CustomTextField
						fullWidth
						label='Description'
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
						multiline
						rows={4}
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{ sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' } }}
						InputProps={{ inputProps: { maxLength: 2000 } }}
					/>
					<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 0 0.5rem 0rem', textAlign: 'right' }}>
						{form.description.length}/2000 Characters
					</Typography>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.8rem' : '1rem', mb: 1 }}>
						Weekly Days
					</Typography>
					<FormGroup row>
						{DAY_LABELS.map((d) => (
							<FormControlLabel
								key={d.v}
								control={
									<Checkbox
										checked={form.daysOfWeek.includes(d.v)}
										onChange={() => toggleDay(d.v)}
										sx={{ '& .MuiSvgIcon-root': { fontSize: isMobileSize ? '0.9rem' : '1rem' } }}
									/>
								}
								label={d.l}
								sx={{
									'& .MuiFormControlLabel-label': {
										fontSize: isMobileSize ? '0.65rem' : '0.75rem',
									},
								}}
							/>
						))}
					</FormGroup>
				</Box>

				<Box
					sx={{
						margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem',
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: 2,
					}}>
					<CustomTextField
						label='Start Time (HH:mm)'
						value={form.startTime}
						onChange={(e) => setForm({ ...form, startTime: e.target.value })}
						required
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
					/>
					<CustomTextField
						label='Duration (minutes)'
						type='number'
						value={form.durationMinutes}
						onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) || 60 })}
						required
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
						InputProps={{ inputProps: { min: 15, max: 240 } }}
					/>
					<CustomTextField
						label='Default Capacity'
						type='number'
						value={form.defaultCapacity}
						onChange={(e) => setForm({ ...form, defaultCapacity: Number(e.target.value) || 12 })}
						required
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
						InputProps={{ inputProps: { min: 1, max: 500 } }}
					/>
					<CustomTextField
						label='Timezone'
						value={form.timezone}
						onChange={(e) => setForm({ ...form, timezone: e.target.value })}
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
					/>
				</Box>

				<Typography
					sx={{
						fontSize: isMobileSize ? '0.65rem' : '0.75rem',
						color: 'text.secondary',
						mx: isMobileSize ? 0 : '1rem',
						mb: 1,
					}}>
					Session packs (GBP / USD / EUR / TRY) can be added after creating the club.
				</Typography>

				<CustomDialogActions
					onCancel={onClose}
					submitBtnType='submit'
					submitBtnText='Create'
					isSubmitting={isCreating}
					disableBtn={
						isCreating ||
						!form.title.trim() ||
						form.daysOfWeek.length === 0 ||
						!form.startTime.trim()
					}
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateClubDialog;
