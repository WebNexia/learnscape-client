import { useState, useEffect, useRef } from 'react';

export const useStickyPaper = (isMobileSize: boolean = false) => {
	const [isSticky, setIsSticky] = useState(isMobileSize);
	const paperRef = useRef<HTMLDivElement>(null);
	const originalTopRef = useRef<number>(0);

	useEffect(() => {
		// If mobile size, always keep sticky
		if (isMobileSize) {
			setIsSticky(true);
			return;
		}

		const handleScroll = () => {
			if (!paperRef.current) return;

			const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

			// Get the original position on first scroll
			if (originalTopRef.current === 0) {
				const rect = paperRef.current.getBoundingClientRect();
				originalTopRef.current = rect.top + scrollTop;
			}

			// Check if we've scrolled past the original position
			if (scrollTop > originalTopRef.current) {
				setIsSticky(true);
			} else {
				setIsSticky(false);
			}
		};

		// Reset original position when component mounts
		const resetPosition = () => {
			originalTopRef.current = 0;
			if (paperRef.current) {
				const rect = paperRef.current.getBoundingClientRect();
				originalTopRef.current = rect.top + (window.pageYOffset || document.documentElement.scrollTop);
			}
		};

		// Set initial position after a short delay to ensure proper calculation
		const timer = setTimeout(resetPosition, 100);

		window.addEventListener('scroll', handleScroll);
		window.addEventListener('resize', resetPosition);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', resetPosition);
			clearTimeout(timer);
		};
	}, [isMobileSize]);

	return { isSticky, paperRef };
};
