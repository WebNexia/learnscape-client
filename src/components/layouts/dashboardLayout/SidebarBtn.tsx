import { Button } from '@mui/material';
import theme from '../../../themes';

interface SidebarBtnProps {
	btnText?: string;
	onClick?: () => void;
	IconName: React.ElementType;
	selectedPage?: string;
}

const SidebarBtn = ({ btnText, onClick, IconName, selectedPage }: SidebarBtnProps) => {
	const btnTextChars: string[] | undefined = btnText?.split('');
	let subPageText = '';

	if (btnTextChars && btnTextChars[btnTextChars.length - 1] === 's') {
		btnTextChars.pop();
		subPageText = btnTextChars.join('');
	}

	const isEditPage: boolean = selectedPage === `${subPageText}-edit`;

	return (
		<Button
			variant='outlined'
			startIcon={<IconName />}
			sx={{
				color: selectedPage === btnText || isEditPage ? theme.textColor?.primary.main : theme.textColor?.common.main,
				backgroundColor: selectedPage === btnText || isEditPage ? theme.palette.secondary.main : 'transparent',
				textTransform: 'capitalize',
				marginBottom: '0.15rem',
				fontFamily: theme.fontFamily?.main,
				fontSize: '1rem',
				lineHeight: '2.25',
				width: '77%',
				justifyContent: 'flex-start',
				paddingRight: '1.5rem',
				borderRadius: '1.5rem 0 0 1.5rem',
				marginLeft: '1.85rem',
				border: 'none',
				cursor: 'pointer',
				'&:hover': {
					color: selectedPage !== btnText && !isEditPage ? theme.submitBtn?.backgroundColor : theme.textColor?.primary.main,
					backgroundColor: selectedPage === btnText || isEditPage ? theme.palette.secondary.main : 'transparent',
					border: 'none',
				},
			}}
			onClick={onClick}>
			{btnText}
		</Button>
	);
};

export default SidebarBtn;
