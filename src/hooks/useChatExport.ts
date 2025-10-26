import { useCallback } from 'react';
import { Chat, Message } from '../pages/Messages';
import { User } from '../interfaces/user';

export interface UseChatExportProps {
	activeChat: Chat | null;
	messages: Message[];
	user: User | null | undefined;
}

export interface UseChatExportReturn {
	downloadChatHistory: () => Promise<void>;
	downloadChatHistoryAsPDF: () => Promise<void>;
	downloadChatHistoryAsHTML: () => Promise<void>;
	downloadChatHistoryAsTXT: () => Promise<void>;
}

export const useChatExport = ({ activeChat, messages, user }: UseChatExportProps): UseChatExportReturn => {
	const downloadChatHistory = useCallback(async () => {
		if (!activeChat || !messages.length) {
			console.error('No active chat or messages to download');
			return;
		}

		try {
			// Prepare chat information
			const chatInfo = {
				chatType: activeChat.chatType || '1-1',
				groupName: activeChat.groupName || '',
				participants: activeChat.participants?.map((p) => ({
					username: p.username,
				})),
				exportDate: new Date().toISOString(),
				exportedBy: user?.username || 'Unknown',
			};

			// Prepare messages data
			const formattedMessages = messages?.map((msg) => ({
				sender: activeChat.participants?.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId,
				text: msg.text,
				timestamp: msg.timestamp.toISOString(),
				type: msg.imageUrl ? 'image' : msg.videoUrl ? 'video' : 'text',
				imageUrl: msg.imageUrl || '',
				videoUrl: msg.videoUrl || '',
				replyTo: msg.replyTo || '',
				quotedText: msg.quotedText || '',
			}));

			// Create export data structure
			const exportData = {
				chatInfo,
				messages: formattedMessages,
				metadata: {
					totalMessages: messages.length,
					dateRange: {
						firstMessage: messages[0]?.timestamp.toISOString(),
						lastMessage: messages[messages?.length - 1]?.timestamp.toISOString(),
					},
					exportFormat: 'JSON',
					version: '1.0',
				},
			};

			// Create and download file
			const blob = new Blob([JSON.stringify(exportData, null, 2)], {
				type: 'application/json',
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			// Generate filename
			const chatName = activeChat.groupName || activeChat.participants?.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.username || 'chat';
			const timestamp = new Date().toISOString().split('T')[0];
			a.download = `chat-history-${chatName}-${timestamp}.json`;

			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading chat history:', error);
		}
	}, [activeChat, messages, user?.firebaseUserId, user?.username]);

	const downloadChatHistoryAsPDF = useCallback(async () => {
		if (!activeChat || !messages.length) {
			console.error('No active chat or messages to download');
			return;
		}

		try {
			// Create PDF content
			const chatName = activeChat.groupName || activeChat.participants?.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.username || 'chat';

			let pdfContent = `CHAT HISTORY EXPORT\n`;
			pdfContent += `==================\n\n`;
			pdfContent += `Chat: ${chatName}\n`;
			pdfContent += `Type: ${activeChat.chatType || '1-1'}\n`;
			pdfContent += `Participants: ${activeChat.participants?.map((p) => p.username)?.join(', ')}\n`;
			pdfContent += `Export Date: ${new Date().toLocaleString()}\n`;
			pdfContent += `Total Messages: ${messages.length}\n\n`;
			pdfContent += `MESSAGES\n`;
			pdfContent += `========\n\n`;

			// Add messages
			messages?.forEach((msg, index) => {
				const sender = activeChat.participants?.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId;
				const timestamp = msg.timestamp.toLocaleString();
				const messageType = msg.imageUrl ? '[IMAGE]' : msg.videoUrl ? '[VIDEO]' : '';

				pdfContent += `${index + 1}. ${sender} (${timestamp})\n`;
				if (msg.isSystemMessage) {
					pdfContent += `   [SYSTEM] ${msg.text}\n`;
				} else {
					pdfContent += `   ${msg.text} ${messageType}\n`;
				}

				// Add media URLs
				if (msg.imageUrl) {
					pdfContent += `   Image URL: ${msg.imageUrl}\n`;
				}
				if (msg.videoUrl) {
					pdfContent += `   Video URL: ${msg.videoUrl}\n`;
				}

				if (msg.replyTo) {
					pdfContent += `   [Reply to message: ${msg.quotedText}]\n`;
				}
				pdfContent += `\n`;
			});

			// Create PDF using browser print functionality
			const printWindow = window.open('', '_blank');
			if (printWindow) {
				printWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>Chat History - ${chatName}</title>
						<style>
							body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
							.header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
							.message { margin-bottom: 15px; padding: 10px; border-left: 3px solid #007bff; background-color: #f8f9fa; }
							.sender { font-weight: bold; color: #007bff; }
							.timestamp { color: #666; font-size: 0.9em; }
							.system { border-left-color: #dc3545; background-color: #f8d7da; }
							.reply { font-style: italic; color: #666; margin-top: 5px; }
							.media-content { margin-top: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6; }
							.media-image { max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
							.media-url { word-break: break-all; color: #007bff; text-decoration: none; font-size: 0.9em; }
							.media-url:hover { text-decoration: underline; }
							@media print { body { margin: 0; } }
						</style>
					</head>
					<body>
						<div class="header">
							<h1>Chat History Export</h1>
							<p><strong>Chat:</strong> ${chatName}</p>
							<p><strong>Type:</strong> ${activeChat.chatType || '1-1'}</p>
							<p><strong>Participants:</strong> ${activeChat.participants?.map((p) => p.username)?.join(', ')}</p>
							<p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
							<p><strong>Total Messages:</strong> ${messages.length}</p>
						</div>
						
						<div class="messages">
							${messages
								?.map((msg, _) => {
									const sender = activeChat.participants?.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId;
									const timestamp = msg.timestamp.toLocaleString();
									const messageType = msg.imageUrl ? '[IMAGE]' : msg.videoUrl ? '[VIDEO]' : '';
									const isSystem = msg.isSystemMessage;
									const replyText = msg.replyTo ? msg.quotedText : '';

									let mediaContent = '';
									if (msg.imageUrl) {
										mediaContent = `
											<div class="media-content">
												<img src="${msg.imageUrl}" alt="Image" class="media-image" />
												<br />
												<a href="${msg.imageUrl}" target="_blank" class="media-url">View Full Image</a>
											</div>
										`;
									} else if (msg.videoUrl) {
										mediaContent = `
											<div class="media-content">
												<a href="${msg.videoUrl}" target="_blank" class="media-url">View Video: ${msg.videoUrl}</a>
											</div>
										`;
									}

									return `
									<div class="message ${isSystem ? 'system' : ''}">
										<div class="sender">${sender}</div>
										<div class="timestamp">${timestamp}</div>
										<div class="text">${isSystem ? '[SYSTEM] ' : ''}${msg.text} ${messageType}</div>
										${mediaContent}
										${replyText ? `<div class="reply">[Reply to: ${replyText}]</div>` : ''}
									</div>
								`;
								})
								?.join('')}
						</div>
					</body>
					</html>
				`);
				printWindow.document.close();

				// Wait for content to load then print
				setTimeout(() => {
					printWindow.print();
					printWindow.close();
				}, 500);
			}
		} catch (error) {
			console.error('Error downloading PDF:', error);
		}
	}, [activeChat, messages, user?.firebaseUserId]);

	const downloadChatHistoryAsHTML = useCallback(async () => {
		if (!activeChat || !messages.length) {
			console.error('No active chat or messages to download');
			return;
		}

		try {
			// Create HTML content
			const chatName = activeChat.groupName || activeChat.participants?.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.username || 'chat';

			const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Chat History - ${chatName}</title>
	<style>
		body { 
			font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
			margin: 0; 
			padding: 20px; 
			background-color: #f5f5f5; 
			line-height: 1.6; 
		}
		.container { 
			max-width: 800px; 
			margin: 0 auto; 
			background-color: white; 
			border-radius: 8px; 
			box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
			overflow: hidden; 
		}
		.header { 
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
			color: white; 
			padding: 30px; 
			text-align: center; 
		}
		.header h1 { 
			margin: 0 0 10px 0; 
			font-size: 2.5em; 
		}
		.header p { 
			margin: 5px 0; 
			opacity: 0.9; 
		}
		.messages-container { 
			padding: 20px; 
		}
		.message { 
			margin-bottom: 20px; 
			padding: 15px; 
			border-radius: 8px; 
			background-color: #f8f9fa; 
			border-left: 4px solid #007bff; 
		}
		.message.system { 
			border-left-color: #dc3545; 
			background-color: #f8d7da; 
		}
		.sender { 
			font-weight: bold; 
			color: #007bff; 
			margin-bottom: 5px; 
			font-size: 1.1em; 
		}
		.message.system .sender { 
			color: #dc3545; 
		}
		.timestamp { 
			color: #666; 
			font-size: 0.85em; 
			margin-bottom: 8px; 
		}
		.text { 
			margin-bottom: 5px; 
		}
		.reply { 
			font-style: italic; 
			color: #666; 
			margin-top: 8px; 
			padding: 8px; 
			background-color: #e9ecef; 
			border-radius: 4px; 
			border-left: 3px solid #6c757d; 
		}
		.media-indicator { 
			display: inline-block; 
			background-color: #28a745; 
			color: white; 
			padding: 2px 8px; 
			border-radius: 12px; 
			font-size: 0.8em; 
			margin-left: 8px; 
		}
		.media-content {
			margin-top: 10px;
			padding: 10px;
			background-color: #f8f9fa;
			border-radius: 8px;
			border: 1px solid #dee2e6;
		}
		.media-image {
			max-width: 100%;
			max-height: 300px;
			border-radius: 8px;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
		}
		.media-url {
			word-break: break-all;
			color: #007bff;
			text-decoration: none;
			font-size: 0.9em;
		}
		.media-url:hover {
			text-decoration: underline;
		}
		@media print { 
			body { margin: 0; background-color: white; }
			.container { box-shadow: none; }
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Chat History Export</h1>
			<p><strong>Chat:</strong> ${chatName}</p>
			<p><strong>Type:</strong> ${activeChat.chatType || '1-1'}</p>
			<p><strong>Participants:</strong> ${activeChat.participants?.map((p) => p.username)?.join(', ')}</p>
			<p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
			<p><strong>Total Messages:</strong> ${messages.length}</p>
		</div>
		
		<div class="messages-container">
			${messages
				?.map((msg, _) => {
					const sender = activeChat.participants?.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId;
					const timestamp = msg.timestamp.toLocaleString();
					const messageType = msg.imageUrl ? 'IMAGE' : msg.videoUrl ? 'VIDEO' : '';
					const isSystem = msg.isSystemMessage;
					const replyText = msg.replyTo ? msg.quotedText : '';

					let mediaContent = '';
					if (msg.imageUrl) {
						mediaContent = `
							<div class="media-content">
								<img src="${msg.imageUrl}" alt="Image" class="media-image" />
								<br />
								<a href="${msg.imageUrl}" target="_blank" class="media-url">View Full Image</a>
							</div>
						`;
					} else if (msg.videoUrl) {
						mediaContent = `
							<div class="media-content">
								<a href="${msg.videoUrl}" target="_blank" class="media-url">View Video: ${msg.videoUrl}</a>
							</div>
						`;
					}

					return `<div class="message ${isSystem ? 'system' : ''}">
						<div class="sender">${sender}</div>
						<div class="timestamp">${timestamp}</div>
						<div class="text">
							${isSystem ? '[SYSTEM] ' : ''}${msg.text}
							${messageType ? `<span class="media-indicator">${messageType}</span>` : ''}
						</div>
						${mediaContent}
						${replyText ? `<div class="reply">[Reply to: ${replyText}]</div>` : ''}
					</div>`;
				})
				?.join('')}
		</div>
	</div>
</body>
</html>`;

			// Create and download file
			const blob = new Blob([htmlContent], {
				type: 'text/html',
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			// Generate filename
			const timestamp = new Date().toISOString().split('T')[0];
			a.download = `chat-history-${chatName}-${timestamp}.html`;

			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading HTML chat history:', error);
		}
	}, [activeChat, messages, user?.firebaseUserId]);

	const downloadChatHistoryAsTXT = useCallback(async () => {
		if (!activeChat || !messages.length) {
			console.error('No active chat or messages to download');
			return;
		}

		try {
			// Create TXT content
			const chatName = activeChat.groupName || activeChat.participants?.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.username || 'chat';

			let txtContent = `CHAT HISTORY EXPORT\n`;
			txtContent += `==================\n\n`;
			txtContent += `Chat: ${chatName}\n`;
			txtContent += `Type: ${activeChat.chatType || '1-1'}\n`;
			txtContent += `Participants: ${activeChat.participants?.map((p) => p.username)?.join(', ')}\n`;
			txtContent += `Export Date: ${new Date().toLocaleString()}\n`;
			txtContent += `Total Messages: ${messages.length}\n\n`;
			txtContent += `MESSAGES\n`;
			txtContent += `========\n\n`;

			// Add messages
			messages?.forEach((msg, index) => {
				const sender = activeChat.participants?.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId;
				const timestamp = msg.timestamp.toLocaleString();
				const messageType = msg.imageUrl ? '[IMAGE]' : msg.videoUrl ? '[VIDEO]' : '';

				txtContent += `${index + 1}. ${sender} (${timestamp})\n`;
				if (msg.isSystemMessage) {
					txtContent += `   [SYSTEM] ${msg.text}\n`;
				} else {
					txtContent += `   ${msg.text} ${messageType}\n`;
				}

				// Add media URLs
				if (msg.imageUrl) {
					txtContent += `   Image URL: ${msg.imageUrl}\n`;
				}
				if (msg.videoUrl) {
					txtContent += `   Video URL: ${msg.videoUrl}\n`;
				}

				if (msg.replyTo) {
					txtContent += `   [Reply to message: ${msg.quotedText}]\n`;
				}
				txtContent += `\n`;
			});

			// Create and download file
			const blob = new Blob([txtContent], {
				type: 'text/plain',
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			// Generate filename
			const timestamp = new Date().toISOString().split('T')[0];
			a.download = `chat-history-${chatName}-${timestamp}.txt`;

			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading TXT chat history:', error);
		}
	}, [activeChat, messages, user?.firebaseUserId]);

	return {
		downloadChatHistory,
		downloadChatHistoryAsPDF,
		downloadChatHistoryAsHTML,
		downloadChatHistoryAsTXT,
	};
};
