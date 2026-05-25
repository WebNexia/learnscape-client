import { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import { TouchApp, Keyboard } from '@mui/icons-material';
import theme from '../../../themes';
import { LEARNER_TEXT_FONT_FAMILY } from '../../../utils/learnerTypography';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

export type FitbInteractionMode = 'tap' | 'typing';

interface FitbInteractionModeBadgeProps {
	mode: FitbInteractionMode;
	compact?: boolean;
}

const MODE_CONFIG = {
	tap: {
		Icon: TouchApp,
		accent: 'rgba(1, 67, 90, 0.12)',
		iconColor: theme.palette.primary.main,
	},
	typing: {
		Icon: Keyboard,
		label: 'Type to answer',
		hint: 'Type the correct word into each blank',
		accent: 'rgba(1, 67, 90, 0.08)',
		iconColor: theme.palette.primary.main,
	},
} as const;

const DotSeparator = () => (
	<Box
		component='span'
		sx={{
			width: '0.25rem',
			height: '0.25rem',
			borderRadius: '50%',
			backgroundColor: 'rgba(1, 67, 90, 0.28)',
			flexShrink: 0,
		}}
	/>
);

const FitbInteractionModeBadge = ({ mode, compact = false }: FitbInteractionModeBadgeProps) => {
	const { isDesktop } = useContext(MediaQueryContext);
	const config = MODE_CONFIG[mode];
	const { Icon, accent, iconColor } = config;

	const label = mode === 'tap' ? (isDesktop ? 'Click to place' : 'Tap to place') : MODE_CONFIG.typing.label;
	const hint =
		mode === 'tap'
			? isDesktop
				? 'Select a word card, then click a blank to fill it'
				: 'Select a word card, then tap a blank to fill it'
			: MODE_CONFIG.typing.hint;

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				gap: compact ? 1 : 1.25,
				width: '100%',
				mb: compact ? 2.5 : 3.5,
				mt: 0,
				px: compact ? 1.1 : 1.35,
				py: compact ? 0.75 : 0.9,
				borderRadius: '0.85rem',
				border: '1px solid rgba(1, 67, 90, 0.14)',
				background: `linear-gradient(135deg, ${accent} 0%, rgba(255, 255, 255, 0.92) 100%)`,
				boxShadow: '0 4px 14px rgba(1, 67, 90, 0.06)',
			}}
			role='status'
			aria-label={`${label}. ${hint}`}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: compact ? 2.1 : 2.35,
					height: compact ? 2.1 : 2.35,
					borderRadius: '50%',
					flexShrink: 0,
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					border: '1px solid rgba(1, 67, 90, 0.12)',
					color: iconColor,
				}}>
				<Icon sx={{ fontSize: compact ? '1rem' : '1.15rem' }} />
			</Box>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					flexWrap: 'nowrap',
					gap: 0.75,
					minWidth: 0,
					overflow: 'hidden',
				}}>
				<Typography
					component='span'
					noWrap
					sx={{
						fontSize: compact ? '0.82rem' : '0.9rem',
						fontWeight: 700,
						color: theme.palette.primary.main,
						fontFamily: LEARNER_TEXT_FONT_FAMILY,
						flexShrink: 0,
					}}>
					{label}
				</Typography>
				{!compact && (
					<>
						<DotSeparator />
						<Typography
							component='span'
							noWrap
							sx={{
								fontSize: '0.82rem',
								color: 'text.secondary',
								fontFamily: LEARNER_TEXT_FONT_FAMILY,
								minWidth: 0,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
							}}>
							{hint}
						</Typography>
					</>
				)}
			</Box>
		</Box>
	);
};

export default FitbInteractionModeBadge;
