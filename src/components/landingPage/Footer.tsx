import { Box, Container, Typography } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import theme from '../../themes';
import { Instagram, WhatsApp } from '@mui/icons-material';
import { responsiveStyles } from '../../styles/responsiveStyles';

const Footer = () => {
	const { isSmallScreen } = useContext(MediaQueryContext);

	const fontFamilyLandingPage = "'Varela Round', 'Segoe UI', 'Arial', sans-serif !important";

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				height: { xs: 'auto', sm: 'auto', md: 'auto' },
				minHeight: { xs: '300px', sm: 'auto' },
				backgroundColor: theme.bgColor?.primary,
				position: 'relative',
				bottom: 0,
				width: '100%',
				py: { xs: 3, sm: 3, md: 2 },
				backgroundImage: `radial-gradient(circle, rgba(52,73,94,0.3) 1px, transparent 1px)`,
				backgroundSize: '28px 28px',
			}}>
			<Container maxWidth='lg' sx={{ px: responsiveStyles.spacing.container }}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', sm: 'row' },
						justifyContent: 'space-between',
						gap: { xs: 3, sm: 4 },
						width: '100%',
						px: { xs: 2, sm: 4, md: 5 },
					}}>
					<Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								mb: responsiveStyles.spacing.item,
								fontSize: responsiveStyles.typography.body2,
								fontFamily: fontFamilyLandingPage,
							}}>
							Kaizenglish
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: { xs: '0.65rem', sm: '0.85rem', md: '0.9rem' },
								fontFamily: fontFamilyLandingPage,
							}}>
							275 New North Road,
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: { xs: '0.65rem', sm: '0.85rem', md: '0.9rem' },
								fontFamily: fontFamilyLandingPage,
							}}>
							London, England, N1 7AA
						</Typography>

						<Box
							component='a'
							href='https://www.instagram.com/learnwithlondoner/'
							target='_blank'
							rel='noopener noreferrer'
							sx={{
								display: 'inline-block',
								mt: responsiveStyles.spacing.item,
							}}>
							<Instagram
								sx={{
									color: theme.textColor?.common.main,
									fontSize: { xs: '0.85rem', sm: '1rem', md: '1.25rem' },
								}}
							/>
						</Box>
					</Box>

					<Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								mb: responsiveStyles.spacing.item,
								fontSize: responsiveStyles.typography.body2,
								fontFamily: fontFamilyLandingPage,
							}}>
							İletişim
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: { xs: '0.65rem', sm: '0.85rem', md: '0.9rem' },
								fontFamily: fontFamilyLandingPage,
							}}>
							info@kaizenglish.com
						</Typography>
						<Box
							component='a'
							href={`https://wa.me/447498163458?text=${encodeURIComponent('Feel free to ask us anything about our courses!')}`}
							target='_blank'
							rel='noopener noreferrer'
							sx={{
								display: 'flex',
								justifyContent: { xs: 'center', sm: 'left' },
								alignItems: 'center',
								mt: responsiveStyles.spacing.item,
								cursor: 'pointer',
							}}>
							<Typography
								variant='body2'
								sx={{
									color: theme.textColor?.common.main,
									fontSize: { xs: '0.65rem', sm: '0.85rem', md: '0.9rem' },
									fontFamily: fontFamilyLandingPage,
								}}>
								WhatsApp
							</Typography>
							<WhatsApp
								sx={{
									ml: '0.25rem',
									color: theme.textColor?.greenSecondary.main,
									fontSize: { xs: '0.85rem', sm: '1rem', md: '1.25rem' },
								}}
							/>
						</Box>
					</Box>

					<Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								mb: responsiveStyles.spacing.item,
								fontSize: responsiveStyles.typography.body2,
								fontFamily: fontFamilyLandingPage,
							}}>
							Kurumsal
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: { xs: '0.65rem', sm: '0.85rem', md: '0.9rem' },
								fontFamily: fontFamilyLandingPage,
							}}>
							Kullanıcı Sözleşmesi
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: { xs: '0.65rem', sm: '0.85rem', md: '0.9rem' },
								fontFamily: fontFamilyLandingPage,
							}}>
							Gizlilik
						</Typography>
					</Box>
				</Box>
			</Container>

			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					position: 'absolute',
					bottom: 1,
					width: '100%',
				}}>
				<Typography
					sx={{
						fontSize: isSmallScreen ? '0.5rem' : '0.65rem',
						color: theme.textColor?.common.main,
						fontFamily: fontFamilyLandingPage,
					}}>
					&copy; {new Date().getFullYear()} Webnexia Software Solutions Ltd. Tüm hakları saklıdır.
				</Typography>
			</Box>
		</Box>
	);
};

export default Footer;
