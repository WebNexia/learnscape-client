import { Box, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import { ReactNode, createContext } from 'react';
import { useQuery } from 'react-query';
import { FilteredCourse } from '../interfaces/course';
import theme from '../themes';
import { SentimentVeryDissatisfied } from '@mui/icons-material';

interface ActiveCoursesContextTypes {
	data: FilteredCourse[];
}

interface ActiveCoursesContextProviderProps {
	children: ReactNode;
}

export const ActiveCoursesContext = createContext<ActiveCoursesContextTypes>({ data: [] });

const ActiveCoursesContextProvider = (props: ActiveCoursesContextProviderProps) => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { data, isLoading, isError } = useQuery('activeCourses', async () => {
		const response = await axios.post(`${base_url}/courses/filter`, {
			query: { isActive: true },
		});
		return response.data.response;
	});

	if (isLoading) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: theme.bgColor?.secondary,
					height: '100vh',
				}}>
				<CircularProgress />
				<Typography
					sx={{
						margin: '2rem',
						fontSize: '2rem',
						fontFamily: 'Poppins',
						fontWeight: 500,
						color: '#01435A',
					}}>
					Loading...
				</Typography>
				<Typography
					sx={{
						fontSize: '3rem',
						fontFamily: 'Permanent Marker, cursive',
						color: '#01435A',
					}}>
					KAIZEN
				</Typography>
			</Box>
		);
	}

	if (isError) {
		return (
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: theme.bgColor?.secondary,
					height: '100vh',
				}}>
				<Typography
					sx={{
						margin: '2rem',
						fontSize: '2rem',
						fontFamily: 'Poppins',
						fontWeight: 500,
						color: '#01435A',
					}}>
					Ooops, something went wrong!
				</Typography>
				<SentimentVeryDissatisfied fontSize='large' color='error' />
			</Box>
		);
	}
	return (
		<ActiveCoursesContext.Provider value={{ data }}>
			{props.children}
		</ActiveCoursesContext.Provider>
	);
};

export default ActiveCoursesContextProvider;
