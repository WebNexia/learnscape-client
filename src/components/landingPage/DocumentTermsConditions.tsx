import { Box, DialogActions, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomCancelButton from '../../components/forms/customButtons/CustomCancelButton';

interface DocumentTermsConditionsProps {
	termsConditionsModalOpen: boolean;
	setTermsConditionsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	fromHomePage?: boolean;
}

const DIALOG_FONT = 'Varela Round';
const DIALOG_BG = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))';
const DIALOG_BORDERRADIUS = '1.5rem';
const DIALOG_BOXSHADOW = '0 0.5rem 2rem rgba(44, 62, 80, 0.1)';
const DIALOG_BORDER = '0.5rem solid rgba(255, 255, 255, 0.18)';

const linkSx = { color: '#0052a3', textDecoration: 'underline', fontFamily: DIALOG_FONT };

const DocumentTermsConditions = ({ termsConditionsModalOpen, setTermsConditionsModalOpen, fromHomePage }: DocumentTermsConditionsProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;
	const isTr = fromHomePage !== false;

	return (
		<CustomDialog
			title={isTr ? 'Dijital Kaynak Şartları' : 'Digital Resource Terms'}
			titleSx={{
				fontSize: '1.5rem',
				fontWeight: 600,
				fontFamily: DIALOG_FONT,
				color: '#2C3E50',
				ml: '0.5rem',
				textAlign: 'center',
				mb: 1,
			}}
			openModal={termsConditionsModalOpen}
			closeModal={() => setTermsConditionsModalOpen(false)}
			maxWidth='md'
			PaperProps={{
				sx: {
					height: 'auto',
					maxHeight: '90vh',
					borderRadius: DIALOG_BORDERRADIUS,
					background: DIALOG_BG,
					boxShadow: DIALOG_BOXSHADOW,
					backdropFilter: 'blur(8px)',
					border: DIALOG_BORDER,
					fontFamily: DIALOG_FONT,
				},
			}}>
			<Box sx={{ padding: '2rem' }}>
				<Typography
					sx={{
						fontSize: isMobileSize ? '0.9rem' : '1rem',
						fontFamily: DIALOG_FONT,
						color: '#223354',
						lineHeight: 1.7,
					}}>
					{isTr ? (
						<>
							Bu dijital kaynaklar yalnızca kişisel, ticari olmayan kullanım içindir. İçerikler kopyalanamaz, dağıtılamaz veya üçüncü kişilerle paylaşılamaz. Tüm kaynaklar telif hakkı ile korunmaktadır.
							<br />
							<br />
							Satın alma sonrasında dijital kaynağa anında erişim sağlanır. Ödeme adımında dijital içeriğe hemen erişim talep ettiğinizi ve hizmetin başlamasıyla birlikte 14 günlük cayma hakkından feragat ettiğinizi onaylamanız gerekir. Genel kural olarak dijital kaynaklar iade edilmez; teknik erişim sorunu, mükerrer ödeme veya sistemsel hata durumlarında iade değerlendirilebilir.
							<br />
							<br />
							Tam şartlar için{' '}
							<Link to='/terms' style={linkSx} onClick={() => setTermsConditionsModalOpen(false)}>
								Kullanıcı Sözleşmesi
							</Link>{' '}
							(Bölüm 4.3) ve{' '}
							<Link to='/privacy-policy' style={linkSx} onClick={() => setTermsConditionsModalOpen(false)}>
								Gizlilik Politikası
							</Link>
							&apos;nı inceleyin.
						</>
					) : (
						<>
							These digital resources are for personal, non-commercial use only. Content may not be copied, distributed, or shared with third parties. All resources are protected by copyright.
							<br />
							<br />
							Access is granted immediately after purchase. At checkout you must confirm that you request immediate access to digital content and waive your 14-day right of withdrawal once the service has begun. As a general rule, digital resources are non-refundable; refunds may be considered for technical access problems, duplicate payment, or system errors.
							<br />
							<br />
							For full terms, see the{' '}
							<Link to='/terms' style={linkSx} onClick={() => setTermsConditionsModalOpen(false)}>
								User Agreement
							</Link>{' '}
							(Section 4.3) and{' '}
							<Link to='/privacy-policy' style={linkSx} onClick={() => setTermsConditionsModalOpen(false)}>
								Privacy Policy
							</Link>
							.
						</>
					)}
				</Typography>
			</Box>
			<DialogActions>
				<CustomCancelButton onClick={() => setTermsConditionsModalOpen(false)} sx={{ margin: '0 1rem 1rem 0', fontFamily: DIALOG_FONT }}>
					{isTr ? 'Kapat' : 'Close'}
				</CustomCancelButton>
			</DialogActions>
		</CustomDialog>
	);
};

export default DocumentTermsConditions;
