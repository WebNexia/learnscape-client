import { Box, Typography, Chip } from '@mui/material';
import theme from '../../themes';
import { Consultation } from '../../interfaces/consultation';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { setCurrencySymbol } from '../../utils/setCurrencySymbol';
import UKFlag from '../../assets/uk_flag_icon_round.svg.png';
import USFlag from '../../assets/usa_flag_united_states_america_icon_228698.png';
import EUFlag from '../../assets/european_flag_icon_228671.png';
import TRFlag from '../../assets/tr-flag-round-500.png';

interface ConsultationDetailsNonEditBoxProps {
	singleConsultation?: Consultation;
}

const ConsultationDetailsNonEditBox = ({ singleConsultation }: ConsultationDetailsNonEditBoxProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const cardShadow = '0 10px 30px rgba(15, 23, 42, 0.08)';
	const cardSx = {
		backgroundColor: theme.bgColor?.common,
		borderRadius: '0.75rem',
		border: `1px solid ${theme.palette.divider}`,
		boxShadow: cardShadow,
	};

	// Check if all prices are free
	const isFree = singleConsultation?.prices?.every((price) => !price.amount || price.amount === '' || price.amount === '0') || false;

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				width: isMobileSize ? '95%' : '90%',
			}}>

			{/* Cover Image, Title, Description, Duration Section */}
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					width: '100%',
					gap: isMobileSize ? '1rem' : '2rem',
					mb: '2rem',
				}}>
				<Box sx={{ display: 'flex', flexDirection: isMobileSize ? 'column' : 'row', gap: 2, width: '100%', flex: 1 }}>
					{/* Title and Description */}
					<Box
						sx={{
							mt: '1rem',
							padding: isMobileSize ? '0.75rem' : '1rem',
							...cardSx,
							flex: 2,
						}}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem', mb: '0.5rem' }}>
							Title
						</Typography>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
							{singleConsultation?.title || 'No title'}
						</Typography>


					</Box>
					<Box sx={{
						mt: '1rem',
						padding: isMobileSize ? '0.75rem' : '1rem',
						...cardSx,
						flex: 2,
					}}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem', mb: '0.5rem' }}>
							Description
						</Typography>
						<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', }}>
							{singleConsultation?.description || 'No description'}
						</Typography>


					</Box>

				</Box>


			</Box>


			<Box sx={{ display: 'flex', width: '100%', gap: '2rem', mb: '2rem', alignItems: 'stretch' }}>
				{/* Prices Section */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						padding: isMobileSize ? '1rem' : '2rem',
						...cardSx,
						flex: 2,
						height: '100%',
						minHeight: '200px',
					}}>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
						<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.75rem' : '1rem', mb: '1rem' }}>
							Prices
						</Typography>

						{isFree ? (
							<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: theme.palette.success.main }}>
								Free Consultation
							</Typography>
						) : (
							<Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isMobileSize ? '1rem' : '2rem' }}>
								{singleConsultation?.prices
									?.filter((price) => price.amount && price.amount.trim() !== '')
									.map((price) => {
										return (
											<Box
												sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
												key={price.currency}>
												<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.85rem' }}>
													{setCurrencySymbol(price.currency)}
													{price.amount}
												</Typography>
												<img
													src={
														price.currency === 'gbp'
															? UKFlag
															: price.currency === 'usd'
																? USFlag
																: price.currency === 'eur'
																	? EUFlag
																	: price.currency === 'try'
																		? TRFlag
																		: undefined
													}
													alt='flag'
													style={{
														height: isMobileSize ? '1.5rem' : '2rem',
														width: isMobileSize ? '1.5rem' : '2rem',
														borderRadius: '50%',
														objectFit: 'cover',
													}}
												/>
											</Box>
										);
									})}
							</Box>
						)}
					</Box>
				</Box>

				{/* Tags Section */}
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-start',
						alignItems: 'center',
						padding: isMobileSize ? '1rem' : '1.25rem',
						...cardSx,
						flex: 2,
						height: '100%',
						minHeight: '200px',
					}}>
					<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.85rem' : '1rem', mb: '1rem' }}>
						Tags
					</Typography>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', mt: '1.5rem' }}>
						{singleConsultation?.tags && singleConsultation?.tags?.length > 0 ? singleConsultation?.tags?.map((tag, index) => (
							<Chip
								key={index}
								label={tag}
								size='small'
								sx={{
									fontSize: isMobileSize ? '0.7rem' : '0.75rem',
									height: isMobileSize ? '1.5rem' : '1.75rem',
									backgroundColor: theme.palette.primary.light + '20',
									color: theme.palette.primary.main,
								}}
							/>
						)) : <Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', color: theme.palette.text.secondary }}>No tags added for this consultation</Typography>}
					</Box>
				</Box>

				{/* Cover Image */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						mt: '1rem',
						flex: 1,
					}}>
					<Box sx={{ textAlign: 'center' }}>
						<img
							src={singleConsultation?.coverImageUrl || 'https://placehold.co/500x400/e2e8f0/64748b?text=No+Cover+Image'}
							alt='consultation_img'
							height={isMobileSize ? '85' : '150'}
							style={{
								borderRadius: '0.2rem',
								boxShadow: cardShadow,
							}}
						/>
						<Box>
							<Typography variant='body2' sx={{ mt: '0.25rem' }}>
								Cover Image
							</Typography>
						</Box>
					</Box>
				</Box>
			</Box>

		</Box>
	);
};

export default ConsultationDetailsNonEditBox;
