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
		greenPrimary: {
			main: string;
		};
		greenSecondary: {
			main: string;
		};
		error: {
			main: string;
		};
	};
	fontFamily?: {
		main: string;
	};
	bgColor?: {
		primary: string;
		secondary: string;
		lessonInProgress: string;
		common: string;
		commonTwo: string;
		greenPrimary: string;
		greenSecondary: string;
		delete: string;
	};
	border: {
		main: string;
		lightMain: string;
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
		success: {
			main: '#1EC28B',
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
			fontWeight: 900,
			color: '#01435A',
		},
		h3: {
			fontSize: '1.5rem',
			fontFamily: 'Poppins',
			fontWeight: 900,
			color: '#01435A',
		},
		h4: {
			fontSize: '1.25rem',
			fontFamily: 'Poppins',
			fontWeight: 900,
			color: '#01435A',
		},
		h5: {
			fontSize: '1.1rem',
			fontFamily: 'Poppins',
			fontWeight: 900,
			color: '#01435A',
		},
		h6: {
			fontSize: '1rem',
			fontFamily: 'Poppins',
			fontWeight: 900,
			color: '#01435A',
		},
		body1: {
			fontSize: '1rem',
			fontFamily: 'Poppins',
			fontWeight: 400,
			color: '#4D7B8B',
		},
		body2: {
			fontSize: '0.9rem',
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
		greenPrimary: {
			main: '#1EC28B',
		},
		greenSecondary: {
			main: '#00C6AD',
		},
		error: {
			main: '#ff3333',
		},
	},
	fontFamily: {
		main: 'Poppins',
	},

	border: {
		main: '#808080',
		lightMain: '#d3d3d3',
	},

	bgColor: {
		primary: '#01435A',
		secondary: '#FDF7F0',
		lessonInProgress: '#4D7B8B',
		common: '#FFFF',
		commonTwo: '#F0F2F5',
		greenPrimary: '#1EC28B',
		greenSecondary: '#00C6AD',
		delete: '#FF0000',
	},
} as ExtendedThemeOptions);

export default theme as Theme & ExtendedThemeOptions;
