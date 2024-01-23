import { Box, Checkbox, FormControlLabel } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/DashboardPagesLayout';
import { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import DashboardCourseCard from '../components/DashboardCourseCard';
import { Course } from '../interfaces/course';

const Courses = () => {
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const [checked, setChecked] = useState<boolean>(false);

	const { data, isLoading, isError } = useQuery('activeCourses', async () => {
		const response = await axios.post(`${base_url}/courses/filter`, { query: { isActive: true } });

		return response.data;
	});

	if (isLoading) {
		return <Box>Loading...</Box>;
	}

	if (isError) {
		return <Box>Error fetching data</Box>;
	}

	return (
		<DashboardPagesLayout pageName='Courses' customSettings={{ alignItems: 'flex-start' }}>
			<Box sx={{ width: '100%' }}>
				<Box sx={{ margin: '2rem 0 2rem 3rem' }}>
					<FormControlLabel
						control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />}
						label='Show only my courses'
					/>
				</Box>

				<Box
					sx={{
						display: 'flex',
						flexWrap: 'wrap',
						justifyContent: 'space-around',
						alignItems: 'center',
						margin: '0 3rem',
					}}>
					{data.response.map((course: Course) => (
						<DashboardCourseCard key={course._id} course={course} />
					))}
				</Box>
			</Box>
		</DashboardPagesLayout>
	);
};

export default Courses;
