import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, applyActionCode, checkActionCode } from 'firebase/auth';
import { Box, Typography, Button } from '@mui/material';
import theme from '../themes';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

const VerifyEmailPage = () => {
	const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
	const [isVerified, setIsVerified] = useState<boolean | null>(null);
	const navigate = useNavigate();

	const { organisation } = useContext(OrganisationContext);

	useEffect(() => {
		const queryParams = new URLSearchParams(window.location.search);
		const code = queryParams.get('oobCode');

		if (code) {
			const auth = getAuth();

			// Check if the action code is valid
			checkActionCode(auth, code)
				.then(() => {
					// Apply the action code to complete verification
					return applyActionCode(auth, code);
				})
				.then(() => {
					setIsVerified(true);
					setVerificationMessage('Your email has been successfully verified.');

					// Optionally redirect the user after a delay
					setTimeout(() => navigate('/auth'), 5000);
				})
				.catch((_) => {
					setIsVerified(false);
					setVerificationMessage('The verification link is invalid or has expired.');
				});
		} else {
			setVerificationMessage('Invalid or missing verification code.');
		}
	}, [navigate]);

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'flex-start',
				backgroundColor: theme.bgColor?.commonTwo,
				height: '100vh',
				padding: '3rem',
			}}>
			<Box sx={{ textAlign: 'center' }}>
				<Typography variant='h1' sx={{ mb: '4rem' }}>
					{/* {organisation?.orgName} */}
					KAIZENGLISH
				</Typography>
				<Typography variant='h4' sx={{ mb: '2rem' }}>
					Verify Your Email
				</Typography>
				{verificationMessage && (
					<Typography variant='body1' sx={{ mt: '2rem', color: isVerified ? 'green' : 'red' }}>
						{verificationMessage}
					</Typography>
				)}

				<Button variant='contained' sx={{ mt: '2rem', textTransform: 'capitalize' }} onClick={() => navigate('/auth')}>
					Login Page
				</Button>
			</Box>
		</Box>
	);
};

export default VerifyEmailPage;
