import { Box } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import CoursePageBanner from '../components/CoursePageBanner';

const CoursePage = () => {
	const { id } = useParams();
	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { data, isLoading, isError } = useQuery('singleCourseData', async () => {
		const response = await axios.get(`${base_url}/courses/${id}`);

		return response.data.data[0];
	});

	if (isLoading) {
		return <Box>Loading...</Box>;
	}

	if (isError) {
		return <Box>Error fetching data</Box>;
	}

	return (
		<DashboardPagesLayout pageName='Courses' customSettings={{ alignItems: 'flex-start' }}>
			<CoursePageBanner course={data} userId={id} />
		</DashboardPagesLayout>
	);
};

export default CoursePage;
