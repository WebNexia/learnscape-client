import { Button } from '@mui/material';
import theme from '../../../themes';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface SidebarBtnProps {
	btnText?: string;
	onClick?: () => void;
	IconName: React.ElementType;
	active?: boolean;
}

const SidebarBtn = ({ btnText, onClick, IconName, active }: SidebarBtnProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	const btnTextChars: string[] | undefined = btnText?.split('');
	let subPageText = '';

	if (btnTextChars && btnTextChars && btnTextChars.length > 0 && btnTextChars && btnTextChars.length > 0 ? btnTextChars[btnTextChars.length - 1] : undefined === 's') {
		btnTextChars?.pop();
		subPageText = btnTextChars?.join('') || '';
	}

	return (
		<Button
			variant='outlined'
			startIcon={<IconName />}
			sx={{
				'color': active ? theme.textColor?.primary.main : theme.textColor?.common.main,
				'backgroundColor': active ? theme.palette.secondary.main : 'transparent',
				'textTransform': 'capitalize',
				'marginBottom': '0.15rem',
				'fontFamily': theme.fontFamily?.main,
				'fontSize': isMobileSize ? '0.75rem' : '1rem',
				'lineHeight': '2.25',
				'width': isMobileSize ? '72%' : '76%',
				'justifyContent': 'flex-start',
				'paddingRight': '1.5rem',
				'borderRadius': '1.5rem 0 0 1.5rem',
				'marginLeft': '1.85rem',
				'border': 'none',
				'cursor': 'pointer',
				'&:hover': {
					color: active ? theme.textColor?.primary.main : theme.submitBtn?.backgroundColor,
					backgroundColor: active ? theme.palette.secondary.main : 'transparent',
					border: 'none',
				},
			}}
			onClick={onClick}>
			{btnText}
		</Button>
	);
};

export default SidebarBtn;
