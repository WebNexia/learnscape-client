import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import { ReactNode, RefObject } from 'react';

interface LandingPageLayoutProps {
	children: ReactNode;
	coursesRef?: RefObject<HTMLDivElement>;
}

const LandingPageLayout = ({ children }: LandingPageLayoutProps) => {
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: 'transparent',
				minHeight: '100vh',
				position: 'relative',
				zIndex: 1,
			}}>
			<Header />
			<Box sx={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>{children}</Box>
			<Footer />
		</Box>
	);
};

export default LandingPageLayout;
