import { Box, Button, Paper, Typography } from '@mui/material';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import theme from '../../themes';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import { useStickyPaper } from '../../hooks/useStickyPaper';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface ClubPaperProps {
	title: string;
	isActive: boolean;
	isSaving: boolean;
	onSave: () => void;
}

const ClubPaper = ({ title, isActive, isSaving, onSave }: ClubPaperProps) => {
	const navigate = useNavigate();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const { isSticky, paperRef } = useStickyPaper(isMobileSize);

	return (
		<Paper
			ref={paperRef}
			elevation={10}
			sx={{
				width: isSticky ? (isMobileSize ? '100%' : 'calc(100% - 10rem)') : '100%',
				height: isSticky ? '3rem' : '6rem',
				mt: isSticky ? 0 : '1.25rem',
				backgroundColor: theme.bgColor?.adminPaper,
				position: isSticky ? 'fixed' : 'relative',
				top: isSticky ? (isMobileSize ? '3.5rem' : '4rem') : 'auto',
				left: isSticky ? (isMobileSize ? '0' : '10rem') : 'auto',
				right: isSticky ? 0 : 'auto',
				zIndex: isSticky ? 1000 : 'auto',
				transition: 'all 0.5s ease',
				borderRadius: isSticky ? 0 : undefined,
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					height: '100%',
					width: '100%',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: isSticky ? 'row' : 'column',
						justifyContent: isSticky ? 'space-between' : 'space-between',
						alignItems: isSticky ? 'center' : 'flex-start',
						flex: { md: 2, lg: 3 },
						padding: isSticky ? (isMobileSize ? '0.25rem 0rem' : '0.5rem 1rem') : '0.5rem',
					}}>
					<Box>
						<Button
							variant='text'
							startIcon={
								<KeyboardBackspaceOutlined
									sx={{ fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined }}
									fontSize='small'
								/>
							}
							sx={{
								'color': theme.textColor?.common.main,
								'textTransform': 'inherit',
								'fontFamily': theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
								'fontSize': isSticky ? { xs: '0.65rem', sm: '0.85rem' } : undefined,
							}}
							onClick={() => {
								navigate('/admin/clubs');
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							{isSticky ? 'Clubs' : 'Back to Clubs'}
						</Button>
					</Box>
					{!isMobileSize && (
						<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
							<Typography
								variant='body1'
								sx={{
									color: theme.textColor?.common.main,
									padding: isSticky ? '0 0 0 0.5rem' : '0 0 0.5rem 0.5rem',
									fontSize: isSticky ? '0.75rem' : undefined,
								}}>
								{isActive ? 'Active' : 'Inactive'}
							</Typography>
						</Box>
					)}
				</Box>

				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: isSticky ? 'center' : 'flex-start',
						flex: 2,
						padding: isSticky ? '0.5rem 1rem' : '1rem',
					}}>
					<Box
						sx={{
							display: 'flex',
							flexDirection: isSticky ? 'row' : 'column',
							alignItems: 'center',
							justifyContent: isSticky ? 'space-between' : 'space-between',
							height: '100%',
							width: '100%',
							gap: isSticky ? 2 : 0,
						}}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', flex: 3 }}>
							<Typography
								variant={title.length > 50 ? 'body2' : 'h6'}
								sx={{
									color: theme.textColor?.common.main,
									mr: '0.5rem',
									fontSize: isSticky
										? title.length > 50
											? isMobileSize
												? '0.5rem'
												: '0.65rem'
											: isMobileSize
												? '0.7rem'
												: '0.8rem'
										: undefined,
								}}>
								{title}
							</Typography>
						</Box>

						<Box
							sx={{
								display: 'flex',
								justifyContent: 'flex-end',
								alignItems: 'center',
								width: '100%',
								flex: isMobileSize ? 3.5 : 2,
								mr: isMobileSize ? '-0.75rem' : '0rem',
							}}>
							{isSaving ? (
								<LoadingButton
									loading
									disabled
									variant='contained'
									sx={{
										backgroundColor: 'white !important',
										textTransform: 'capitalize',
										height: isMobileSize ? '1.5rem' : '1.75rem',
										fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : isMobileSize ? '0.7rem' : '0.85rem',
										mt: '0.2rem',
										'&.Mui-disabled': {
											backgroundColor: 'white !important',
										},
									}}>
									Save
								</LoadingButton>
							) : (
								<CustomSubmitButton
									sx={{
										backgroundColor: theme.bgColor?.greenPrimary,
										fontSize: isSticky ? (isMobileSize ? '0.6rem' : '0.75rem') : undefined,
									}}
									onClick={() => {
										onSave();
										window.scrollTo({ top: 0, behavior: 'smooth' });
									}}>
									Save
								</CustomSubmitButton>
							)}
						</Box>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default ClubPaper;
