import type { SxProps, Theme } from '@mui/material';

export const levelTestCardSx: SxProps<Theme> = {
	borderRadius: { xs: 3, sm: 4 },
	border: '1px solid rgba(0, 76, 153, 0.16)',
	bgcolor: '#fff',
	boxShadow: '0 18px 50px rgba(1, 67, 90, 0.1)',
};

export const levelTestHeadingSx: SxProps<Theme> = {
	fontFamily: 'Varela Round, sans-serif',
	fontWeight: 700,
	color: '#01435A',
};

export const primaryButtonSx: SxProps<Theme> = {
	borderRadius: 999,
	textTransform: 'none',
	fontFamily: 'Varela Round, sans-serif',
	fontWeight: 700,
	bgcolor: '#0052a3',
	'&:hover': { bgcolor: '#004c99' },
};
