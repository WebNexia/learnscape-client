import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Refresh, BugReport, Home, ErrorOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
	showDetails?: boolean;
	context?: string; // e.g., "Admin Courses", "User Dashboard"
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
			errorInfo: null,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({
			error,
			errorInfo,
		});

		// Log error to console in development
		if (process.env.NODE_ENV === 'development') {
			console.error('ErrorBoundary caught an error:', error, errorInfo);
		}

		// Call custom error handler if provided
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// TODO: Send error to monitoring service (Sentry, LogRocket, etc.)
		// this.logErrorToService(error, errorInfo);
	}

	handleRetry = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default error UI
			return (
				<ErrorFallback
					error={this.state.error}
					errorInfo={this.state.errorInfo}
					context={this.props.context}
					showDetails={this.props.showDetails}
					onRetry={this.handleRetry}
				/>
			);
		}

		return this.props.children;
	}
}

// Error Fallback Component
interface ErrorFallbackProps {
	error: Error | null;
	errorInfo: ErrorInfo | null;
	context?: string;
	showDetails?: boolean;
	onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, context, showDetails = false, onRetry }) => {
	const navigate = useNavigate();

	const handleGoHome = () => {
		navigate('/');
	};

	const handleReportBug = () => {
		// TODO: Open bug report modal or redirect to support
	};

	return (
		<Container maxWidth='md' sx={{ py: 8 }}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					textAlign: 'center',
					minHeight: '60vh',
					justifyContent: 'center',
				}}>
				{/* Logo */}
				<Box sx={{ mb: 4 }}>
					<img
						src={logo}
						alt='LearnScape Logo'
						style={{
							height: '80px',
							width: 'auto',
							filter: 'grayscale(0.3)',
							opacity: 0.8,
						}}
					/>
				</Box>

				{/* Error Icon */}
				<Box sx={{ mb: 3 }}>
					<ErrorOutline
						sx={{
							fontSize: 80,
							color: 'error.main',
							opacity: 0.7,
						}}
					/>
				</Box>

				{/* Main Error Message */}
				<Typography
					variant='h4'
					gutterBottom
					sx={{
						fontWeight: 600,
						color: 'text.primary',
						mb: 2,
					}}>
					Oops! Something went wrong
				</Typography>

				{/* Context-specific message */}
				{context && (
					<Typography
						variant='h6'
						sx={{
							color: 'error.main',
							mb: 3,
							fontWeight: 500,
						}}>
						Error in {context}
					</Typography>
				)}

				<Typography
					variant='body1'
					color='text.secondary'
					sx={{
						mb: 4,
						maxWidth: 500,
						lineHeight: 1.6,
					}}>
					We're sorry for the inconvenience. This error has been logged and our team will look into it.
				</Typography>

				{/* Action Buttons */}
				<Box
					sx={{
						display: 'flex',
						gap: 2,
						justifyContent: 'center',
						flexWrap: 'wrap',
						mb: 4,
					}}>
					<Button
						variant='contained'
						size='large'
						startIcon={<Refresh />}
						onClick={onRetry}
						sx={{
							minWidth: 140,
							py: 1.5,
							fontWeight: 600,
						}}>
						Try Again
					</Button>

					<Button
						variant='outlined'
						size='large'
						startIcon={<Home />}
						onClick={handleGoHome}
						sx={{
							minWidth: 140,
							py: 1.5,
							fontWeight: 600,
						}}>
						Go Home
					</Button>

					<Button
						variant='outlined'
						size='large'
						startIcon={<BugReport />}
						onClick={handleReportBug}
						sx={{
							minWidth: 140,
							py: 1.5,
							fontWeight: 600,
						}}>
						Report Bug
					</Button>
				</Box>

				{/* Development Error Details */}
				{showDetails && process.env.NODE_ENV === 'development' && (
					<Paper
						variant='outlined'
						sx={{
							width: '100%',
							maxWidth: 800,
							mt: 4,
							textAlign: 'left',
						}}>
						<Box sx={{ p: 3 }}>
							<Typography variant='h6' gutterBottom sx={{ color: 'error.main' }}>
								Error Details (Development Only)
							</Typography>
							<Paper
								variant='outlined'
								sx={{
									padding: 2,
									backgroundColor: 'grey.50',
									maxHeight: 300,
									overflow: 'auto',
									mt: 2,
								}}>
								<Typography
									variant='body2'
									component='pre'
									sx={{
										fontFamily: 'monospace',
										fontSize: '0.8rem',
										whiteSpace: 'pre-wrap',
									}}>
									{error?.toString()}
								</Typography>
								{errorInfo && (
									<Typography
										variant='body2'
										component='pre'
										sx={{
											fontFamily: 'monospace',
											mt: 1,
											fontSize: '0.8rem',
											whiteSpace: 'pre-wrap',
										}}>
										{errorInfo.componentStack}
									</Typography>
								)}
							</Paper>
						</Box>
					</Paper>
				)}
			</Box>
		</Container>
	);
};

export default ErrorBoundary;
