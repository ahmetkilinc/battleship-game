import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Socket } from 'socket.io-client';
import { Message, Room } from '../types/game';

interface ChatProps {
  socket: Socket | null;
  room: Room | null;
  isCurrentPlayer: boolean;
}

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 400px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
`;

const ChatHeader = styled.div`
  background-color: #3498db;
  color: white;
  padding: 10px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  &:hover {
    opacity: 0.8;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MessageBubble = styled.div<{ isCurrentPlayer: boolean }>`
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 16px;
  background-color: ${({ isCurrentPlayer }) => isCurrentPlayer ? '#3498db' : '#f1f1f1'};
  color: ${({ isCurrentPlayer }) => isCurrentPlayer ? 'white' : 'black'};
  align-self: ${({ isCurrentPlayer }) => isCurrentPlayer ? 'flex-end' : 'flex-start'};
  word-break: break-word;
`;

const MessageInfo = styled.div`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
`;

const InputContainer = styled.form`
  display: flex;
  padding: 10px;
  border-top: 1px solid #ddd;
`;

const Input = styled.input`
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  &:focus {
    border-color: #3498db;
  }
`;

const SendButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  margin-left: 8px;
  cursor: pointer;
  &:hover {
    background-color: #2980b9;
  }
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ChatToggleButton = styled.button<{ hasUnread: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: ${({ hasUnread }) => hasUnread ? '#e74c3c' : '#3498db'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: background-color 0.3s ease, transform 0.2s ease;
  
  &:hover {
    background-color: ${({ hasUnread }) => hasUnread ? '#c0392b' : '#2980b9'};
    transform: scale(1.05);
  }
  
  ${({ hasUnread }) => hasUnread && `
    animation: pulse 1.5s infinite;
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
      }
    }
  `}
`;

const UnreadBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
`;

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Chat: React.FC<ChatProps> = ({ socket, room, isCurrentPlayer }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!socket || !room) return;

    // Request message history when component mounts
    socket.emit('getMessages', room.id);

    // Listen for message history
    const handleMessageHistory = (messageHistory: Message[]) => {
      setMessages(messageHistory);
      if (messageHistory.length > 0) {
        lastMessageTimestampRef.current = messageHistory[messageHistory.length - 1].timestamp;
      }
    };

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // If chat is closed and message is not from current player, increment unread count
      if (!isOpen && message.playerId !== socket.id) {
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on('messageHistory', handleMessageHistory);
    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('messageHistory', handleMessageHistory);
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, room, isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !room || !newMessage.trim()) return;

    socket.emit('sendMessage', {
      roomId: room.id,
      text: newMessage.trim()
    });

    setNewMessage('');
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset unread count when opening chat
      setUnreadCount(0);
    }
  };

  if (!isOpen) {
    return (
      <ChatToggleButton onClick={toggleChat} hasUnread={unreadCount > 0}>
        💬
        {unreadCount > 0 && <UnreadBadge>{unreadCount > 99 ? '99+' : unreadCount}</UnreadBadge>}
      </ChatToggleButton>
    );
  }

  return (
    <ChatContainer>
      <ChatHeader>
        <span>Chat</span>
        <CloseButton onClick={toggleChat}>✕</CloseButton>
      </ChatHeader>
      <MessagesContainer>
        {messages.map(message => (
          <div key={message.id}>
            <MessageInfo>
              {message.playerName} • {formatTime(message.timestamp)}
            </MessageInfo>
            <MessageBubble isCurrentPlayer={message.playerId === socket?.id}>
              {message.text}
            </MessageBubble>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <InputContainer onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <SendButton type="submit" disabled={!newMessage.trim()}>
          Send
        </SendButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chat; 