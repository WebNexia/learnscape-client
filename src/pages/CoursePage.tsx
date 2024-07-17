import { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Link, Typography } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CoursePageBanner from '../components/layouts/coursePageBanner/CoursePageBanner';
import Chapters from '../components/userCourses/Chapters';
import { UserCourseLessonDataContext, UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';
import { Document } from '../interfaces/document';

const CoursePage = () => {
	const { singleCourseUser, fetchSingleCourseData, singleCourse } = useContext(UserCourseLessonDataContext);
	const { courseId, userCourseId } = useParams();

	let userCourseData: UserCoursesIdsWithCourseIds[] = [];

	const [isEnrolledStatus, setIsEnrolledStatus] = useState<boolean>(false);
	const documentsRef = useRef<HTMLDivElement>(null);

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
					<CoursePageBanner
						course={singleCourseUser}
						isEnrolledStatus={isEnrolledStatus}
						setIsEnrolledStatus={setIsEnrolledStatus}
						documentsRef={documentsRef}
					/>
					<Chapters course={singleCourseUser} isEnrolledStatus={isEnrolledStatus} />
				</>
			)}
			{singleCourse?.documents && (
				<Box ref={documentsRef} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem', width: '85%' }}>
					<Box sx={{ display: 'flex', alignSelf: 'flex-start' }}>
						<Typography variant='h4' sx={{ mb: '1.25rem' }}>
							Course Materials
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignSelf: 'flex-start', flexDirection: 'column' }}>
						{singleCourse.documents
							?.filter((doc: Document) => doc !== null)
							?.map((doc: Document) => (
								<Box sx={{ marginBottom: '0.5rem' }} key={doc._id}>
									<Link href={doc?.documentUrl} target='_blank' rel='noopener noreferrer' variant='body2'>
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
