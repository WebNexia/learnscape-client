import { Theme, ThemeOptions, createTheme } from '@mui/material/styles';

interface ExtendedThemeOptions extends ThemeOptions {
	tabBtnAuth?: {
		fontSize?: string;
		fontFamily?: string;
		fontWeight?: number;
		color?: string;
	};
	submitBtn?: {
		backgroundColor?: {
			primary: string;
			secondary: string;
		};
		marginTop?: string;
		fontWeight?: number;
		':hover': {
			backgroundColor?: string;
			color?: string;
			border?: string;
		};
	};
	textColor?: {
		primary: {
			main: string;
		};
		secondary: {
			main: string;
		};
		common: {
			main: string;
		};
	};
	fontFamily?: {
		main: string;
	};
	bgColor?: {
		primary: string;
		secondary: string;
		common: string;
		greenPrimary: string;
		greenSecondary: string;
	};
}

const theme = createTheme({
	palette: {
		primary: {
			main: '#01435A',
		},
		secondary: {
			main: '#FDF7F0',
		},
		light: {
			main: '#FFFF',
		},
	},
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
		backgroundColor: {
			primary: '#1EC28B',
			secondary: '#00C6AD',
		},
		marginTop: '1.25rem',
		fontWeight: 500,
		':hover': {
			backgroundColor: '#FDF7F0',
			color: '#1EC28B',
			border: 'solid #1EC28B',
		},
	},
	textColor: {
		primary: {
			main: '#01435A',
		},
		secondary: {
			main: '#4D7B8B',
		},
		common: {
			main: '#FFFFFF', // White color
		},
	},
	fontFamily: {
		main: 'Poppins',
	},
	bgColor: {
		primary: '#01435A',
		secondary: '#FDF7F0',
		common: '#FFFF',
		greenPrimary: '#1EC28B',
		greenSecondary: '#00C6AD',
	},
} as ExtendedThemeOptions);

export default theme as Theme & ExtendedThemeOptions;
