import { Box, Typography, Grid, FormControlLabel, Checkbox, Tooltip } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import { Consultation, ConsultationPrice } from '../../interfaces/consultation';
import { useContext, useState, useEffect } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface CreateConsultationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	singleConsultation: Partial<Consultation> | null;
	setSingleConsultation: (consultation: Partial<Consultation> | null) => void;
	GBP: ConsultationPrice;
	setGBP: (price: ConsultationPrice) => void;
	USD: ConsultationPrice;
	setUSD: (price: ConsultationPrice) => void;
	EUR: ConsultationPrice;
	setEUR: (price: ConsultationPrice) => void;
	TRY: ConsultationPrice;
	setTRY: (price: ConsultationPrice) => void;
	isCreating?: boolean;
}

const CreateConsultationDialog = ({
	isOpen,
	onClose,
	onSubmit,
	singleConsultation,
	setSingleConsultation,
	GBP,
	setGBP,
	USD,
	setUSD,
	EUR,
	setEUR,
	TRY,
	setTRY,
	isCreating = false,
}: CreateConsultationDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const [isFree, setIsFree] = useState<boolean>(false);

	// Reset isFree when dialog closes
	useEffect(() => {
		if (!isOpen) {
			setIsFree(false);
		}
	}, [isOpen]);

	return (
		<CustomDialog title='Create New Consultation' openModal={isOpen} closeModal={onClose} maxWidth='sm'>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<CustomTextField
						fullWidth
						label='Title'
						value={singleConsultation?.title || ''}
						onChange={(e) => {
							if (singleConsultation) {
								setSingleConsultation({ ...singleConsultation, title: e.target.value });
							}
						}}
						required
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{
							sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' },
						}}
						InputProps={{
							inputProps: {
								maxLength: 100,
							},
						}}
					/>
					<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 0 0.5rem 0rem', textAlign: 'right' }}>
						{(singleConsultation?.title || '').length}/100 Characters
					</Typography>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<CustomTextField
						fullWidth
						label='Description'
						value={singleConsultation?.description || ''}
						onChange={(e) => {
							if (singleConsultation) {
								setSingleConsultation({ ...singleConsultation, description: e.target.value });
							}
						}}
						multiline
						rows={5}
						required
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{
							sx: { fontSize: isMobileSize ? '0.7rem' : '0.8rem' },
						}}
						InputProps={{
							inputProps: {
								maxLength: 1000,
							},
						}}
					/>
					<Typography sx={{ fontSize: isMobileSize ? '0.65rem' : '0.7rem', margin: '-0.25rem 0 0.5rem 0rem', textAlign: 'right' }}>
						{(singleConsultation?.description || '').length}/1000 Characters
					</Typography>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.8rem' : '1rem' }}>
							Prices
						</Typography>
						<Tooltip title='Check to make this consultation free in all currencies.' placement='top' arrow>
							<FormControlLabel
								control={
									<Checkbox
										checked={isFree}
										onChange={(e) => {
											setIsFree(e.target.checked);
											if (e.target.checked) {
												setGBP({ currency: 'gbp', amount: '' });
												setUSD({ currency: 'usd', amount: '' });
												setEUR({ currency: 'eur', amount: '' });
												setTRY({ currency: 'try', amount: '' });
											}
										}}
										sx={{
											'& .MuiSvgIcon-root': {
												fontSize: isMobileSize ? '0.9rem' : '1rem',
											},
										}}
									/>
								}
								label='Free Consultation'
								sx={{
									'mr': '0rem',
									'& .MuiFormControlLabel-label': {
										fontSize: isMobileSize ? '0.65rem' : '0.75rem',
									},
								}}
							/>
						</Tooltip>
					</Box>
					<Grid container spacing={2}>
						<Grid item xs={6}>
							<CustomTextField
								label='GBP'
								value={isFree ? '' : GBP.amount}
								onChange={(e) => {
									const value = e.target.value;
									if (value === '' || parseFloat(value) >= 0) {
										setGBP({ currency: 'gbp', amount: String(value) });
									}
								}}
								type='number'
								required={!isFree}
								disabled={isFree}
								sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
								InputProps={{
									inputProps: { min: 0 },
								}}
							/>
						</Grid>
						<Grid item xs={6}>
							<CustomTextField
								label='USD'
								value={isFree ? '' : USD.amount}
								onChange={(e) => {
									const value = e.target.value;
									if (value === '' || parseFloat(value) >= 0) {
										setUSD({ currency: 'usd', amount: String(value) });
									}
								}}
								type='number'
								required={!isFree}
								disabled={isFree}
								sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
								InputProps={{
									inputProps: { min: 0 },
								}}
							/>
						</Grid>
						<Grid item xs={6}>
							<CustomTextField
								label='EUR'
								value={isFree ? '' : EUR.amount}
								onChange={(e) => {
									const value = e.target.value;
									if (value === '' || parseFloat(value) >= 0) {
										setEUR({ currency: 'eur', amount: String(value) });
									}
								}}
								type='number'
								required={!isFree}
								disabled={isFree}
								sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
								InputProps={{
									inputProps: { min: 0 },
								}}
							/>
						</Grid>
						<Grid item xs={6}>
							<CustomTextField
								label='TRY'
								value={isFree ? '' : TRY.amount}
								onChange={(e) => {
									const value = e.target.value;
									if (value === '' || parseFloat(value) >= 0) {
										setTRY({ currency: 'try', amount: String(value) });
									}
								}}
								type='number'
								required={!isFree}
								disabled={isFree}
								sx={{ backgroundColor: isFree ? 'transparent' : '#fff' }}
								InputLabelProps={{
									sx: { fontSize: '0.8rem' },
								}}
								InputProps={{
									inputProps: { min: 0 },
								}}
							/>
						</Grid>
					</Grid>
				</Box>


				<CustomDialogActions
					onCancel={onClose}
					submitBtnType='submit'
					disableCancelBtn={isCreating}
					disableBtn={
						!singleConsultation?.title ||
						!singleConsultation?.description ||
						(!isFree && (!GBP.amount || !USD.amount || !EUR.amount || !TRY.amount)) ||
						isCreating
					}
					actionSx={{ margin: '0 0 0.5rem 0' }}
					submitBtnText={isCreating ? 'Creating...' : 'Create'}
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateConsultationDialog;
