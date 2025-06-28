import 'react-phone-input-2/lib/material.css';
import { useRef } from 'react';
import { Box } from '@mui/material';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import FeaturesSection from '../components/landingPage/FeaturesSection';
import LandingPageCourses from '../components/landingPage/LandingPageCourses';
import TestimonialsSection from '../components/landingPage/TestimonialsSection';
import CTASection from '../components/landingPage/CTASection';
import HeroSection from '../components/landingPage/HeroSection';
import StatisticsSection from '../components/landingPage/StatisticsSection';
import ScrollToTopButton from '../components/landingPage/ScrollToTopButton';
import UpcomingEvents from '../components/landingPage/UpcomingEvents';

const LandingPage = () => {
	const coursesRef = useRef<HTMLDivElement>(null);

	return (
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
				<UpcomingEvents />
				<FeaturesSection />
				<LandingPageCourses ref={coursesRef} />
				<StatisticsSection />
				<TestimonialsSection />
				<CTASection coursesRef={coursesRef} />
			</LandingPageLayout>
			<ScrollToTopButton />
		</Box>
	);
};

export default LandingPage;
