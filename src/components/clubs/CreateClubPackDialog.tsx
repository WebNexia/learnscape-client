import { Box, Typography, Grid } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import CustomTextField from '../forms/customFields/CustomTextField';
import { ClubPrice } from '../../interfaces/club';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface CreateClubPackDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	sessionCount: number;
	setSessionCount: (n: number) => void;
	label: string;
	setLabel: (s: string) => void;
	GBP: ClubPrice;
	setGBP: (p: ClubPrice) => void;
	USD: ClubPrice;
	setUSD: (p: ClubPrice) => void;
	EUR: ClubPrice;
	setEUR: (p: ClubPrice) => void;
	TRY: ClubPrice;
	setTRY: (p: ClubPrice) => void;
	isCreating?: boolean;
}

const CreateClubPackDialog = ({
	isOpen,
	onClose,
	onSubmit,
	sessionCount,
	setSessionCount,
	label,
	setLabel,
	GBP,
	setGBP,
	USD,
	setUSD,
	EUR,
	setEUR,
	TRY,
	setTRY,
	isCreating = false,
}: CreateClubPackDialogProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const hasAnyPrice = !!(GBP.amount || USD.amount || EUR.amount || TRY.amount);
	const allPricesFilled = !!(GBP.amount && USD.amount && EUR.amount && TRY.amount);

	return (
		<CustomDialog title='Create Session Pack' openModal={isOpen} closeModal={onClose} maxWidth='sm'>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
					<CustomTextField
						label='Session Count'
						type='number'
						value={sessionCount}
						onChange={(e) => setSessionCount(Math.max(1, Number(e.target.value) || 1))}
						required
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
						InputProps={{ inputProps: { min: 1, max: 100 } }}
					/>
					<CustomTextField
						label='Label (optional)'
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						sx={{ backgroundColor: '#fff' }}
						InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
						InputProps={{ inputProps: { maxLength: 80 } }}
					/>
				</Box>

				<Box sx={{ margin: isMobileSize ? '0.75rem 0' : '0.75rem 1rem' }}>
					<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.8rem' : '1rem', mb: 1 }}>
						Prices
					</Typography>
					<Grid container spacing={2}>
						{(
							[
								{ label: 'GBP', price: GBP, set: setGBP, currency: 'gbp' },
								{ label: 'USD', price: USD, set: setUSD, currency: 'usd' },
								{ label: 'EUR', price: EUR, set: setEUR, currency: 'eur' },
								{ label: 'TRY', price: TRY, set: setTRY, currency: 'try' },
							] as const
						).map((row) => (
							<Grid item xs={6} key={row.currency}>
								<CustomTextField
									label={row.label}
									value={row.price.amount}
									onChange={(e) => {
										const value = e.target.value;
										if (value === '' || parseFloat(value) >= 0) {
											row.set({ currency: row.currency, amount: String(value) });
										}
									}}
									type='number'
									required
									sx={{ backgroundColor: '#fff' }}
									InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
									InputProps={{ inputProps: { min: 0 } }}
								/>
							</Grid>
						))}
					</Grid>
					{hasAnyPrice && !allPricesFilled && (
						<Typography sx={{ fontSize: '0.7rem', color: 'error.main', mt: 1 }}>
							All currencies (GBP, USD, EUR, TRY) are required.
						</Typography>
					)}
				</Box>

				<CustomDialogActions
					onCancel={onClose}
					submitBtnType='submit'
					submitBtnText='Create'
					isSubmitting={isCreating}
					disableBtn={isCreating || sessionCount < 1 || !allPricesFilled}
					actionSx={{ marginBottom: '0.5rem' }}
				/>
			</form>
		</CustomDialog>
	);
};

export default CreateClubPackDialog;
