import { Box, DialogActions, Typography } from '@mui/material';
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

const DocumentTermsConditions = ({ termsConditionsModalOpen, setTermsConditionsModalOpen, fromHomePage }: DocumentTermsConditionsProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	return (
		<CustomDialog
			title={fromHomePage ? 'Şartlar ve Koşullar' : 'Terms and Conditions'}
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
						lineHeight: 1.6,
						whiteSpace: 'pre-line',
					}}>
					{fromHomePage
						? `1. Hizmet Kullanımı
Bu platform üzerinden satın alınan kaynaklar, kişisel kullanım için tasarlanmıştır. Kaynakların ticari amaçlarla kullanılması yasaktır.

2. Telif Hakkı
Tüm kaynaklar telif hakkı ile korunmaktadır. Kaynakların kopyalanması, dağıtılması veya başkalarıyla paylaşılması yasaktır.

3. Ödeme ve İade
Ödemeler güvenli ödeme sistemleri üzerinden gerçekleştirilir. Satın alınan kaynaklar için iade politikası bulunmamaktadır.

4. Gizlilik
Kişisel bilgileriniz gizlilik politikamıza uygun olarak korunmaktadır.

5. Sorumluluk Reddi
Platform üzerinden sağlanan kaynakların doğruluğu ve güncelliği garanti edilmemektedir.`
						: `1. Service Usage
Resources purchased through this platform are designed for personal use. Commercial use of resources is prohibited.

2. Copyright
All resources are protected by copyright. Copying, distributing, or sharing resources with others is prohibited.

3. Payment and Refund
Payments are processed through secure payment systems. There is no refund policy for purchased resources.

4. Privacy
Your personal information is protected in accordance with our privacy policy.

5. Disclaimer
The accuracy and currency of resources provided through the platform are not guaranteed.`}
				</Typography>
			</Box>
			<DialogActions>
				<CustomCancelButton onClick={() => setTermsConditionsModalOpen(false)} sx={{ margin: '0 1rem 1rem 0', fontFamily: DIALOG_FONT }}>
					Kapat
				</CustomCancelButton>
			</DialogActions>
		</CustomDialog>
	);
};

export default DocumentTermsConditions;
