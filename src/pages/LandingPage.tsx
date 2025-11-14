import 'react-phone-input-2/lib/material.css';
import { useRef } from 'react';
import { Box } from '@mui/material';
import LondonBg from '../assets/london-bg.jpg';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import FeaturesSection from '../components/landingPage/FeaturesSection';
import LandingPageLatestCourses from '../components/landingPage/LandingPageLatestCourses';
import TestimonialsSection from '../components/landingPage/TestimonialsSection';
import CTASection from '../components/landingPage/CTASection';
import HeroSection from '../components/landingPage/HeroSection';
import StatisticsSection from '../components/landingPage/StatisticsSection';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import UpcomingEvents from '../components/landingPage/UpcomingEvents';
import LandingPageFAQ from '../components/landingPage/LandingPageFAQ';
import { SEO, StructuredData } from '../components/seo';

const LandingPage = () => {
	const coursesRef = useRef<HTMLDivElement>(null);
	const baseUrl = import.meta.env.VITE_SITE_URL || 'https://learnscape-qa.netlify.app';

	return (
		<>
			<SEO
				title='LearnScape - Online Learning Platform | Courses & Education'
				description='Discover thousands of online courses, interactive quizzes, and educational content. Join LearnScape for the best e-learning experience with expert instructors and comprehensive learning materials.'
				keywords='online learning, e-learning, education platform, interactive learning, LearnScape, online courses, educational content, learning management system, student portal, course platform'
				type='website'
			/>
			<StructuredData type='Organization' />
			<StructuredData type='WebSite' />
			<StructuredData type='BreadcrumbList' data={{ breadcrumbs: [{ name: 'Home', url: baseUrl }] }} />
			<StructuredData
				type='WebPage'
				data={{
					url: baseUrl,
					name: 'LearnScape - Online Learning Platform',
					description:
						'Discover thousands of online courses, interactive quizzes, and educational content. Join LearnScape for the best e-learning experience with expert instructors and comprehensive learning materials.',
				}}
			/>
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
					<LandingPageLayout coursesRef={coursesRef}>
						<HeroSection />
						<FeaturesSection />
						<StatisticsSection />
						<TestimonialsSection />
						<LandingPageLatestCourses ref={coursesRef} />
						<UpcomingEvents />
						<LandingPageFAQ />
						<CTASection coursesRef={coursesRef} />
					</LandingPageLayout>
					<ScrollToTopButton />
				</Box>
			</Box>
		</>
	);
};

export default LandingPage;
