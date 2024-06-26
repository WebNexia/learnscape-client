import { Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';
import theme from '../../../themes';
import { ReactNode } from 'react';

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
			<DialogTitle variant='h3' sx={{ paddingTop: '2rem', ...titleSx }}>
				{title}
			</DialogTitle>
			{content && (
				<DialogContent>
					<Typography>{content}</Typography>
				</DialogContent>
			)}
			{children}
		</Dialog>
	);
};

export default CustomDialog;
