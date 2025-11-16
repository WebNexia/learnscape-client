import { useParams } from 'react-router-dom';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { useContext, useEffect, useState } from 'react';
import { AllPublicCoursesContext } from '../contexts/AllPublicCoursesContextProvider';
import { SingleCourse } from '../interfaces/course';
import { Box, Card, CardContent, Typography, Avatar, Chip, Stack, IconButton } from '@mui/material';
import CoursePageBanner from '../components/layouts/coursePageBanner/CoursePageBanner';
import ChatWhatsApp from '../components/landingPage/ChatWhatsApp';
import { LinkedIn, Language } from '@mui/icons-material';
import theme from '../themes';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import { SEO, StructuredData } from '../components/seo';
import LondonBg from '../assets/london-bg.jpg';

const InstructorCard = ({ instructor }: { instructor: SingleCourse['instructor'] }) => {
	// Ensure URLs have proper protocol
	const formatUrl = (url: string | undefined) => {
		if (!url) return '';
		if (url.startsWith('http://') || url.startsWith('https://')) return url;
		return `https://${url}`;
	};

	return (
		<Card
			sx={{
				width: { xs: '85%', sm: '60%', md: '30vw' },
				maxWidth: '35rem',
				minHeight: '15rem',
				height: { xs: 'auto', sm: 'auto', md: 'auto', lg: '48vh' },
				maxHeight: { md: '480px' },
				borderRadius: '0.5rem',
				boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
				background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
				transition: 'transform 0.2s ease-in-out',
				display: 'flex', // ✅ ensures flexible layout inside
				flexDirection: 'column',
				mt: { xs: '-1rem', sm: '-1rem', md: '1rem' },
				justifyContent: 'space-between',
				position: 'relative',
			}}>
			<CardContent sx={{ p: 3, flexGrow: 1 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
					<Avatar
						src={instructor.imageUrl}
						alt={instructor.name}
						sx={{
							width: { xs: '4.5rem', sm: '5.5rem' },
							height: { xs: '4.5rem', sm: '5.5rem' },
							border: '3px solid',
							borderColor: theme.palette.primary.main,
						}}
					/>
					<Box sx={{ ml: 2.5 }}>
						<Typography variant='h6' sx={{ fontWeight: 600, color: theme.palette.primary.main, fontFamily: 'Varela Round' }}>
							{instructor.name}
						</Typography>
						<Typography variant='subtitle2' color='text.secondary' sx={{ fontFamily: 'Varela Round' }}>
							{instructor.title}
						</Typography>
					</Box>
				</Box>

				<Typography variant='body2' color='text.secondary' sx={{ mb: 2, fontFamily: 'Varela Round', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
					{instructor.bio}
				</Typography>

				<Stack direction='row' spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
					{instructor.expertise?.map((skill, index) => (
						<Chip
							key={index}
							label={skill}
							size='small'
							sx={{
								backgroundColor: theme.palette.primary.light,
								color: '#fff',
								fontWeight: 500,
								fontFamily: 'Varela Round',
								borderRadius: '0.35rem',
								fontSize: '0.7rem',
							}}
						/>
					))}
				</Stack>

				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: { xs: 0.25, sm: 0.25 },
						mt: 'auto',
						mb: '-1.25rem',
						mr: '-1.25rem',
						position: 'absolute',
						bottom: '1.5rem',
						right: '1.5rem',
					}}>
					<IconButton
						href={formatUrl(instructor.linkedInUrl)}
						target='_blank'
						sx={{
							'color': theme.palette.primary.main,
							'&:hover': { backgroundColor: theme.palette.primary.light, color: '#fff' },
						}}>
						<LinkedIn fontSize='small' />
					</IconButton>

					<IconButton
						href={formatUrl(instructor.website)}
						target='_blank'
						sx={{
							'color': theme.palette.primary.main,
							'&:hover': { backgroundColor: theme.palette.primary.light, color: '#fff' },
						}}>
						<Language fontSize='small' />
					</IconButton>
				</Box>
			</CardContent>
		</Card>
	);
};

const LandingPageCourse = () => {
	const { courseId } = useParams();
	const { courses, loading, error } = useContext(AllPublicCoursesContext);

	const [course, setCourse] = useState<SingleCourse>();

	useEffect(() => {
		if (courseId && courses) {
			const selectedCourse = courses?.find((course: SingleCourse) => course._id === courseId);
			setCourse(selectedCourse);
		}
	}, [courseId, courses]);

	// Helper function to truncate description to 150 characters
	const getTruncatedDescription = (description: string): string => {
		if (!description) return 'Explore this comprehensive online course on LearnScape. Learn from expert instructors and enhance your skills.';
		return description.length > 150 ? `${description.substring(0, 150).trim()}...` : description;
	};

	// Build keywords from available course data
	const getKeywords = (course: SingleCourse): string => {
		const keywords: string[] = [course.title];

		// Add instructor name
		if (course.instructor?.name) {
			keywords.push(course.instructor.name);
		}

		// Add instructor expertise/tags
		if (course.instructor?.expertise && course.instructor.expertise.length > 0) {
			keywords.push(...course.instructor.expertise);
		}

		// Add words from description (first 5-6 words)
		if (course.description) {
			const descWords = course.description
				.split(/\s+/)
				.slice(0, 6)
				.filter((w) => w.length > 3);
			keywords.push(...descWords);
		}

		return keywords.join(', ');
	};

	// Calculate if course is free
	const isCourseFree = course?.prices && course.prices.every((price) => price.amount === '0' || price.amount === 'Free' || price.amount === '');

	// Generate course URL (using title encoding since slug is not available)
	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://learnscape-qa.netlify.app';
	const courseUrl = course ? `${baseUrl}/landing-page-course/${encodeURIComponent(course.title)}/${course._id}` : '';

	// Get truncated description for SEO and StructuredData
	const seoDescription = course ? getTruncatedDescription(course.description) : '';
	const courseKeywords = course ? getKeywords(course) : '';

	return (
		<>
			{!loading && !error && course && (
				<>
					<SEO
						title={`${course.title} | LearnScape`}
						description={seoDescription}
						keywords={courseKeywords}
						image={course.imageUrl}
						url={courseUrl}
						type='article'
						author={course.instructor.name}
						publishedTime={course.createdAt}
						modifiedTime={course.updatedAt}
					/>
					<StructuredData type='Organization' />
					<StructuredData
						type='Course'
						data={{
							title: course.title,
							description: seoDescription,
							image: course.imageUrl,
							url: courseUrl,
							// courseCode: course.courseCode, // Not available in current model
							level: 'Beginner', // Default level since not in model (would use course.level if available)
							isFree: isCourseFree,
							createdAt: course.createdAt,
							updatedAt: course.updatedAt,
							instructor: course.instructor.name,
						}}
					/>
					<StructuredData
						type='BreadcrumbList'
						data={{
							breadcrumbs: [
								{ name: 'Home', url: baseUrl },
								{ name: 'All Courses', url: `${baseUrl}/landing-page-courses` },
								{ name: course.title, url: courseUrl },
							],
						}}
					/>
					<StructuredData
						type='WebPage'
						data={{
							url: courseUrl,
							name: course.title,
							description: seoDescription,
							datePublished: course.createdAt,
							dateModified: course.updatedAt,
						}}
					/>
				</>
			)}
			<Box
				sx={{
					'position': 'relative',
					'overflow': 'hidden',
					'minHeight': '100vh',
					// Fixed background image - London cityscape
					'backgroundImage': `url(${LondonBg})`,
					'backgroundSize': 'cover',
					'backgroundPosition': 'center',
					'backgroundRepeat': 'no-repeat',
					'backgroundAttachment': 'fixed',
					// Overlay for better content readability
					'&::before': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					// Subtle gradient accent overlay
					'&::after': {
						content: '""',
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							'radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
						zIndex: 0,
						pointerEvents: 'none',
					},
					'& h1, h2, h3, h4, h5, h6': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 500,
					},
					'& button': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 400,
					},
					'& .gradient-text': {
						'background': 'linear-gradient(135deg, #4f46e5 0%, #5b21b6 50%, #7c3aed 100%)',
						'WebkitBackgroundClip': 'text',
						'WebkitTextFillColor': 'transparent',
						'backgroundClip': 'text',
						'backgroundSize': '200% 200%',
						'animation': 'gradientShift 6s ease infinite',
						'@keyframes gradientShift': {
							'0%': { backgroundPosition: '0% 50%' },
							'50%': { backgroundPosition: '100% 50%' },
							'100%': { backgroundPosition: '0% 50%' },
						},
					},
					'& .accent-color': {
						color: '#1e293b',
					},
					'& .secondary-color': {
						color: '#6366f1',
					},
					'& .tertiary-color': {
						color: '#64748b',
					},
					'& .kaizen-title': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 600,
					},
				}}>
				<Box sx={{ position: 'relative', zIndex: 2 }}>
					<LandingPageLayout>
						{!loading && !error && course && (
							<Box
								sx={{
									display: 'flex',
									flexDirection: { xs: 'column', sm: 'column', md: 'row' },
									justifyContent: 'center',
									alignItems: 'center',
									width: '100%',
									paddingTop: '13vh',
									gap: '2rem',
									flexWrap: { xs: 'wrap', md: 'nowrap' },
								}}>
								<CoursePageBanner course={course} fromHomePage={true} />
								<InstructorCard instructor={course.instructor} />
							</Box>
						)}

						{!loading && !error && !course && (
							<Box sx={{ paddingTop: '25vh', textAlign: 'center' }}>
								<Typography variant='h6' sx={{ fontFamily: 'Varela Round' }}>
									Kurs bulunamadı
								</Typography>
							</Box>
						)}
						<Box sx={{ margin: '1rem 0 3rem 0' }}>
							<ChatWhatsApp />
							<ScrollToTopButton />
						</Box>
					</LandingPageLayout>
				</Box>
			</Box>
		</>
	);
};

export default LandingPageCourse;
