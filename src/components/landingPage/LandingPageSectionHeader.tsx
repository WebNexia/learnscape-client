import { Box, Typography } from '@mui/material';
import { responsiveStyles } from '../../styles/responsiveStyles';

const titleSx = {
	fontSize: responsiveStyles.typography.h2,
	fontFamily: 'Varela Round',
	background: 'linear-gradient(135deg, #004c99 0%, #0052a3 50%, #0066CC 100%)',
	WebkitBackgroundClip: 'text',
	WebkitTextFillColor: 'transparent',
	backgroundClip: 'text',
	letterSpacing: '-0.02em',
	lineHeight: 1.2,
	fontWeight: 700,
	filter:
		'drop-shadow(0 0 10px rgba(240, 244, 248, 0.95)) drop-shadow(0 0 22px rgba(232, 240, 248, 0.85)) drop-shadow(0 0 36px rgba(228, 238, 248, 0.55))',
} as const;

const subtitleSx = {
	color: '#475569',
	fontSize: responsiveStyles.typography.body1,
	fontFamily: 'Varela Round',
	fontWeight: 400,
	lineHeight: 1.65,
	maxWidth: { xs: '100%', sm: '36rem', md: '42rem' },
	mx: 'auto',
} as const;

interface LandingPageSectionHeaderProps {
	title: string;
	subtitle?: string;
	centered?: boolean;
	sx?: object;
}

const LandingPageSectionHeader = ({ title, subtitle, centered = true, sx }: LandingPageSectionHeaderProps) => (
	<Box
		sx={{
			textAlign: centered ? 'center' : 'left',
			mb: { xs: 2, sm: 3 },
			px: 2,
			...sx,
		}}>
		<Typography sx={titleSx}>{title}</Typography>
		{subtitle ? (
			<Typography sx={{ ...subtitleSx, mt: { xs: 1.25, sm: 1.5 } }}>{subtitle}</Typography>
		) : null}
	</Box>
);

export default LandingPageSectionHeader;
