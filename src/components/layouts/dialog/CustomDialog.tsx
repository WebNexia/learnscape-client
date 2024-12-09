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
	const { isRotatedMedium, isVerySmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isVerySmallScreen || isRotatedMedium;
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
			<DialogTitle variant={isMobileSize ? 'h6' : 'h5'} sx={{ marginBottom: '-1rem', paddingTop: '2rem', ...titleSx }}>
				{title}
			</DialogTitle>
			{content && (
				<DialogContent>
					<Typography variant='body2'>{content}</Typography>
				</DialogContent>
			)}
			{children}
		</Dialog>
	);
};

export default CustomDialog;
