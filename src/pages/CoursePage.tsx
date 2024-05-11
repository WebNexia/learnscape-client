import DashboardPagesLayout from '../components/layouts/Dashboard_Layout/DashboardPagesLayout';
import { useParams } from 'react-router-dom';
import CoursePageBanner from '../components/layouts/Course_Page_Banner/CoursePageBanner';
import Chapters from '../components/User_Courses/Chapters';
import { UserCourseLessonDataContext, UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';
import { useContext, useEffect, useState } from 'react';

const CoursePage = () => {
	const { singleCourseUser, fetchSingleCourseData } = useContext(UserCourseLessonDataContext);
	const { courseId, userCourseId } = useParams();

	let userCourseData: UserCoursesIdsWithCourseIds[] = [];

	const [isEnrolledStatus, setIsEnrolledStatus] = useState<boolean>(false);

	useEffect(() => {
		const currentUserCourseData: string | null = localStorage.getItem('userCourseData');
		if (currentUserCourseData !== null) {
			userCourseData = JSON.parse(currentUserCourseData);
			setIsEnrolledStatus(userCourseData.some((data) => data.courseId === courseId));
		}

		if (courseId) {
			fetchSingleCourseData(courseId);
		}
	}, [userCourseId, courseId]);

	return (
		<DashboardPagesLayout pageName='Courses' customSettings={{ justifyContent: 'flex-start' }}>
			{singleCourseUser && (
				<>
					<CoursePageBanner course={singleCourseUser} isEnrolledStatus={isEnrolledStatus} setIsEnrolledStatus={setIsEnrolledStatus} />
					<Chapters course={singleCourseUser} isEnrolledStatus={isEnrolledStatus} />
				</>
			)}
		</DashboardPagesLayout>
	);
};

export default CoursePage;
