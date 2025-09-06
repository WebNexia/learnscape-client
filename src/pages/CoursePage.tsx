import { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Link, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CoursePageBanner from '../components/layouts/coursePageBanner/CoursePageBanner';
import Chapters from '../components/userCourses/Chapters';
import { UserCourseLessonDataContext, UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';
import { Document } from '../interfaces/document';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';

const CoursePage = () => {
	const { singleCourseUser, fetchSingleCourseDataUser } = useContext(UserCourseLessonDataContext);
	const { courseId, userCourseId } = useParams();

	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;

	let userCourseData: UserCoursesIdsWithCourseIds[] = [];

	const [isEnrolledStatus, setIsEnrolledStatus] = useState<boolean>(false);
	const documentsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const currentUserCourseData: string | null = localStorage.getItem('userCourseData');
		if (currentUserCourseData !== null) {
			userCourseData = JSON.parse(currentUserCourseData);
			setIsEnrolledStatus(userCourseData?.some?.((data) => data.courseId === courseId) || false);
		}
		if (courseId) {
			fetchSingleCourseDataUser(courseId);
		}
	}, [userCourseId, courseId]);

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
					/>
					<Chapters course={singleCourseUser} isEnrolledStatus={isEnrolledStatus} />
				</>
			)}
			{isEnrolledStatus && singleCourseUser?.documents && (
				<Box
					ref={documentsRef}
					sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0', width: isMobileSize ? '90%' : '85%' }}>
					<Box sx={{ display: 'flex', alignSelf: 'flex-start' }}>
						<Typography variant='h4' sx={{ mb: isMobileSize ? '0.5rem' : '1rem', fontSize: isMobileSize ? '0.9rem' : undefined }}>
							Course Materials
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignSelf: 'flex-start', flexDirection: 'column' }}>
						{singleCourseUser?.documents
							?.filter?.((doc: Document) => doc !== null)
							?.map?.((doc: Document) => (
								<Box sx={{ marginBottom: '0.5rem' }} key={doc._id}>
									<Link
										href={doc?.documentUrl}
										target='_blank'
										rel='noopener noreferrer'
										variant='body2'
										sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
										{doc?.name}
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
