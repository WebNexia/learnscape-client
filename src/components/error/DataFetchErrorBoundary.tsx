import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper, Alert, AlertTitle, Skeleton, Container } from '@mui/material';
import { Refresh, CloudOff, WifiOff, ErrorOutline } from '@mui/icons-material';
import logo from '../../assets/logo.png';

interface Props {
	children: ReactNode;
	context?: string; // e.g., "Courses", "Users", "Lessons"
	onRetry?: () => void;
	showSkeleton?: boolean;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class DataFetchErrorBoundary extends Component<Props, State> {
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
			console.error(`DataFetchErrorBoundary [${this.props.context}]:`, error, errorInfo);
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
			// Show skeleton loader if requested
			if (this.props.showSkeleton) {
				return (
					<Box sx={{ p: 2 }}>
						<Alert severity='error' sx={{ mb: 2 }}>
							<AlertTitle>Failed to load {this.props.context || 'data'}</AlertTitle>
							<Typography variant='body2'>There was a problem loading the data. Please try again.</Typography>
						</Alert>
						<Skeleton variant='rectangular' height={200} sx={{ mb: 2 }} />
						<Skeleton variant='rectangular' height={200} sx={{ mb: 2 }} />
						<Skeleton variant='rectangular' height={200} />
					</Box>
				);
			}

			// Default error UI for data fetching
			return (
				<Container maxWidth='sm' sx={{ py: 6 }}>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							textAlign: 'center',
							minHeight: '40vh',
							justifyContent: 'center',
						}}>
						{/* Logo */}
						<Box sx={{ mb: 3 }}>
							<img
								src={logo}
								alt='LearnScape Logo'
								style={{
									height: '60px',
									width: 'auto',
									filter: 'grayscale(0.3)',
									opacity: 0.8,
								}}
							/>
						</Box>

						{/* Error Icon */}
						<Box sx={{ mb: 2 }}>
							<ErrorOutline
								sx={{
									fontSize: 60,
									color: 'error.main',
									opacity: 0.7,
								}}
							/>
						</Box>

						{/* Main Error Message */}
						<Typography
							variant='h5'
							gutterBottom
							sx={{
								fontWeight: 600,
								color: 'text.primary',
								mb: 1,
							}}>
							Failed to load {this.props.context || 'data'}
						</Typography>

						<Typography
							variant='body1'
							color='text.secondary'
							sx={{
								mb: 3,
								maxWidth: 400,
								lineHeight: 1.6,
							}}>
							We're having trouble loading the data. This might be a temporary network issue.
						</Typography>

						{/* Action Button */}
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
							Try Again
						</Button>

						{/* Development Error Details */}
						{process.env.NODE_ENV === 'development' && (
							<Paper
								variant='outlined'
								sx={{
									width: '100%',
									mt: 3,
									textAlign: 'left',
								}}>
								<Box sx={{ p: 2 }}>
									<Typography variant='h6' gutterBottom sx={{ color: 'error.main', fontSize: '1rem' }}>
										Error Details (Development Only)
									</Typography>
									<Typography
										variant='body2'
										component='pre'
										sx={{
											fontFamily: 'monospace',
											fontSize: '0.75rem',
											whiteSpace: 'pre-wrap',
											backgroundColor: 'grey.50',
											p: 1,
											borderRadius: 1,
										}}>
										{this.state.error?.toString()}
									</Typography>
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

export default DataFetchErrorBoundary;
