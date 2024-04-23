import { Button } from '@mui/material';
import theme from '../../../themes';

interface SidebarBtnProps {
	btnText: string;
	onClick: () => void;
	IconName: React.ElementType;
	selectedPage: string;
}

const SidebarBtn = ({ btnText, onClick, IconName, selectedPage }: SidebarBtnProps) => {
	return (
		<Button
			variant='outlined'
			startIcon={<IconName />}
			sx={{
				color: selectedPage === btnText ? theme.textColor?.primary.main : theme.textColor?.common.main,
				backgroundColor: selectedPage === btnText ? theme.palette.secondary.main : 'transparent',
				textTransform: 'capitalize',
				marginBottom: '0.35rem',
				fontFamily: theme.fontFamily?.main,
				fontSize: '1rem',
				lineHeight: '2.5',
				width: '100%',
				justifyContent: 'flex-start',
				paddingRight: '1.5rem',
				borderRadius: '1.5rem 0 0 1.5rem',
				marginLeft: '1.75rem',
				border: 'none',
				':hover': {
					color: selectedPage !== btnText ? theme.submitBtn?.backgroundColor : theme.textColor?.primary.main,
					backgroundColor: selectedPage === btnText ? theme.palette.secondary.main : 'transparent',
					border: 'none',
				},
			}}
			onClick={onClick}>
			{btnText}
		</Button>
	);
};

export default SidebarBtn;
