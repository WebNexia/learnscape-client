import { Box, Collapse, IconButton, Typography } from '@mui/material';
import {
	ChevronRight,
	ConfirmationNumberOutlined,
	EmailOutlined,
	ExpandMore,
	SvgIconComponent,
	VideocamOutlined,
} from '@mui/icons-material';
import { useContext, useState } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import visaImg from '../../assets/visa.png';
import mastercardImg from '../../assets/mastercard.png';

const FONT = 'Varela Round';
const BLUE = '#0052a3';
const ORANGE = '#FF6B3D';

type Step = {
	n: number;
	title: string;
	blurb: string;
	Icon: SvgIconComponent;
	accent: string;
};

const STEPS: Step[] = [
	{
		n: 1,
		title: 'Kulüp sayfasından bilet alın',
		blurb: '',
		Icon: ConfirmationNumberOutlined,
		accent: BLUE,
	},
	{
		n: 2,
		title: 'E-postadaki bilet koduyla oturum seçin',
		blurb: '',
		Icon: EmailOutlined,
		accent: ORANGE,
	},
	{
		n: 3,
		title: 'Zoom linki e-postanıza gelir',
		blurb: '',
		Icon: VideocamOutlined,
		accent: BLUE,
	},
];

/**
 * QA preview only: short first-time club join roadmap.
 */
const ClubJoinHowItWorks = () => {
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;
	const [open, setOpen] = useState(true);

	return (
		<Box
			sx={{
				mb: 5,
				borderRadius: '1rem',
				border: '2px dashed rgba(0, 82, 163, 0.28)',
				background: 'linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(232,238,244,0.9) 55%, rgba(255,107,61,0.08) 100%)',
				overflow: 'hidden',
			}}>
			<Box
				onClick={() => setOpen((prev) => !prev)}
				role='button'
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						setOpen((prev) => !prev);
					}
				}}
				aria-expanded={open}
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 1.5,
					px: { xs: 2, sm: 2.5 },
					py: 1.75,
					cursor: 'pointer',
					userSelect: 'none',
					'&:hover': { backgroundColor: 'rgba(0, 82, 163, 0.04)' },
				}}>
				<Box sx={{ minWidth: 0, flex: 1 }}>
					<Typography
						sx={{
							fontFamily: FONT,
							fontWeight: 700,
							fontSize: isMobileSize ? '1.05rem' : '1.25rem',
							color: '#0A1A2F',
							mb: 0.35,
						}}>
						Kulübe ilk kez mi geliyorsunuz?
					</Typography>
					<Typography
						sx={{
							fontFamily: FONT,
							fontSize: isMobileSize ? '0.78rem' : '0.88rem',
							color: '#475569',
							lineHeight: 1.45,
						}}>
						{open ? '3 kısa adım — Bilet alın, oturum seçin, Zoom’a girin.' : 'Adımları görmek için tıklayın'}
					</Typography>
				</Box>
				<IconButton
					size='small'
					aria-label={open ? 'Rehberi kapat' : 'Rehberi aç'}
					sx={{
						flexShrink: 0,
						transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
						transition: 'transform 0.25s ease',
						color: BLUE,
						backgroundColor: 'rgba(255,255,255,0.9)',
						border: '1px solid rgba(0, 82, 163, 0.15)',
						'&:hover': { backgroundColor: '#fff' },
					}}>
					<ExpandMore />
				</IconButton>
			</Box>

			<Collapse in={open} timeout='auto' unmountOnExit>
				<Box sx={{ px: { xs: 2, sm: 2.5 }, pb: { xs: 2, sm: 2.5 }, pt: 0.5 }}>


					<Box
						sx={{
							display: 'flex',
							flexDirection: { xs: 'column', md: 'row' },
							alignItems: { xs: 'stretch', md: 'flex-start' },
							justifyContent: 'center',
							gap: { xs: 1.5, md: 0 },
						}}>
						{STEPS.map((step, index) => {
							const StepIcon = step.Icon;
							const isLast = index === STEPS.length - 1;
							return (
								<Box
									key={step.n}
									sx={{
										display: 'flex',
										flexDirection: { xs: 'column', md: 'row' },
										alignItems: { xs: 'stretch', md: 'center' },
										flex: { md: 1 },
										minWidth: 0,
									}}>
									<Box
										sx={{
											flex: 1,
											textAlign: 'center',
											px: { xs: 1.5, md: 1.25 },
											py: 1.75,
											borderRadius: '0.85rem',
											backgroundColor: '#fff',
											border: '1px solid rgba(0, 82, 163, 0.1)',
											boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
										}}>
										<Box
											sx={{
												width: isMobileSize ? 52 : 58,
												height: isMobileSize ? 52 : 58,
												mx: 'auto',
												mb: 1.25,
												borderRadius: '0.85rem',
												backgroundColor: `${step.accent}12`,
												border: `2px solid ${step.accent}33`,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												position: 'relative',
											}}>
											<StepIcon sx={{ fontSize: isMobileSize ? 26 : 28, color: step.accent }} />
											<Box
												sx={{
													position: 'absolute',
													top: -6,
													left: -6,
													width: 22,
													height: 22,
													borderRadius: '50%',
													backgroundColor: step.accent,
													color: '#fff',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontFamily: FONT,
													fontSize: '0.7rem',
													fontWeight: 700,
												}}>
												{step.n}
											</Box>
										</Box>
										<Typography
											sx={{
												fontFamily: FONT,
												fontWeight: 700,
												fontSize: isMobileSize ? '0.88rem' : '0.95rem',
												color: '#0A1A2F',
												mb: 0.5,
												lineHeight: 1.3,
											}}>
											{step.title}
										</Typography>
										<Typography
											sx={{
												fontFamily: FONT,
												fontSize: isMobileSize ? '0.74rem' : '0.8rem',
												color: '#64748b',
												lineHeight: 1.45,
											}}>
											{step.blurb}
										</Typography>
									</Box>

									{!isLast && (
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												px: { md: 0.5 },
												py: { xs: 0.25, md: 0 },
												color: step.accent,
												opacity: 0.7,
												transform: { xs: 'rotate(90deg)', md: 'none' },
											}}
											aria-hidden>
											<ChevronRight sx={{ fontSize: 28 }} />
										</Box>
									)}
								</Box>
							);
						})}
					</Box>

					<Typography
						sx={{
							mt: 2.5,
							textAlign: 'center',
							fontFamily: FONT,
							fontSize: '0.78rem',
							color: '#64748b',
						}}>
						Hazırsanız aşağıdan bir kulüp seçin
					</Typography>
				</Box>
			</Collapse>
		</Box>
	);
};

export default ClubJoinHowItWorks;
