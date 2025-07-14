import React, { useState } from 'react';
import { Fab, Tooltip } from '@mui/material';
import { BugReport as BugReportIcon } from '@mui/icons-material';
import ReportBugDialog from './ReportBugDialog';

const ReportBugButton: React.FC = () => {
	const [dialogOpen, setDialogOpen] = useState(false);

	const handleOpenDialog = () => {
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
	};

	return (
		<>
			<Tooltip
				title='Hata Bildir'
				placement='left'
				arrow
				componentsProps={{
					tooltip: {
						sx: {
							fontFamily: 'Varela Round',
							fontSize: '0.85rem',
						},
					},
				}}>
				<Fab
					color='primary'
					aria-label='report bug'
					onClick={handleOpenDialog}
					sx={{
						'width': { xs: '2.25rem', sm: '2.5rem', md: '2.5rem' },
						'height': { xs: '2.25rem', sm: '2.5rem', md: '2.5rem' },
						'position': 'fixed',
						'bottom': { xs: '5rem', sm: '5rem', md: '6.75rem' }, // Above WhatsApp button
						'right': { xs: '0.95rem', sm: '1.5rem', md: '2.75rem' },
						'zIndex': 1000,
						'backgroundColor': '#d32f2f',
						'&:hover': {
							background: 'darkorange',
						},
					}}>
					<BugReportIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }} />
				</Fab>
			</Tooltip>

			<ReportBugDialog open={dialogOpen} onClose={handleCloseDialog} />
		</>
	);
};

export default ReportBugButton;
