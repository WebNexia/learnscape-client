import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HandleActionPage = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const queryParams = new URLSearchParams(window.location.search);
		const mode = queryParams.get('mode'); // Firebase action type
		const oobCode = queryParams.get('oobCode'); // Firebase code for the action

		if (!mode || !oobCode) {
			// If missing required parameters, redirect to home
			navigate('/');
			return;
		}

		// Redirect based on the mode parameter
		if (mode === 'verifyEmail' || mode === 'verifyAndChangeEmail') {
			navigate(`/verify-email?oobCode=${oobCode}`);
		} else if (mode === 'resetPassword') {
			navigate(`/reset-password?mode=resetPassword&oobCode=${oobCode}`);
		} else {
			// Handle unknown action types or redirect to a fallback page
			navigate('/');
		}
	}, [navigate]);

	return <div>Loading...</div>; // Optionally show a loading indicator
};

export default HandleActionPage;
