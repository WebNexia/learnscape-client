import { Theme, ThemeOptions, createTheme } from '@mui/material/styles';

interface ExtendedThemeOptions extends ThemeOptions {
	tabBtnAuth?: {
		fontSize?: string;
		fontFamily?: string;
		fontWeight?: number;
		color?: string;
	};
	submitBtn?: {
		'backgroundColor'?: string;
		'marginTop'?: string;
		'fontWeight'?: number;
		':hover': {
			backgroundColor?: string;
			color?: string;
			border?: string;
		};
		'textTransform': string;
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
		adminSidebar: string;
		adminHeader: string;
		adminPaper: string;
		adminSubmitBtn: string;
		instructorSidebar: string;
		instructorHeader: string;
		instructorPaper: string;
		instructorSubmitBtn: string;
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
			main: '#FFFF',
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
			fontWeight: 500,
			color: '#01435A',
		},
		h3: {
			fontSize: '1.5rem',
			fontFamily: 'Poppins',
			fontWeight: 500,
			color: '#01435A',
		},
		h4: {
			fontSize: '1.25rem',
			fontFamily: 'Poppins',
			fontWeight: 500,
			color: '#01435A',
		},
		h5: {
			fontSize: '1.1rem',
			fontFamily: 'Poppins',
			fontWeight: 500,
			color: '#01435A',
		},
		h6: {
			fontSize: '1rem',
			fontFamily: 'Poppins',
			fontWeight: 500,
			color: '#01435A',
		},
		body1: {
			fontSize: '1rem',
			fontFamily: 'Poppins',
			fontWeight: 500,
			color: '#4D7B8B',
		},
		body2: {
			fontSize: '0.85rem',
			fontFamily: 'Poppins',
			fontWeight: 500,
			color: '#4D7B8B',
		},
	},
	tabBtnAuth: {
		fontSize: '1.25rem',
		fontFamily: 'Varela Round',
		fontWeight: 500,
		color: '#01435A',
	},
	submitBtn: {
		'fontFamily': 'Varela Round',
		'backgroundColor': '#1EC28B',
		'marginTop': '1.25rem',
		'fontWeight': 500,
		':hover': {
			backgroundColor: '#FFFF',
			color: '#1EC28B',
			border: 'solid #1EC28B',
		},
		'textTransform': 'capitalize',
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
		adminSidebar: '#007270',
		adminHeader: '#009694',
		adminPaper: '#007270',
		adminSubmitBtn: '#009694',
		instructorSidebar: '#0D3562',
		instructorHeader: '#1C4F8B',
		instructorPaper: '#0D3562',
		instructorSubmitBtn: '#1D4ED8',
		primary: '#01435A',
		secondary: '#FFFF',
		lessonInProgress: '#4D7B8B',
		common: '#FFFF',
		commonTwo: '#F0F2F5',
		greenPrimary: '#1EC28B',
		greenSecondary: '#00C6AD',
		delete: '#FF0000',
	},
} as ExtendedThemeOptions);

export default theme as Theme & ExtendedThemeOptions;
