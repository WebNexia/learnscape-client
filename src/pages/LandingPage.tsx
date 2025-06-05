import 'react-phone-input-2/lib/material.css';
import { useRef, useState, useEffect } from 'react';
import { Box, Fab, Zoom } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import FeaturesSection from '../components/landingPage/FeaturesSection';
import LandingPageCourses from '../components/landingPage/LandingPageCourses';
import TestimonialsSection from '../components/landingPage/TestimonialsSection';
import CTASection from '../components/landingPage/CTASection';
import HeroSection from '../components/landingPage/HeroSection';
import StatisticsSection from '../components/landingPage/StatisticsSection';

const ScrollToTop = () => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const toggleVisibility = () => {
			if (window.pageYOffset > 300) {
				setIsVisible(true);
			} else {
				setIsVisible(false);
			}
		};

		window.addEventListener('scroll', toggleVisibility);
		return () => window.removeEventListener('scroll', toggleVisibility);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	return (
		<Zoom in={isVisible}>
			<Fab
				size='small'
				onClick={scrollToTop}
				sx={{
					'position': 'fixed',
					'bottom': 35,
					'left': 20,
					'backgroundColor': '#3498DB',
					'color': '#fff',
					'&:hover': {
						backgroundColor: '#2980B9',
						transform: 'translateY(-2px)',
						boxShadow: '0 4px 12px rgba(44, 62, 80, 0.1)',
					},
					'zIndex': 1000,
					'transition': 'all 0.3s ease',
					'width': '40px',
					'height': '40px',
				}}>
				<KeyboardArrowUpIcon />
			</Fab>
		</Zoom>
	);
};

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
				<FeaturesSection />
				<LandingPageCourses ref={coursesRef} />
				<StatisticsSection />
				<TestimonialsSection />
				<CTASection coursesRef={coursesRef} />
			</LandingPageLayout>
			<ScrollToTop />
		</Box>
	);
};

export default LandingPage;
