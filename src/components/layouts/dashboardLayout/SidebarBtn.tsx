import { Button, Badge } from '@mui/material';
import theme from '../../../themes';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../interfaces/enums';

interface SidebarBtnProps {
	btnText?: string;
	onClick?: () => void;
	IconName: React.ElementType;
	active?: boolean;
	hasUnreadMessages?: boolean;
}

const SidebarBtn = ({ btnText, onClick, IconName, active, hasUnreadMessages }: SidebarBtnProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const { user } = useContext(UserAuthContext);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	const isLearner = user?.role === Roles.USER;

	// Get role-specific hover color
	const getHoverColor = () => {
		if (user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN) {
			return theme.bgColor?.adminSubmitBtn;
		} else {
			return theme.submitBtn?.backgroundColor; // Green for instructor
		}
	};

	const btnTextChars: string[] | undefined = btnText?.split('');
	let subPageText = '';

	if (
		btnTextChars && btnTextChars && btnTextChars.length > 0 && btnTextChars && btnTextChars.length > 0
			? btnTextChars[btnTextChars.length - 1]
			: undefined === 's'
	) {
		btnTextChars?.pop();
		subPageText = btnTextChars?.join('') || '';
	}

	return (
		<Button
			variant='outlined'
			startIcon={
				<Badge color='error' variant='dot' invisible={!hasUnreadMessages}>
					<IconName />
				</Badge>
			}
			sx={{
				'color': isLearner
					? active
						? theme.bgColor?.learnerSidebar
						: theme.bgColor?.learnerSidebarText
					: active
						? theme.textColor?.primary.main
						: theme.textColor?.common.main,
				'backgroundColor': active
					? isLearner
						? theme.bgColor?.learnerSidebarActive
						: theme.palette.secondary.main
					: 'transparent',
				'textTransform': 'capitalize',
				'marginBottom': isLearner ? '0.35rem' : '0.15rem',
				'fontFamily': theme.fontFamily?.main,
				'fontWeight': isLearner && active ? 600 : 500,
				'fontSize': isLearner ? (isMobileSize ? '0.75rem' : '1rem') : isMobileSize ? '0.75rem' : '1rem',
				'lineHeight': isLearner ? 1.5 : '2.25',
				'minHeight': isLearner ? (isMobileSize ? '2.35rem' : '2.65rem') : undefined,
				'width': isMobileSize ? 'calc(100% - 1rem)' : 'calc(100% - 1.25rem)',
				'justifyContent': 'flex-start',
				'paddingLeft': '0.85rem',
				'paddingRight': '0.75rem',
				'borderRadius': isLearner ? '2rem 0 0 2rem' : '1.5rem 0 0 1.5rem',
				'marginLeft': isMobileSize ? '1rem' : '1.25rem',
				'marginRight': 0,
				'border': 'none',
				'boxShadow': 'none',
				'cursor': 'pointer',
				'whiteSpace': 'nowrap',
				'overflow': 'hidden',
				'& .MuiButton-startIcon': {
					marginRight: isLearner ? '0.5rem' : undefined,
					color: 'inherit',
				},
				'&:hover': isLearner
					? {
						color: active ? theme.bgColor?.learnerSidebar : theme.bgColor?.learnerSidebarText,
						backgroundColor: active ? theme.bgColor?.learnerSidebarActive : theme.bgColor?.learnerSidebarHover,
						border: 'none',
					}
					: {
						color: active ? theme.textColor?.primary.main : getHoverColor(),
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
