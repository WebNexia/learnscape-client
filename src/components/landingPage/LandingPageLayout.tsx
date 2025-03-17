import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import { ReactNode, RefObject, useRef } from 'react';

interface LandingPageLayoutProps {
	children: ReactNode;
	coursesRef?: RefObject<HTMLDivElement>;
}

const LandingPageLayout = ({ children, coursesRef }: LandingPageLayoutProps) => {
	const defaultRef = useRef<HTMLDivElement>(null);
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: '#FDF7F0',
				minHeight: '100vh',
				position: 'relative',
			}}>
			<Header coursesRef={coursesRef ?? defaultRef} />
			<Box sx={{ flexGrow: 1 }}>{children}</Box>
			<Footer />
		</Box>
	);
};

export default LandingPageLayout;
