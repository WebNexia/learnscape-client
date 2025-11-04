import 'react-phone-input-2/lib/material.css';
import { useRef } from 'react';
import { Box } from '@mui/material';
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
					'& h1, h2, h3, h4, h5, h6': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 500,
					},
					'& button': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 400,
					},
					'& .gradient-text': {
						background: 'linear-gradient(45deg, #2C3E50, #3498DB)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						backgroundClip: 'text',
					},
					'& .accent-color': {
						color: '#2C3E50',
					},
					'& .secondary-color': {
						color: '#3498DB',
					},
					'& .tertiary-color': {
						color: '#95A5A6',
					},
					'& .kaizen-title': {
						fontFamily: "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important",
						fontWeight: 600,
					},
				}}>
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
		</>
	);
};

export default LandingPage;
