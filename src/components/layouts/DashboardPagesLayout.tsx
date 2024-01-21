import { Box } from '@mui/material';
import DashboardHeader from '../DashboardHeader';
import Sidebar from '../Sidebar';
import theme from '../../themes';
import { ReactNode } from 'react';

interface DashboardPagesLayoutProps {
	children: ReactNode;
	pageName: string;
}

const DashboardPagesLayout = ({ children, pageName }: DashboardPagesLayoutProps) => {
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: theme.palette.secondary.main,
				minHeight: '100vh',
				position: 'relative',
			}}>
			<Sidebar />
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					minHeight: '100vh',
					width: 'calc(100vw - 10rem)',
					position: 'absolute',
					right: 0,
				}}>
				<DashboardHeader pageName={pageName} />
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						minHeight: 'calc(100vh - 3rem)',
					}}>
					{children}
				</Box>
			</Box>
		</div>
	);
};

export default DashboardPagesLayout;
