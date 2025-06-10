import { useEffect, useState } from 'react';
import { Fab, Zoom } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface ScrollToTopButtonProps {
	bottom?: { xs?: string | number; sm?: string | number; md?: string | number };
	left?: { xs?: string | number; sm?: string | number; md?: string | number };
	backgroundColor?: string;
	color?: string;
}

const ScrollToTopButton = ({
	bottom = { xs: '1.25rem', sm: '1rem', md: '2.5rem' },
	left = { xs: '0.5rem', sm: '1rem', md: '1.5rem' },
	backgroundColor = '#3498DB',
	color = '#fff',
}: ScrollToTopButtonProps) => {
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
					bottom,
					left,
					backgroundColor,
					color,
					'&:hover': {
						backgroundColor: '#2980B9',
						transform: 'translateY(-2px)',
						boxShadow: '0 4px 12px rgba(44, 62, 80, 0.1)',
					},
					'zIndex': 1000,
					'transition': 'all 0.3s ease',
					'width': { xs: '2.25rem', sm: '2rem', md: '2.5rem' },
					'height': { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
					'borderRadius': '50%',
				}}>
				<KeyboardArrowUpIcon sx={{ fontSize: '1.75rem' }} />
			</Fab>
		</Zoom>
	);
};

export default ScrollToTopButton;
