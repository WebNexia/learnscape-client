import { Box, DialogContent, Typography } from '@mui/material';
import CustomDialog from '../dialog/CustomDialog';

interface TermsConditionsProps {
	termsConditionsModalOpen: boolean;
	setTermsConditionsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const TermsConditions = ({ termsConditionsModalOpen, setTermsConditionsModalOpen }: TermsConditionsProps) => {
	return (
		<CustomDialog
			openModal={termsConditionsModalOpen}
			closeModal={() => {
				setTermsConditionsModalOpen(false);
			}}
			title='Terms and Conditions'>
			<DialogContent>
				<Box sx={{ padding: '2rem', borderRadius: '8px', maxHeight: '33rem', overflowY: 'auto' }}>
					<Typography variant='h6' gutterBottom>
						1. General Information
					</Typography>
					<Typography variant='body2' paragraph>
						The Service is operated by [Your Company Name], located at [Your Address]. By purchasing any of our courses, you agree that you have read,
						understood, and accepted these Terms and any other relevant policies or notices that we provide.
					</Typography>

					<Typography variant='h6' gutterBottom>
						2. Eligibility
					</Typography>
					<Typography variant='body2' paragraph>
						You must be at least 18 years of age to use our Service. If you are under 18, you may only use our Service with the involvement of a
						parent or guardian.
					</Typography>

					<Typography variant='h6' gutterBottom>
						3. Course Enrollment and Access
					</Typography>
					<Typography variant='body2' paragraph>
						Once you have completed the registration and payment process, you will be granted access to the purchased course. Access will be provided
						immediately unless otherwise stated. Access to the course materials is for your personal, non-commercial use only. You may not share your
						access credentials with others. We reserve the right to terminate or restrict your access if you violate any part of these Terms.
					</Typography>

					<Typography variant='h6' gutterBottom>
						4. Payments and Fees
					</Typography>
					<Typography variant='body2' paragraph>
						All course fees must be paid in full before access is granted to the course materials. Prices for our courses are subject to change
						without notice. The price at the time of purchase is the final price. All payments are processed securely through [payment provider, e.g.,
						Stripe, PayPal]. We do not store your credit card information.
					</Typography>

					<Typography variant='h6' gutterBottom>
						5. Refund Policy
					</Typography>
					<Typography variant='body2' paragraph>
						You may request a refund within [X days] of purchase if you are not satisfied with the course. Refunds will not be granted if more than [X
						percentage] of the course has been accessed or completed. To request a refund, please contact us at [email/contact form].
					</Typography>

					<Typography variant='h6' gutterBottom>
						6. Intellectual Property
					</Typography>
					<Typography variant='body2' paragraph>
						All course content, including but not limited to videos, documents, and quizzes, is the property of [Your Company Name] and is protected
						by copyright laws. You may not reproduce, distribute, or create derivative works from any part of the course content without prior written
						permission.
					</Typography>

					<Typography variant='h6' gutterBottom>
						7. Disclaimers and Limitation of Liability
					</Typography>
					<Typography variant='body2' paragraph>
						The courses are provided on an "as-is" basis, and we make no guarantees as to the accuracy, completeness, or results from the use of the
						materials. To the maximum extent permitted by law, [Your Company Name] will not be liable for any direct, indirect, incidental, special,
						or consequential damages arising out of the use of the Service.
					</Typography>

					<Typography variant='h6' gutterBottom>
						8. Termination
					</Typography>
					<Typography variant='body2' paragraph>
						We reserve the right to terminate your access to the Service at our sole discretion, without notice, if you breach these Terms. Upon
						termination, all provisions of the Terms which by their nature should survive will continue in effect, including but not limited to
						intellectual property rights and disclaimers.
					</Typography>

					<Typography variant='h6' gutterBottom>
						9. Governing Law
					</Typography>
					<Typography variant='body2' paragraph>
						These Terms are governed by and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law
						provisions. Any disputes arising from or relating to these Terms will be subject to the exclusive jurisdiction of the courts of [Your
						Country/State].
					</Typography>

					<Typography variant='h6' gutterBottom>
						10. Changes to the Terms
					</Typography>
					<Typography variant='body2' paragraph>
						We reserve the right to update these Terms at any time. If changes are made, we will notify you by updating the "Last Updated" date at the
						top of these Terms. Your continued use of the Service after any changes are made will constitute your acceptance of the new Terms.
					</Typography>

					<Typography variant='h6' gutterBottom>
						11. Contact Information
					</Typography>
					<Typography variant='body2' paragraph>
						If you have any questions about these Terms, please contact us at:
					</Typography>
					<Typography variant='body2' paragraph>
						- Email: [your email address]
					</Typography>
					<Typography variant='body2' paragraph>
						- Phone: [your phone number]
					</Typography>
					<Typography variant='body2' paragraph>
						- Address: [your company address]
					</Typography>
				</Box>
			</DialogContent>
		</CustomDialog>
	);
};

export default TermsConditions;
