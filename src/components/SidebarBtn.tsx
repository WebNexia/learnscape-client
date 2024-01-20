import { Button } from '@mui/material';
import theme from '../themes';

interface SidebarBtnProps {
	btnText: string;
	onClick: () => void;
	IconName: React.ElementType;
}

const SidebarBtn = ({ btnText, onClick, IconName }: SidebarBtnProps) => {
	return (
		<Button
			variant='outlined'
			startIcon={<IconName />}
			sx={{
				color: theme.textColor?.common.main,
				textTransform: 'capitalize',
				marginBottom: '0.35rem',
				fontFamily: theme.fontFamily?.main,
			}}
			onClick={onClick}>
			{btnText}
		</Button>
	);
};

export default SidebarBtn;
