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
				backgroundColor: '#FDF7F0',
				backgroundImage: `
					linear-gradient(135deg, rgba(44, 62, 80, 0.05), rgba(52, 152, 219, 0.05)),
					radial-gradient(circle, rgba(44,62,80,0.08) 1px, transparent 1px)
				`,
				backgroundSize: 'auto, 30px 30px',
				backgroundRepeat: 'repeat, repeat',
				minHeight: '100vh',
				position: 'relative',
			}}>
			<Header />
			<Box sx={{ flexGrow: 1 }}>{children}</Box>
			<Footer />
		</Box>
	);
};

export default LandingPageLayout;
