import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import { useContext } from 'react';
import CustomTextField from '../forms/customFields/CustomTextField';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import { PROMO_BANNER_LIMITS, PromoBanner } from '../../utils/promoBanner';

interface PromoBannerFieldsProps {
	value: PromoBanner;
	onChange: (next: PromoBanner) => void;
	description: string;
}

const PromoBannerFields = ({ value, onChange, description }: PromoBannerFieldsProps) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const patch = (partial: Partial<PromoBanner>) => onChange({ ...value, ...partial });

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
			<Typography sx={{ fontSize: isMobileSize ? '0.72rem' : '0.8rem', color: 'text.secondary', lineHeight: 1.55 }}>{description}</Typography>
			<FormControlLabel
				sx={{
					ml: 0,
					mr: 0,
					alignItems: 'center',
					'& .MuiFormControlLabel-label': { fontSize: isMobileSize ? '0.75rem' : '0.85rem' },
				}}
				control={<Switch checked={value.enabled} onChange={(event) => patch({ enabled: event.target.checked })} />}
				label={value.enabled ? 'Shown to visitors' : 'Hidden'}
			/>
			<CustomTextField
				label='Title'
				value={value.title}
				required={false}
				onChange={(event) => patch({ title: event.target.value })}
				placeholder='Yaz indirimi'
				InputProps={{ inputProps: { maxLength: PROMO_BANNER_LIMITS.title } }}
			/>
			<Box>
				<CustomTextField
					label='Message'
					value={value.body}
					required={false}
					multiline
					rows={4}
					onChange={(event) => patch({ body: event.target.value })}
					placeholder='Bu hafta tüm kitaplarda %20 indirim.'
					InputProps={{ inputProps: { maxLength: PROMO_BANNER_LIMITS.body } }}
				/>
				<Typography sx={{ fontSize: '0.7rem', textAlign: 'right', mt: 0.25 }}>
					{value.body.length}/{PROMO_BANNER_LIMITS.body}
				</Typography>
			</Box>
			<CustomTextField
				label='Button label'
				value={value.buttonLabel}
				required={false}
				onChange={(event) => patch({ buttonLabel: event.target.value })}
				placeholder='Kitaplara git'
				InputProps={{ inputProps: { maxLength: PROMO_BANNER_LIMITS.buttonLabel } }}
			/>
			<CustomTextField
				label='Button link'
				value={value.buttonUrl}
				required={false}
				onChange={(event) => patch({ buttonUrl: event.target.value })}
				placeholder='/landing-page-resources or https://...'
				InputProps={{ inputProps: { maxLength: PROMO_BANNER_LIMITS.buttonUrl } }}
			/>
		</Box>
	);
};

export default PromoBannerFields;
