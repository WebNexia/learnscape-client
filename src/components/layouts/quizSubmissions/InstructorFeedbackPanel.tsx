import { Box, Typography, SxProps, Theme } from '@mui/material';
import { RateReviewOutlined } from '@mui/icons-material';
import { ReactNode } from 'react';
import theme from '../../../themes';

const accent = theme.bgColor?.greenPrimary ?? '#1EC28B';

export const instructorFeedbackPanelSx: SxProps<Theme> = {
	width: '100%',
	mt: 2,
	mb: 1,
	p: { xs: '1rem 1.1rem', sm: '1.15rem 1.35rem' },
	borderRadius: '0.5rem',
	borderLeft: `4px solid ${accent}`,
	backgroundColor: 'rgba(30, 194, 139, 0.08)',
	boxShadow: '0 0.08rem 0.25rem rgba(1, 67, 90, 0.1)',
};

type InstructorFeedbackPanelProps = {
	title: string;
	children: ReactNode;
	sx?: SxProps<Theme>;
	titleFontSize?: string | { xs?: string; sm?: string };
};

const InstructorFeedbackPanel = ({ title, children, sx, titleFontSize }: InstructorFeedbackPanelProps) => (
	<Box sx={{ ...instructorFeedbackPanelSx, ...sx }}>
		<Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '0.65rem' }}>
			<RateReviewOutlined sx={{ color: accent, fontSize: titleFontSize ?? { xs: '1.15rem', sm: '1.25rem' } }} />
			<Typography
				variant='subtitle1'
				component='h3'
				sx={{
					fontWeight: 600,
					color: theme.textColor?.primary?.main ?? '#01435A',
					fontSize: titleFontSize ?? { xs: '0.9rem', sm: '1rem' },
					fontFamily: 'Varela Round',
					lineHeight: 1.3,
				}}>
				{title}
			</Typography>
		</Box>
		<Box sx={{ pl: { xs: 0, sm: '0.15rem' } }}>{children}</Box>
	</Box>
);

export default InstructorFeedbackPanel;
