import { useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { OpenInNew, PlayCircleOutline } from '@mui/icons-material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CoursePageBanner from '../components/layouts/coursePageBanner/CoursePageBanner';
import Chapters from '../components/userCourses/Chapters';
import { UserCourseLessonDataContext, UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import DocumentViewer from '../components/documents/DocumentViewer';
import { getVideoThumbnailUrl } from '../utils/videoUrlUtils';

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
	const [videoThumbnailLoadErrors, setVideoThumbnailLoadErrors] = useState<Record<string, boolean>>({});
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
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: isMobileSize ? 'repeat(auto-fit, minmax(120px, 140px))' : 'repeat(auto-fit, minmax(200px, 240px))',
							gap: isMobileSize ? '1.5rem' : '1.5rem',
							width: '100%',
							justifyContent: 'center',
						}}>
						{singleCourseUser.videoURLs
							.filter((videoURL) => videoURL && videoURL.url && videoURL.url.trim() !== '' && videoURL.title && videoURL.title.trim() !== '')
							.map((videoURL, index) => {
								const thumbnailUrl = getVideoThumbnailUrl(videoURL.url);
								const shouldShowThumbnail = !!thumbnailUrl && !videoThumbnailLoadErrors[videoURL.url];

								return (
									<Box
										key={`${videoURL.url}-${index}`}
										component='a'
										href={videoURL.url}
										target='_blank'
										rel='noopener noreferrer'
										sx={{
											display: 'flex',
											flexDirection: 'column',
											width: '100%',
											textDecoration: 'none',
											color: 'inherit',
											borderRadius: '0.75rem',
											overflow: 'hidden',
											border: '1px solid',
											borderColor: 'divider',
											backgroundColor: 'background.paper',
											boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
											transition: 'transform 0.2s ease, box-shadow 0.2s ease',
											'&:hover': {
												transform: 'translateY(-2px)',
												boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
											},
										}}>
										{shouldShowThumbnail ? (
											<Box
												component='img'
												src={thumbnailUrl || undefined}
												alt={videoURL.title}
												onError={() =>
													setVideoThumbnailLoadErrors((prev) => ({
														...prev,
														[videoURL.url]: true,
													}))
												}
												sx={{
													width: '100%',
													aspectRatio: '16 / 9',
													objectFit: 'cover',
													backgroundColor: '#f3f4f6',
												}}
											/>
										) : (
											<Box
												sx={{
													width: '100%',
													aspectRatio: '16 / 9',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													flexDirection: 'column',
													gap: '0.4rem',
													background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
													color: 'white',
												}}>
												<PlayCircleOutline sx={{ fontSize: isMobileSize ? '2rem' : '2.5rem' }} />
											</Box>
										)}
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												gap: '0.75rem',
												padding: isMobileSize ? '0.75rem' : '0.9rem',
											}}>
											<Typography
												variant='body2'
												sx={{
													fontSize: isMobileSize ? '0.75rem' : '0.85rem',
													fontWeight: 500,
													lineHeight: 1.5,
													wordBreak: 'break-word',
												}}>
												{videoURL.title}
											</Typography>
											<OpenInNew sx={{ fontSize: isMobileSize ? '1rem' : '1.1rem', color: 'text.secondary', flexShrink: 0 }} />
										</Box>
									</Box>
								);
							})}
					</Box>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default CoursePage;
