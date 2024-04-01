import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import { useParams } from 'react-router-dom';
import CoursePageBanner from '../components/CoursePageBanner';
import Chapters from '../components/courses/Chapters';
import {
	UserCourseLessonDataContext,
	UserCoursesIdsWithCourseIds,
} from '../contexts/UserCourseLessonDataContextProvider';
import { useContext, useEffect, useState } from 'react';

const CoursePage = () => {
	const { singleCourse, fetchSingleCourseData } = useContext(UserCourseLessonDataContext);
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
			{singleCourse && (
				<>
					<CoursePageBanner
						course={singleCourse}
						isEnrolledStatus={isEnrolledStatus}
						setIsEnrolledStatus={setIsEnrolledStatus}
					/>
					<Chapters course={singleCourse} isEnrolledStatus={isEnrolledStatus} />
				</>
			)}
		</DashboardPagesLayout>
	);
};

export default CoursePage;
