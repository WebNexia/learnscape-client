import { useContext, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { Logout, OpenInNew, PlayCircleOutline } from '@mui/icons-material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import CoursePageBanner from '../components/layouts/coursePageBanner/CoursePageBanner';
import Chapters from '../components/userCourses/Chapters';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';
import DocumentViewer from '../components/documents/DocumentViewer';
import { getVideoThumbnailUrl } from '../utils/videoUrlUtils';
import { useStaffCoursePreview } from '../hooks/useStaffCoursePreview';
import { useAuth } from '../hooks/useAuth';
import theme from '../themes';

const CoursePageLoadingState = ({ isMobileSize }: { isMobileSize: boolean }) => (
	<Box sx={{ width: isMobileSize ? '90%' : '85%', mt: '1.75rem', mb: '2rem' }}>
		<Typography
			variant='h6'
			sx={{
				mb: '1rem',
				color: 'text.primary',
				fontSize: isMobileSize ? '1rem' : '1.2rem',
				fontWeight: 600,
			}}>
			Preparing your course content...
		</Typography>

		<Box
			sx={{
				borderRadius: '1rem',
				overflow: 'hidden',
				border: '1px solid',
				borderColor: 'divider',
				backgroundColor: 'background.paper',
				p: isMobileSize ? '1rem' : '1.5rem',
				mb: '1.25rem',
			}}>
			<Skeleton variant='text' width={isMobileSize ? '80%' : '45%'} height={isMobileSize ? 34 : 44} />
			<Skeleton variant='text' width='95%' />
			<Skeleton variant='text' width='88%' />
			<Skeleton variant='rounded' height={isMobileSize ? 44 : 52} width={isMobileSize ? 130 : 180} sx={{ mt: '1rem' }} />
		</Box>

		<Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
			{Array.from({ length: 3 }).map((_, idx) => (
				<Box
					key={idx}
					sx={{
						borderRadius: '0.75rem',
						border: '1px solid',
						borderColor: 'divider',
						backgroundColor: 'background.paper',
						p: isMobileSize ? '0.65rem' : '0.85rem',
					}}>
					<Skeleton variant='text' width={isMobileSize ? '70%' : '35%'} height={30} />
					<Skeleton variant='rounded' height={isMobileSize ? 48 : 58} sx={{ mt: '0.35rem' }} />
				</Box>
			))}
		</Box>
	</Box>
);

/** Staff learner-view: renders the exact learner course page UI (banner, chapters, materials, videos). */
const StaffCoursePreviewPage = () => {
	const { courseId } = useParams();
	const navigate = useNavigate();
	const { isInstructor } = useAuth();

	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;

	const staffPreviewBasePath = isInstructor
		? `/instructor/course-preview/course/${courseId}`
		: `/admin/course-preview/course/${courseId}`;
	const coursesListPath = isInstructor ? '/instructor/courses' : '/admin/courses';

	const [videoThumbnailLoadErrors, setVideoThumbnailLoadErrors] = useState<Record<string, boolean>>({});
	const documentsRef = useRef<HTMLDivElement>(null);

	const { data: course, isLoading } = useStaffCoursePreview(courseId || '');
	const activeCourse = course && course._id === courseId ? course : null;
	const shouldShowLoadingState = isLoading && !activeCourse;

	const courseMaterials = useMemo(
		() =>
			(activeCourse?.documents ?? []).filter(
				(doc) => doc && doc._id && typeof doc.documentUrl === 'string' && doc.documentUrl.trim() !== ''
			),
		[activeCourse?.documents]
	);
	const hasCourseMaterials = courseMaterials.length > 0 || (activeCourse?.documentIds?.length ?? 0) > 0;

	return (
		<DashboardPagesLayout pageName='Course' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box
				sx={{
					width: '90%',
					display: 'flex',
					justifyContent: 'flex-end',
					mt: '1rem',
					mb: '-1.25rem',
					zIndex: 2,
				}}>
				<Button
					variant='outlined'
					size='small'
					startIcon={<Logout fontSize='small' />}
					onClick={() => {
						navigate(coursesListPath);
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}}
					sx={{
						textTransform: 'none',
						fontFamily: theme.fontFamily?.main,
						fontSize: isMobileSize ? '0.7rem' : '0.8rem',
						backgroundColor: 'background.paper',
					}}>
					Leave Learner View
				</Button>
			</Box>
			{shouldShowLoadingState && <CoursePageLoadingState isMobileSize={isMobileSize} />}
			{activeCourse && (
				<>
					<CoursePageBanner
						course={activeCourse}
						isEnrolledStatus={true}
						isEnrollmentRemoved={false}
						documentsRef={documentsRef}
						fromHomePage={false}
						backToCoursesPath={coursesListPath}
					/>
					<Chapters
						course={activeCourse}
						isEnrolledStatus={true}
						staffPreviewMode
						staffPreviewBasePath={staffPreviewBasePath}
					/>
				</>
			)}
			{hasCourseMaterials && (
				<Box
					ref={documentsRef}
					sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: '3rem 0 2rem 0', width: isMobileSize ? '90%' : '85%' }}>
					<DocumentViewer
						documents={courseMaterials.length > 0 ? courseMaterials : activeCourse?.documents || []}
						title='Course Materials'
						layout={isMobileSize ? 'list' : 'grid'}
						showTitle={true}
						inlinePDFs={true}
					/>
				</Box>
			)}
			{activeCourse?.videoURLs && activeCourse.videoURLs.filter((videoURL) => videoURL && videoURL.url && videoURL.url.trim() !== '' && videoURL.title && videoURL.title.trim() !== '').length > 0 && (
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
						{activeCourse.videoURLs
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

export default StaffCoursePreviewPage;
