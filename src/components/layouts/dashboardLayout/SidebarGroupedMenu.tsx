import { Box, Button, Popper, Paper, ClickAwayListener } from '@mui/material';
import theme from '../../../themes';
import { useContext, useState, useRef, useEffect } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';
import { UserAuthContext } from '../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../interfaces/enums';
import { useAuth } from '../../../hooks/useAuth';
import { ChevronRight } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';

interface SubMenuItem {
	btnText: string;
	IconName: React.ElementType;
	path: string;
	isActive: boolean;
}

interface SidebarGroupedMenuProps {
	mainBtnText: string;
	mainIconName: React.ElementType;
	mainPath: string;
	mainIsActive: boolean;
	subMenuItems: SubMenuItem[];
	onNavigate: (path: string) => void;
}

const SidebarGroupedMenu = ({
	mainBtnText,
	mainIconName: MainIconName,
	mainPath,
	mainIsActive,
	subMenuItems,
	onNavigate,
}: SidebarGroupedMenuProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const { user } = useContext(UserAuthContext);
	const { hasAdminAccess } = useAuth();
	const location = useLocation();
	const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
	const anchorRef = useRef<HTMLButtonElement>(null);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;


	useEffect(() => {
		setIsSubMenuOpen(false);
	}, [location.pathname]);

	// Get role-specific hover color
	const getHoverColor = () => {
		if (user?.role === Roles.ADMIN || user?.role === Roles.OWNER || user?.role === Roles.SUPER_ADMIN) {
			return theme.bgColor?.adminSubmitBtn;
		} else {
			return theme.submitBtn?.backgroundColor;
		}
	};

	const handleMainClick = () => {
		if (isMobileSize) {
			// On mobile: tap opens/closes submenu instead of navigating
			setIsSubMenuOpen((prev) => !prev);
		} else {
			// On desktop: click navigates to main path
			onNavigate(mainPath);
			setIsSubMenuOpen(false);
		}
	};

	const handleSubItemClick = (path: string) => {
		// Close submenu immediately before navigation to prevent green box flash
		setIsSubMenuOpen(false);
		// Use setTimeout to ensure state update happens before navigation
		setTimeout(() => {
			onNavigate(path);
		}, 0);
	};

	const handleOpenSubMenu = () => {
		// On mobile, submenu is opened by tap only (handleMainClick toggle)
		if (!isMobileSize) setIsSubMenuOpen(true);
	};

	const handleCloseSubMenu = () => {
		setIsSubMenuOpen(false);
	};

	return (
		<>
			<Button
				ref={anchorRef}
				variant='outlined'
				startIcon={<MainIconName />}
				endIcon={<ChevronRight sx={{ fontSize: isMobileSize ? '0.875rem' : '1rem' }} />}
				sx={{
					'color': mainIsActive ? theme.textColor?.primary.main : theme.textColor?.common.main,
					'backgroundColor': mainIsActive ? theme.palette.secondary.main : 'transparent',
					'textTransform': 'capitalize',
					'marginBottom': '0.15rem',
					'fontFamily': theme.fontFamily?.main,
					'fontSize': isMobileSize ? '0.75rem' : '0.85rem',
					'lineHeight': '2.25',
					'width': isMobileSize ? 'calc(100% - 1rem)' : 'calc(100% - 1.25rem)',
					'justifyContent': 'flex-start',
					'paddingLeft': '0.85rem',
					'paddingRight': '0.75rem',
					'borderRadius': '1.5rem 0 0 1.5rem',
					'marginLeft': isMobileSize ? '1rem' : '1.25rem',
					'border': 'none',
					'cursor': 'pointer',
					'position': 'relative',
					'whiteSpace': 'nowrap',
					'overflow': 'hidden',
					'&:hover': {
						color: mainIsActive ? theme.textColor?.primary.main : getHoverColor(),
						backgroundColor: mainIsActive ? theme.palette.secondary.main : 'transparent',
						border: 'none',
					},
				}}
				onClick={handleMainClick}
				onMouseEnter={handleOpenSubMenu}
				onMouseLeave={handleCloseSubMenu}>
				{mainBtnText}
			</Button>
			<Popper
				open={isSubMenuOpen}
				anchorEl={anchorRef.current}
				placement='right-start'
				modifiers={[
					{
						name: 'offset',
						options: {
							offset: [0, 0],
						},
					},
				]}
				sx={{
					zIndex: 1300,
					// Hide Popper immediately when closed to prevent green box flash during navigation
					display: isSubMenuOpen ? 'block' : 'none',
					pointerEvents: isSubMenuOpen ? 'auto' : 'none',
					visibility: isSubMenuOpen ? 'visible' : 'hidden',
				}}
				onMouseEnter={() => setIsSubMenuOpen(true)}
				onMouseLeave={handleCloseSubMenu}>
				<ClickAwayListener onClickAway={handleCloseSubMenu}>
					<Paper
						elevation={3}
						sx={{
							backgroundColor: hasAdminAccess
								? theme.bgColor?.adminSidebar
								: user?.role === Roles.INSTRUCTOR
									? theme.bgColor?.instructorSidebar
									: theme.palette.primary.main,
							minWidth: '10rem',
							padding: '0.5rem 0',
							borderRadius: '0.5rem',
							marginLeft: '0rem',
						}}>
						<Box sx={{ display: 'flex', flexDirection: 'column' }}>
							{subMenuItems.map((item, index) => (
								<Button
									key={index}
									variant='outlined'
									startIcon={<item.IconName />}
									sx={{
										'color': item.isActive ? theme.textColor?.primary.main : theme.textColor?.common.main,
										'backgroundColor': item.isActive ? theme.palette.secondary.main : 'transparent',
										'textTransform': 'capitalize',
										'marginBottom': index < subMenuItems.length - 1 ? '0.15rem' : '0',
										'fontFamily': theme.fontFamily?.main,
										'fontSize': isMobileSize ? '0.75rem' : '0.9rem',
										'lineHeight': '2.25',
										'width': '100%',
										'justifyContent': 'flex-start',
										'paddingLeft': '1rem',
										'paddingRight': '1rem',
										'border': 'none',
										'cursor': 'pointer',
										'&:hover': {
											color: item.isActive ? theme.textColor?.primary.main : getHoverColor(),
											border: 'none',
										},
									}}
									onClick={() => handleSubItemClick(item.path)}>
									{item.btnText}
								</Button>
							))}
						</Box>
					</Paper>
				</ClickAwayListener>
			</Popper>
		</>
	);
};

export default SidebarGroupedMenu;
