import { Box, Typography } from '@mui/material';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
import theme from '../../../themes';
import { ReactNode, useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface DashboardPagesLayoutProps {
	children: ReactNode;
	pageName: string;
	customSettings?: {
		justifyContent?: string;
		alignItems?: string;
		flexDirection?: string;
	};
	showCopyRight?: boolean;
}

const DashboardPagesLayout = ({ children, pageName, customSettings, showCopyRight }: DashboardPagesLayoutProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	return (
		<Box
			sx={{
				display: 'flex',
				minHeight: '100vh',
				position: 'relative',
			}}>
			{!isSmallScreen && !isRotatedMedium && <Sidebar />}
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					minHeight: '100vh',
					width: isSmallScreen || isRotatedMedium ? '100%' : 'calc(100% - 10rem)',
					marginLeft: '10rem',
					position: 'absolute',
					right: 0,
				}}>
				<DashboardHeader pageName={pageName} />
				<Box
					sx={{
						display: 'flex',
						flexDirection: customSettings?.flexDirection || 'column',
						justifyContent: customSettings?.justifyContent || 'center',
						alignItems: customSettings?.alignItems || 'center',
						minHeight: 'calc(100vh - 4rem)',
						backgroundColor: theme.palette.secondary.main,
						overflowY: 'auto',
						position: 'relative',
					}}>
					{children}

					{showCopyRight && (
						<Typography
							sx={{
								fontSize: isSmallScreen ? '0.55rem' : '0.65rem',
								position: 'absolute',
								bottom: 3,
							}}>
							&copy; {new Date().getFullYear()} Webnexia Software Solutions Ltd. All rights reserved.
						</Typography>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default DashboardPagesLayout;
