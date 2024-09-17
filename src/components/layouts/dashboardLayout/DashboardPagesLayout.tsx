import { Box } from '@mui/material';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
import theme from '../../../themes';
import { ReactNode } from 'react';

interface DashboardPagesLayoutProps {
	children: ReactNode;
	pageName: string;
	customSettings?: {
		justifyContent?: string;
		alignItems?: string;
		flexDirection?: string;
	};
}

const DashboardPagesLayout = ({ children, pageName, customSettings }: DashboardPagesLayoutProps) => {
	return (
		<Box
			sx={{
				display: 'flex',
				minHeight: '100vh',
				position: 'relative',
			}}>
			<Sidebar />
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					minHeight: '100vh',
					width: 'calc(100% - 10rem)',
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
					}}>
					{children}
				</Box>
			</Box>
		</Box>
	);
};

export default DashboardPagesLayout;
