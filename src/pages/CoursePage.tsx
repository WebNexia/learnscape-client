import { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Link, Typography } from '@mui/material';
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
					sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: '2rem 0 0 0', width: isMobileSize ? '90%' : '85%' }}>
					<DocumentViewer
						documents={singleCourseUser?.documents || []}
						title='Course Materials'
						layout={isMobileSize ? 'list' : 'grid'}
						showTitle={true}
						inlinePDFs={true}
					/>
				</Box>
			)}
			{isEnrolledStatus && singleCourseUser?.videoURLs && singleCourseUser.videoURLs.filter((videoURL) => videoURL && videoURL.url && videoURL.url.trim() !== '' && videoURL.title && videoURL.title.trim() !== '').length > 0 && (
				<Box
					sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: '2rem 0 4rem 0', width: isMobileSize ? '90%' : '85%' }}>
					<Typography variant='h5' sx={{ fontSize: isMobileSize ? '0.9rem' : undefined, mb: '1rem' }}>
						Course Videos
					</Typography>
					<Box>
						{singleCourseUser.videoURLs
							.filter((videoURL) => videoURL && videoURL.url && videoURL.url.trim() !== '' && videoURL.title && videoURL.title.trim() !== '')
							.map((videoURL, index) => (
								<Box sx={{ mb: '0.5rem' }} key={index}>
									<Link
										href={videoURL.url}
										target='_blank'
										rel='noopener noreferrer'
										variant='body2'
										sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{videoURL.title}
									</Link>
								</Box>
							))}
					</Box>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default CoursePage;
