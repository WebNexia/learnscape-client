import { Box } from '@mui/material';
import axios from 'axios';
import { ReactNode, createContext } from 'react';
import { useQuery } from 'react-query';
import { FilteredCourse } from '../interfaces/course';

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
		const response = await axios.post(`${base_url}/courses/filter`, { query: { isActive: true } });
		return response.data.response;
	});

	if (isLoading) {
		return <Box>Loading...</Box>;
	}

	if (isError) {
		return <Box>Error fetching data</Box>;
	}
	return <ActiveCoursesContext.Provider value={{ data }}>{props.children}</ActiveCoursesContext.Provider>;
};

export default ActiveCoursesContextProvider;
