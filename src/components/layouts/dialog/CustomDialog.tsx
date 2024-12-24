import { Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';
import theme from '../../../themes';
import { ReactNode, useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CustomDialogProps {
	children?: ReactNode;
	openModal?: boolean;
	closeModal?: () => void;
	title?: string;
	titleSx?: object;
	dialogPaperSx?: object;
	content?: string;
	maxWidth?: 'md' | 'sm' | 'lg';
}

const CustomDialog = ({ children, openModal = false, closeModal, title, titleSx, content, dialogPaperSx, maxWidth = 'md' }: CustomDialogProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;
	return (
		<Dialog
			open={openModal}
			onClose={closeModal}
			fullWidth
			maxWidth={maxWidth}
			PaperProps={{
				style: {
					backgroundColor: theme.palette.secondary.main,
				},
			}}
			sx={{ ...dialogPaperSx }}>
			<DialogTitle
				variant={isMobileSize ? 'h6' : 'h5'}
				sx={{
					marginBottom: isMobileSize ? '-0.5rem' : '0rem',
					paddingTop: isMobileSize ? '1rem' : '2rem',
					...titleSx,
					fontSize: isMobileSize ? '0.9rem' : undefined,
				}}>
				{title}
			</DialogTitle>
			{content && (
				<DialogContent>
					<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						{content}
					</Typography>
				</DialogContent>
			)}
			{children}
		</Dialog>
	);
};

export default CustomDialog;
