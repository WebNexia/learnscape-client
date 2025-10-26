import React, { useContext } from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';

interface TabOption {
	value: string;
	label: string;
}

interface StickyTabLayoutProps {
	// Tab functionality
	activeTab: string;
	onTabChange: (event: React.SyntheticEvent, newValue: string) => void;
	tabs: TabOption[];

	// Content
	children: React.ReactNode;

	// Sticky functionality
	isSticky?: boolean;
}

const StickyTabLayout: React.FC<StickyTabLayoutProps> = ({ activeTab, onTabChange, tabs, children, isSticky = true }) => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<>
			{/* Sticky Tabs */}
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'center',
					position: isSticky ? 'fixed' : 'relative',
					top: isMobileSize ? '3.5rem' : '4rem', // Account for DashboardHeader height
					left: isSticky ? (isMobileSize ? 0 : '10rem') : 'auto', // Account for sidebar width on desktop
					right: isSticky ? 0 : 'auto',
					zIndex: isSticky ? 100 : 'auto', // Higher z-index to ensure it's above all content
					backgroundColor: theme.bgColor?.secondary,
					backdropFilter: isSticky ? 'blur(10px)' : 'none',
					width: isSticky ? (isMobileSize ? '100%' : 'calc(100% - 10rem)') : '100%',
				}}>
				<Tabs
					value={activeTab}
					onChange={onTabChange}
					textColor='primary'
					indicatorColor='secondary'
					sx={{
						'paddingTop': isMobileSize ? '0.25rem' : '0.25rem',
						'paddingLeft': isMobileSize ? '1rem' : '2rem',
						'paddingRight': isMobileSize ? '1rem' : '2rem',
						'& .MuiTabs-indicator': {
							backgroundColor: theme.bgColor?.adminHeader,
						},
					}}>
					{tabs.map((tab) => (
						<Tab
							key={tab.value}
							value={tab.value}
							label={tab.label}
							sx={{
								'&.Mui-selected': { color: theme.bgColor?.adminHeader },
								'textTransform': 'capitalize',
								'fontFamily': 'Poppins',
								'fontSize': isMobileSize ? '0.75rem' : undefined,
								'&.MuiTab-root': { textTransform: 'capitalize' },
							}}
						/>
					))}
				</Tabs>
			</Box>

			{/* Spacer to push content down when sticky */}
			{isSticky && (
				<Box
					sx={{
						height: '5rem', // Account for tabs height
						width: '100%',
					}}
				/>
			)}

			{/* Content */}
			<Box sx={{ padding: '0rem', width: '100%' }}>{children}</Box>
		</>
	);
};

export default StickyTabLayout;
