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

	let courseIdUserCourseIds: UserCoursesIdsWithCourseIds[] = [];

	const [isEnrolledStatus, setIsEnrolledStatus] = useState<boolean>(false);

	useEffect(() => {
		const currentUserCourseIds: string | null = localStorage.getItem('userCoursesIds');
		if (currentUserCourseIds !== null) {
			courseIdUserCourseIds = JSON.parse(currentUserCourseIds);
			setIsEnrolledStatus(
				courseIdUserCourseIds.some((courseIdUserCourseId) => courseIdUserCourseId.courseId === courseId)
			);
		}

		if (courseId) {
			fetchSingleCourseData(courseId);
		}
	}, [userCourseId, courseId]);

	return (
		<DashboardPagesLayout pageName='Courses'>
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
