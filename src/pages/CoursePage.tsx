import { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CoursePageBanner from '../components/layouts/coursePageBanner/CoursePageBanner';
import Chapters from '../components/userCourses/Chapters';
import { UserCourseLessonDataContext, UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import DocumentViewer from '../components/documents/DocumentViewer';

const CoursePage = () => {
	const { singleCourseUser, fetchSingleCourseDataUser, userCoursesData } = useContext(UserCourseLessonDataContext);
	const { courseId, userCourseId } = useParams();

	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;

	const userCourseData: UserCoursesIdsWithCourseIds[] = userCoursesData || [];

	const currentUserCourse = userCourseData.find((data) => data.courseId === courseId);
	const isCourseCompleted = currentUserCourse?.isCourseCompleted ?? false;
	const currentUserCourseId = currentUserCourse?.userCourseId;

	const [isEnrolledStatus, setIsEnrolledStatus] = useState<boolean>(false);
	const documentsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setIsEnrolledStatus(userCourseData?.some((data) => data.courseId === courseId) || false);

		if (courseId) {
			fetchSingleCourseDataUser(courseId);
		}
	}, [userCourseId, courseId, userCourseData]);

	return (
		<DashboardPagesLayout pageName='Course' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			{singleCourseUser && (
				<>
					<CoursePageBanner
						course={singleCourseUser}
						isEnrolledStatus={isEnrolledStatus}
						setIsEnrolledStatus={setIsEnrolledStatus}
						documentsRef={documentsRef}
						fromHomePage={false}
						userCourseId={currentUserCourseId}
						isCourseCompleted={isCourseCompleted}
					/>
					<Chapters course={singleCourseUser} isEnrolledStatus={isEnrolledStatus} />
				</>
			)}
			{isEnrolledStatus && singleCourseUser?.documents && (
				<Box
					ref={documentsRef}
					sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: '2rem 0', width: isMobileSize ? '90%' : '85%' }}>
					<DocumentViewer
						documents={singleCourseUser?.documents || []}
						title='Course Materials'
						layout={isMobileSize ? 'list' : 'grid'}
						showTitle={true}
						inlinePDFs={true}
					/>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default CoursePage;
