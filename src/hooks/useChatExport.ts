import { useCallback } from 'react';
import { Chat, Message } from '../pages/Messages';
import { User } from '../interfaces/user';

export interface UseChatExportProps {
	activeChat: Chat | null;
	messages: Message[];
	user: User | null | undefined;
}

export interface UseChatExportReturn {
	downloadChatHistoryAsPDF: () => Promise<void>;
	downloadChatHistoryAsTXT: () => Promise<void>;
}

function escapeHtml(value: unknown): string {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Only allow http(s) URLs in export markup (blocks javascript: / data: etc.). */
function safeHttpUrl(url: unknown): string | null {
	if (typeof url !== 'string' || !url.trim()) return null;
	try {
		const parsed = new URL(url.trim());
		if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
			return parsed.href;
		}
	} catch {
		/* ignore invalid */
	}
	return null;
}

export const useChatExport = ({ activeChat, messages, user }: UseChatExportProps): UseChatExportReturn => {
	const downloadChatHistoryAsPDF = useCallback(async () => {
		if (!activeChat || !messages.length) {
			console.error('No active chat or messages to download');
			return;
		}

		try {
			const chatName =
				activeChat.groupName || activeChat.participants?.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.username || 'chat';
			const safeChatName = escapeHtml(chatName);
			const safeChatType = escapeHtml(activeChat.chatType || '1-1');
			const safeParticipants = escapeHtml(activeChat.participants?.map((p) => p.username)?.join(', ') || '');
			const safeExportDate = escapeHtml(new Date().toLocaleString());

			const printWindow = window.open('', '_blank');
			if (printWindow) {
				printWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>Chat History - ${safeChatName}</title>
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
							<p><strong>Chat:</strong> ${safeChatName}</p>
							<p><strong>Type:</strong> ${safeChatType}</p>
							<p><strong>Participants:</strong> ${safeParticipants}</p>
							<p><strong>Export Date:</strong> ${safeExportDate}</p>
							<p><strong>Total Messages:</strong> ${messages.length}</p>
						</div>
						
						<div class="messages">
							${messages
								?.map((msg) => {
									const sender =
										activeChat.participants?.find((p) => p.firebaseUserId === msg.senderId)?.username || msg.senderId;
									const timestamp = msg.timestamp.toLocaleString();
									const messageType = msg.imageUrl ? '[IMAGE]' : msg.videoUrl ? '[VIDEO]' : '';
									const isSystem = msg.isSystemMessage;
									const replyText = msg.replyTo ? msg.quotedText : '';
									const safeImageUrl = safeHttpUrl(msg.imageUrl);
									const safeVideoUrl = safeHttpUrl(msg.videoUrl);

									let mediaContent = '';
									if (safeImageUrl) {
										const escapedUrl = escapeHtml(safeImageUrl);
										mediaContent = `
											<div class="media-content">
												<img src="${escapedUrl}" alt="Image" class="media-image" />
												<br />
												<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="media-url">View Full Image</a>
											</div>
										`;
									} else if (safeVideoUrl) {
										const escapedUrl = escapeHtml(safeVideoUrl);
										mediaContent = `
											<div class="media-content">
												<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="media-url">View Video: ${escapedUrl}</a>
											</div>
										`;
									}

									return `
									<div class="message ${isSystem ? 'system' : ''}">
										<div class="sender">${escapeHtml(sender)}</div>
										<div class="timestamp">${escapeHtml(timestamp)}</div>
										<div class="text">${isSystem ? '[SYSTEM] ' : ''}${escapeHtml(msg.text)} ${escapeHtml(messageType)}</div>
										${mediaContent}
										${replyText ? `<div class="reply">[Reply to: ${escapeHtml(replyText)}]</div>` : ''}
									</div>
								`;
								})
								?.join('')}
						</div>
					</body>
					</html>
				`);
				printWindow.document.close();

				setTimeout(() => {
					printWindow.print();
					printWindow.close();
				}, 500);
			}
		} catch (error) {
			console.error('Error downloading PDF:', error);
		}
	}, [activeChat, messages, user?.firebaseUserId]);

	const downloadChatHistoryAsTXT = useCallback(async () => {
		if (!activeChat || !messages.length) {
			console.error('No active chat or messages to download');
			return;
		}

		try {
			const chatName =
				activeChat.groupName || activeChat.participants?.find((p) => p.firebaseUserId !== user?.firebaseUserId)?.username || 'chat';

			let txtContent = `CHAT HISTORY EXPORT\n`;
			txtContent += `==================\n\n`;
			txtContent += `Chat: ${chatName}\n`;
			txtContent += `Type: ${activeChat.chatType || '1-1'}\n`;
			txtContent += `Participants: ${activeChat.participants?.map((p) => p.username)?.join(', ')}\n`;
			txtContent += `Export Date: ${new Date().toLocaleString()}\n`;
			txtContent += `Total Messages: ${messages.length}\n\n`;
			txtContent += `MESSAGES\n`;
			txtContent += `========\n\n`;

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

			const blob = new Blob([txtContent], {
				type: 'text/plain',
			});

			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

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
		downloadChatHistoryAsPDF,
		downloadChatHistoryAsTXT,
	};
};
