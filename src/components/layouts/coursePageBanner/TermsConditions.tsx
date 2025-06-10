import { Box, DialogContent, Typography } from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';
import CustomCancelButton from '../../forms/customButtons/CustomCancelButton';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface TermsConditionsProps {
	termsConditionsModalOpen: boolean;
	setTermsConditionsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	fromHomePage?: boolean;
}

const DIALOG_FONT = 'Varela Round';
const DIALOG_BG = 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))';
const DIALOG_BORDERRADIUS = '1.5rem';
const DIALOG_BOXSHADOW = '0 0.5rem 2rem rgba(44, 62, 80, 0.1)';
const DIALOG_BORDER = '0.5rem solid rgba(255, 255, 255, 0.18)';

const TermsConditions = ({ termsConditionsModalOpen, setTermsConditionsModalOpen, fromHomePage = false }: TermsConditionsProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;

	if (fromHomePage) {
		return (
			<CustomDialog
				title='Şartlar ve Koşullar'
				titleSx={{
					fontSize: '1.75rem',
					fontWeight: 700,
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
						overflow: 'visible',
						borderRadius: DIALOG_BORDERRADIUS,
						background: DIALOG_BG,
						boxShadow: DIALOG_BOXSHADOW,
						backdropFilter: 'blur(8px)',
						border: DIALOG_BORDER,
						fontFamily: DIALOG_FONT,
					},
				}}>
				<Box
					sx={{
						'padding': '2rem',
						'maxHeight': '60vh',
						'overflowY': 'auto',
						'&::-webkit-scrollbar': {
							width: '8px',
						},
						'&::-webkit-scrollbar-track': {
							background: '#f1f1f1',
							borderRadius: '4px',
						},
						'&::-webkit-scrollbar-thumb': {
							'background': '#888',
							'borderRadius': '4px',
							'&:hover': {
								background: '#555',
							},
						},
					}}>
					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT, mt: '-1.5rem' }}>
						1. Genel Bilgiler
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Bu platform, [Şirket Adı] tarafından işletilmektedir. Kurslarımızdan herhangi birini satın alarak, bu Şartları ve Koşulları ve diğer
						ilgili politikaları okuduğunuzu, anladığınızı ve kabul ettiğinizi onaylamış olursunuz.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT }}>
						2. Uygunluk
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Hizmetimizi kullanmak için en az 18 yaşında olmalısınız. 18 yaşın altındaysanız, hizmetimizi yalnızca bir ebeveyn veya vasinin katılımıyla
						kullanabilirsiniz.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT }}>
						3. Kurs Kaydı ve Erişim
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Kayıt ve ödeme işlemini tamamladıktan sonra, satın aldığınız kursa erişim sağlanacaktır. Erişim, aksi belirtilmedikçe hemen sağlanacaktır.
						Kurs materyallerine erişim yalnızca kişisel, ticari olmayan kullanımınız içindir. Erişim bilgilerinizi başkalarıyla paylaşamazsınız.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT }}>
						4. Ödemeler ve Ücretler
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Tüm kurs ücretleri, kurs materyallerine erişim sağlanmadan önce tam olarak ödenmelidir. Kurslarımızın fiyatları önceden haber vermeksizin
						değiştirilebilir. Satın alma anındaki fiyat nihai fiyattır.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT }}>
						5. İade Politikası
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Kursu beğenmediyseniz, satın alma tarihinden itibaren [X gün] içinde iade talep edebilirsiniz. Kursun [X yüzdesi]'inden fazlasına
						erişilmiş veya tamamlanmışsa iade yapılmayacaktır.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT }}>
						6. Fikri Mülkiyet
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Tüm kurs içeriği, [Şirket Adı]'nin mülkiyetindedir ve telif hakkı yasalarıyla korunmaktadır. Önceden yazılı izin olmadan kurs içeriğinin
						hiçbir kısmını çoğaltamaz, dağıtamaz veya türev çalışmalar oluşturamazsınız.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT }}>
						7. Sorumluluk Reddi
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Kurslar "olduğu gibi" sunulmaktadır ve materyallerin kullanımından elde edilecek sonuçların doğruluğu, eksiksizliği veya sonuçları
						konusunda herhangi bir garanti vermemekteyiz.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT }}>
						8. Fesih
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Bu Şartları ihlal etmeniz durumunda, tek taraflı olarak hizmete erişiminizi sonlandırma hakkını saklı tutarız.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT }}>
						9. Uygulanacak Hukuk
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Bu Şartlar, [Ülkeniz/Eyaletiniz] yasalarına göre yönetilir ve yorumlanır.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT }}>
						10. Şartlarda Değişiklik
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Bu Şartları herhangi bir zamanda güncelleme hakkını saklı tutarız. Değişiklikler yapıldığında, bu Şartların üst kısmındaki "Son
						Güncelleme" tarihini güncelleyerek sizi bilgilendireceğiz.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined, fontFamily: DIALOG_FONT }}>
						11. İletişim Bilgileri
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						Bu Şartlar hakkında herhangi bir sorunuz varsa, lütfen bizimle iletişime geçin:
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						- E-posta: [e-posta adresiniz]
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						- Telefon: [telefon numaranız]
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem', fontFamily: DIALOG_FONT }}>
						- Adres: [şirket adresiniz]
					</Typography>
				</Box>
				<CustomCancelButton
					sx={{
						alignSelf: 'end',
						width: isMobileSize ? '20%' : '10%',
						margin: isMobileSize ? '0 1rem 1rem 0' : '0 2rem 1rem 0',
						padding: 0,
						fontFamily: DIALOG_FONT,
					}}
					onClick={() => setTermsConditionsModalOpen(false)}>
					Kapat
				</CustomCancelButton>
			</CustomDialog>
		);
	}

	return (
		<CustomDialog
			openModal={termsConditionsModalOpen}
			closeModal={() => {
				setTermsConditionsModalOpen(false);
			}}
			title='Terms and Conditions'>
			<DialogContent>
				<Box sx={{ padding: isMobileSize ? '0.75rem' : '2rem', borderRadius: '8px', maxHeight: '33rem', overflowY: 'auto', mt: '-1rem' }}>
					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						1. General Information
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						The Service is operated by [Your Company Name], located at [Your Address]. By purchasing any of our courses, you agree that you have read,
						understood, and accepted these Terms and any other relevant policies or notices that we provide.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						2. Eligibility
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						You must be at least 18 years of age to use our Service. If you are under 18, you may only use our Service with the involvement of a
						parent or guardian.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						3. Course Enrollment and Access
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						Once you have completed the registration and payment process, you will be granted access to the purchased course. Access will be provided
						immediately unless otherwise stated. Access to the course materials is for your personal, non-commercial use only. You may not share your
						access credentials with others. We reserve the right to terminate or restrict your access if you violate any part of these Terms.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						4. Payments and Fees
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						All course fees must be paid in full before access is granted to the course materials. Prices for our courses are subject to change
						without notice. The price at the time of purchase is the final price. All payments are processed securely through [payment provider, e.g.,
						Stripe, PayPal]. We do not store your credit card information.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						5. Refund Policy
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						You may request a refund within [X days] of purchase if you are not satisfied with the course. Refunds will not be granted if more than [X
						percentage] of the course has been accessed or completed. To request a refund, please contact us at [email/contact form].
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						6. Intellectual Property
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						All course content, including but not limited to videos, documents, and quizzes, is the property of [Your Company Name] and is protected
						by copyright laws. You may not reproduce, distribute, or create derivative works from any part of the course content without prior written
						permission.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						7. Disclaimers and Limitation of Liability
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						The courses are provided on an "as-is" basis, and we make no guarantees as to the accuracy, completeness, or results from the use of the
						materials. To the maximum extent permitted by law, [Your Company Name] will not be liable for any direct, indirect, incidental, special,
						or consequential damages arising out of the use of the Service.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						8. Termination
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						We reserve the right to terminate your access to the Service at our sole discretion, without notice, if you breach these Terms. Upon
						termination, all provisions of the Terms which by their nature should survive will continue in effect, including but not limited to
						intellectual property rights and disclaimers.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						9. Governing Law
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						These Terms are governed by and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law
						provisions. Any disputes arising from or relating to these Terms will be subject to the exclusive jurisdiction of the courts of [Your
						Country/State].
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						10. Changes to the Terms
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						We reserve the right to update these Terms at any time. If changes are made, we will notify you by updating the "Last Updated" date at the
						top of these Terms. Your continued use of the Service after any changes are made will constitute your acceptance of the new Terms.
					</Typography>

					<Typography variant='h6' gutterBottom sx={{ fontSize: isMobileSize ? '0.85rem' : undefined }}>
						11. Contact Information
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						If you have any questions about these Terms, please contact us at:
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						- Email: [your email address]
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						- Phone: [your phone number]
					</Typography>
					<Typography variant='body2' paragraph sx={{ fontSize: isMobileSize ? '0.75rem' : '0.85rem' }}>
						- Address: [your company address]
					</Typography>
				</Box>
			</DialogContent>
			<CustomCancelButton
				sx={{ alignSelf: 'end', width: isMobileSize ? '20%' : '10%', margin: isMobileSize ? '0 1rem 1rem 0' : '0 2rem 1rem 0', padding: 0 }}
				onClick={() => setTermsConditionsModalOpen(false)}>
				Close
			</CustomCancelButton>
		</CustomDialog>
	);
};

export default TermsConditions;
