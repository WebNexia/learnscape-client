import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Refresh, BugReport, ErrorOutline } from '@mui/icons-material';
import logo from '../../assets/logo.png';

interface Props {
	children: ReactNode;
	pageName?: string; // e.g., "Courses", "Users", "Lessons"
	onRetry?: () => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class AdminPageErrorBoundary extends Component<Props, State> {
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
			console.error(`AdminPageErrorBoundary [${this.props.pageName}]:`, error, errorInfo);
		}
	}

	handleRetry = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});

		// Call custom retry handler if provided
		if (this.props.onRetry) {
			this.props.onRetry();
		}
	};

	render() {
		if (this.state.hasError) {
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
							Page Error
						</Typography>

						{/* Page-specific message */}
						{this.props.pageName && (
							<Typography
								variant='h6'
								sx={{
									color: 'error.main',
									mb: 3,
									fontWeight: 500,
								}}>
								Error in {this.props.pageName} page
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
							We're sorry, but there was an error loading this page. Please try refreshing or contact support if the problem persists.
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
								onClick={this.handleRetry}
								sx={{
									minWidth: 140,
									py: 1.5,
									fontWeight: 600,
								}}>
								Refresh Page
							</Button>

							<Button
								variant='outlined'
								size='large'
								startIcon={<BugReport />}
								onClick={() => {
									// TODO: Open support modal or redirect to support
								}}
								sx={{
									minWidth: 140,
									py: 1.5,
									fontWeight: 600,
								}}>
								Report Issue
							</Button>
						</Box>

						{/* Development Error Details */}
						{process.env.NODE_ENV === 'development' && (
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
											{this.state.error?.toString()}
										</Typography>
										{this.state.errorInfo && (
											<Typography
												variant='body2'
												component='pre'
												sx={{
													fontFamily: 'monospace',
													mt: 1,
													fontSize: '0.8rem',
													whiteSpace: 'pre-wrap',
												}}>
												{this.state.errorInfo.componentStack}
											</Typography>
										)}
									</Paper>
								</Box>
							</Paper>
						)}
					</Box>
				</Container>
			);
		}

		return this.props.children;
	}
}

export default AdminPageErrorBoundary;
