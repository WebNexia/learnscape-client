import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { useConsultationCart } from '../contexts/ConsultationCartContextProvider';
import { useDocumentCart } from '../contexts/DocumentCartContextProvider';
import { feedbackFormsService } from '../services/feedbackFormsService';
import {
	clearCheckoutReturnContext,
	clearPendingCartCheckout,
	readCheckoutReturnContext,
	readPendingCartCheckout,
	type CartCheckoutReturnContext,
} from '../utils/hostedCheckout';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;
const FONT = 'Varela Round';

export default function CheckoutReturn() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { user, setUser } = useContext(UserAuthContext);
	const { clearCart: clearConsultationCart } = useConsultationCart();
	const { clearCart: clearDocumentCart } = useDocumentCart();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState('Ödemeniz tamamlanıyor...');
	const [backPath, setBackPath] = useState('/');
	const ranRef = useRef(false);

	useEffect(() => {
		if (ranRef.current) return;
		ranRef.current = true;

		const sessionId = searchParams.get('session_id');
		const stored = readCheckoutReturnContext();
		const pendingCart = readPendingCartCheckout();
		const context = stored || pendingCart;

		if (context?.kind === 'course' && context.courseId) {
			setBackPath(
				context.source === 'app'
					? `/course/${context.courseId}`
					: `/landing-page-course/${encodeURIComponent(context.courseTitle || '')}/${context.courseId}`
			);
		} else {
			setBackPath('/landing-page-cart');
		}

		if (!sessionId) {
			setStatus('error');
			setMessage('Ödeme oturumu bulunamadı. Lütfen tekrar deneyin.');
			return;
		}

		(async () => {
			try {
				const res = await axios.post(`${base_url}/payments/checkout/fulfill`, { sessionId });
				if (!res.data?.ok) {
					throw new Error(res.data?.error || 'Ödeme tamamlanamadı.');
				}

				const cartContext: CartCheckoutReturnContext | null =
					context?.kind === 'cart' ? context : pendingCart;

				if (res.data.kind === 'cart' || cartContext?.kind === 'cart') {
					if (cartContext) {
						const firstName = cartContext.firstName?.trim() || '';
						const lastName = cartContext.lastName?.trim() || '';
						const email = cartContext.email?.trim() || '';
						for (const link of cartContext.formLinks || []) {
							if (link.formSubmissionId && link.appointmentId) {
								try {
									await feedbackFormsService.linkSubmissionToAppointment(link.formSubmissionId, {
										firstName,
										lastName,
										userEmail: email,
										consultationAppointmentId: link.appointmentId,
									});
								} catch {
									// Non-blocking
								}
							}
						}
						if (cartContext.agreeMarketing && email && cartContext.orgId) {
							try {
								await axios.post(`${base_url}/marketing-consent/guest`, {
									email,
									orgId: cartContext.orgId,
									firstName,
									lastName,
									source: 'cart',
								});
							} catch {
								// Non-blocking
							}
						}
					}
					clearDocumentCart();
					clearConsultationCart();
					clearPendingCartCheckout();
					clearCheckoutReturnContext();
					setStatus('success');
					setMessage(
						res.data.documentDeliveryFailed
							? res.data.documentDeliveryMessage ||
								'Ödemeniz alındı ancak doküman e-postası gönderilemedi. Lütfen destek ile iletişime geçin.'
							: 'Ödemeniz başarıyla tamamlandı. E-postanızı kontrol edin.'
					);
					setTimeout(() => navigate('/landing-page-cart', { replace: true }), 2200);
					return;
				}

				if (user && (res.data.userId === user._id || !res.data.userId)) {
					setUser((prev) => (prev ? { ...prev, hasRegisteredCourse: true } : prev));
				}

				clearCheckoutReturnContext();
				setStatus('success');
				setMessage('Ödemeniz alındı ve kaydınız tamamlandı.');

				const courseId = res.data.courseId || (context?.kind === 'course' ? context.courseId : null);
				const userCourseId = res.data.userCourseId;
				if (context?.kind === 'course' && context.source === 'app' && courseId && userCourseId) {
					navigate(`/course/${courseId}/userCourseId/${userCourseId}?isEnrolled=true`, { replace: true });
					return;
				}
				if (context?.kind === 'course' && context.source === 'landing') {
					setBackPath('/auth');
					setMessage('Ödemeniz alındı ve kaydınız tamamlandı. Giriş yaparak kursunuza ulaşabilirsiniz.');
					setTimeout(() => navigate('/auth', { replace: true }), 2200);
					return;
				}
				if (courseId) {
					setBackPath('/auth');
					setMessage('Ödemeniz alındı ve kaydınız tamamlandı. Giriş yaparak kursunuza ulaşabilirsiniz.');
					setTimeout(() => navigate('/auth', { replace: true }), 2200);
					return;
				}
			} catch (err: unknown) {
				const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
				setStatus('error');
				setMessage(
					e?.response?.data?.error ||
						e?.response?.data?.message ||
						e?.message ||
						'Ödeme tamamlanamadı. Ücret alınmadıysa tekrar deneyebilirsiniz.'
				);
			}
		})();
	}, [searchParams, navigate, user, setUser, clearConsultationCart, clearDocumentCart]);

	return (
		<LandingPageLayout>
			<Box
				sx={{
					minHeight: '60vh',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					px: 2,
					pt: { xs: '14vh', md: '16vh' },
					pb: 6,
					textAlign: 'center',
				}}>
				{status === 'loading' && <CircularProgress size={36} sx={{ mb: 2 }} />}
				<Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '1.35rem', color: '#0A1A2F', mb: 1 }}>
					{status === 'loading' ? 'Ödeme işleniyor' : status === 'success' ? 'İşlem tamam' : 'Ödeme tamamlanamadı'}
				</Typography>
				<Typography sx={{ fontFamily: FONT, color: 'text.secondary', maxWidth: 520, mb: 3, lineHeight: 1.6 }}>
					{message}
				</Typography>
				{status !== 'loading' && (
					<Button
						variant="contained"
						onClick={() => navigate(backPath)}
						sx={{
							fontFamily: FONT,
							textTransform: 'none',
							fontWeight: 600,
							px: 3,
							py: 1.1,
							borderRadius: 2,
							background: 'linear-gradient(135deg, #FF6B3D 0%, #ff7d55 100%)',
							'&:hover': { background: 'linear-gradient(135deg, #ff7d55 0%, #FF6B3D 100%)' },
						}}>
						{backPath === '/auth' ? 'Giriş Yap' : 'Geri dön'}
					</Button>
				)}
			</Box>
		</LandingPageLayout>
	);
}
