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

const ChatToggleButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  &:hover {
    background-color: #2980b9;
  }
`;

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Chat: React.FC<ChatProps> = ({ socket, room, isCurrentPlayer }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket || !room) return;

    // Request message history when component mounts
    socket.emit('getMessages', room.id);

    // Listen for message history
    const handleMessageHistory = (messageHistory: Message[]) => {
      setMessages(messageHistory);
    };

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('messageHistory', handleMessageHistory);
    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('messageHistory', handleMessageHistory);
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, room]);

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
  };

  if (!isOpen) {
    return (
      <ChatToggleButton onClick={toggleChat}>
        💬
      </ChatToggleButton>
    );
  }

  return (
    <>
      <ChatToggleButton onClick={toggleChat} style={{ display: 'none' }}>
        💬
      </ChatToggleButton>
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
    </>
  );
};

export default Chat; 