import { Box } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import CoursePageBanner from '../components/CoursePageBanner';
import Chapters from '../components/courses/Chapters';
import { UserCoursesIdsWithCourseIds } from '../contexts/UserCoursesIdsContextProvider';

const CoursePage = () => {
	const { courseId } = useParams();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	let courseIdUserCourseIds: UserCoursesIdsWithCourseIds[] = [];

	const currentUserCourseIds: string | null = localStorage.getItem('userCoursesIds');
	if (currentUserCourseIds !== null) {
		courseIdUserCourseIds = JSON.parse(currentUserCourseIds);
	}
	let isEnrolledStatus: boolean =
		courseIdUserCourseIds.filter((courseIdUserCourseId) => courseIdUserCourseId.courseId === courseId).length > 0;

	const { data, isLoading, isError } = useQuery('singleCourseData', async () => {
		const response = await axios.get(`${base_url}/courses/${courseId}`);

		return response.data.data[0];
	});

	if (isLoading) {
		return <Box>Loading...</Box>;
	}

	if (isError) {
		return <Box>Error fetching data</Box>;
	}

	return (
		<DashboardPagesLayout pageName='Courses'>
			<CoursePageBanner course={data} isEnrolledStatus={isEnrolledStatus} />
			<Chapters course={data} isEnrolledStatus={isEnrolledStatus} />
		</DashboardPagesLayout>
	);
};

export default CoursePage;
