import { Box, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';
import { useContext } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';

export interface GenerateClubTicketFormState {
	clubId: string;
	guestName: string;
	guestEmail: string;
	guestPhone: string;
	sessionsTotal: number;
	sendEmail: boolean;
}

export type ClubOption = { _id: string; title: string };

interface GenerateClubTicketDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	form: GenerateClubTicketFormState;
	setForm: (form: GenerateClubTicketFormState) => void;
	clubs: ClubOption[];
	isCreating?: boolean;
}

const GenerateClubTicketDialog = ({
	isOpen,
	onClose,
	onSubmit,
	form,
	setForm,
	clubs,
	isCreating = false,
}: GenerateClubTicketDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<CustomDialog title='Generate Ticket' openModal={isOpen} closeModal={onClose} maxWidth='sm'>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<FormControl fullWidth size='small' sx={{ backgroundColor: '#fff' }} required>
						<InputLabel sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>Club</InputLabel>
						<Select
							label='Club'
							value={form.clubId}
							onChange={(e: SelectChangeEvent) => setForm({ ...form, clubId: e.target.value })}
							sx={{
								fontSize: isMobileSize ? '0.75rem' : '0.85rem',
								fontFamily: theme.fontFamily?.main,
							}}>
							{clubs.map((c) => (
								<MenuItem key={c._id} value={c._id} sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
									{c.title}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<CustomTextField
						fullWidth
						label='Guest Name'
						value={form.guestName}
						onChange={(e) => setForm({ ...form, guestName: e.target.value })}
						required
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{ sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' } }}
						InputProps={{ inputProps: { maxLength: 120 } }}
					/>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<CustomTextField
						fullWidth
						label='Guest Email'
						type='email'
						value={form.guestEmail}
						onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
						required
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{ sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' } }}
						InputProps={{ inputProps: { maxLength: 254 } }}
					/>
				</Box>

				<Box
					sx={{
						margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem',
						display: 'grid',
						gridTemplateColumns: isMobileSize ? '1fr' : '1fr 1fr',
						gap: 2,
					}}>
					<CustomTextField
						label='Phone (optional)'
						value={form.guestPhone}
						onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
						sx={{ backgroundColor: '#fff', mb: 0 }}
						InputLabelProps={{ sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' } }}
						InputProps={{ inputProps: { maxLength: 40 } }}
					/>
					<CustomTextField
						label='Sessions'
						type='number'
						value={form.sessionsTotal}
						onChange={(e) => setForm({ ...form, sessionsTotal: Number(e.target.value) || 1 })}
						required
						sx={{ backgroundColor: '#fff', mb: 0 }}
						InputLabelProps={{ sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' } }}
						InputProps={{ inputProps: { min: 1, max: 100 } }}
					/>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.5rem 0 0.75rem' : '0.5rem 1rem 0.75rem' }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={form.sendEmail}
								onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })}
								sx={{ '& .MuiSvgIcon-root': { fontSize: isMobileSize ? '0.9rem' : '1rem' } }}
							/>
						}
						label='Send ticket email to guest'
						sx={{
							'& .MuiFormControlLabel-label': {
								fontSize: isMobileSize ? '0.7rem' : '0.8rem',
							},
						}}
					/>
					<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', color: 'text.secondary', mt: 0.5 }}>
						Creates an active ticket for the selected club without payment.
					</Typography>
				</Box>

				<CustomDialogActions
					onCancel={onClose}
					submitBtnType='submit'
					submitBtnText='Generate'
					isSubmitting={isCreating}
					disableBtn={
						isCreating ||
						!form.clubId ||
						!form.guestName.trim() ||
						!form.guestEmail.trim() ||
						form.sessionsTotal < 1
					}
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</form>
		</CustomDialog>
	);
};

export default GenerateClubTicketDialog;
