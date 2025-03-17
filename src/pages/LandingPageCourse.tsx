import { useParams } from 'react-router-dom';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { useContext, useEffect, useState } from 'react';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import { Box } from '@mui/material';
import CoursePageBanner from '../components/layouts/coursePageBanner/CoursePageBanner';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';

const LandingPageCourse = () => {
	const { courseId } = useParams();
	const { sortedPublicCoursesData } = useContext(CoursesContext);

	const [course, setCourse] = useState<SingleCourse>();

	useEffect(() => {
		if (courseId) {
			const selectedCourse = sortedPublicCoursesData.filter((course) => course._id === courseId)[0];
			setCourse(selectedCourse);
		}
	}, [courseId, sortedPublicCoursesData]);

	return (
		<LandingPageLayout>
			<Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', paddingTop: '13vh' }}>
				{course && <CoursePageBanner course={course} fromHomePage />}
			</Box>
			<Box sx={{ margin: '1rem 0 3rem 0' }}>
				<ChatWhatsApp />
			</Box>
		</LandingPageLayout>
	);
};

export default LandingPageCourse;
