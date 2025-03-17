import 'react-phone-input-2/lib/material.css';
import LandingPageCourses from '../components/landingPage/LandingPageCourses';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import LandingPageBanner from '../components/landingPage/LandingPageBanner';
import { useRef } from 'react';

const LandingPage = () => {
	const coursesRef = useRef<HTMLDivElement>(null);
	return (
		<LandingPageLayout coursesRef={coursesRef}>
			<LandingPageBanner />
			<LandingPageCourses ref={coursesRef} />
		</LandingPageLayout>
	);
};

export default LandingPage;
