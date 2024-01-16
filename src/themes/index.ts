import { Theme, ThemeOptions, createTheme } from '@mui/material/styles';

interface ExtendedThemeOptions extends ThemeOptions {
	tabBtnAuth?: {
		fontSize?: string;
		fontFamily?: string;
		fontWeight?: number;
		color?: string;
	};
	submitBtn?: {
		backgroundColor?: string;
		marginTop?: string;
		fontWeight?: number;
		':hover': {
			backgroundColor?: string;
			color?: string;
			border?: string;
		};
	};
}

const theme = createTheme({
	typography: {
		h1: {
			fontSize: '5rem',
			fontFamily: 'Permanent Marker, cursive',
			color: '#01435A',
		},
		h2: {
			fontSize: '3rem',
			fontFamily: 'Poppins',
			fontWeight: 500,
			color: '#01435A',
		},
		h3: {
			fontSize: '1.5rem',
			fontFamily: 'Poppins',
			fontWeight: 500,
			color: '#01435A',
		},
		body1: {
			fontSize: '1.25rem',
			fontFamily: 'Poppins',
			fontWeight: 400,
			color: '#4D7B8B',
		},
		body2: {
			fontSize: '1rem',
			fontFamily: 'Poppins',
			fontWeight: 400,
			color: '#4D7B8B',
		},
	},
	tabBtnAuth: {
		fontSize: '1.25rem',
		fontFamily: 'Poppins',
		fontWeight: 500,
		color: '#01435A',
	},
	submitBtn: {
		backgroundColor: '#1EC28B',
		marginTop: '1.25rem',
		fontWeight: 500,
		':hover': {
			backgroundColor: '#FDF7F0',
			color: '#1EC28B',
			border: 'solid #1EC28B',
		},
	},
} as ExtendedThemeOptions);

export default theme as Theme & ExtendedThemeOptions;
