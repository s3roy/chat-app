import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useRouter } from 'next/router';
import { format, isSameDay } from 'date-fns';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  List,
  ListItem,
  Text,
  Flex,
  Center,
  Divider,
  Badge,
  Spinner,
} from '@chakra-ui/react';

const socket = io('http://localhost:3001');

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [typingStatus, setTypingStatus] = useState('');
  const [username, setUsername] = useState('');
  const router = useRouter();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/auth');
    } else {
      setUsername(storedUsername);
      socket.emit('user connected', storedUsername);
    }

    socket.on('initial messages', (initialMessages) => {
      const filteredMessages = initialMessages.filter(
        (msg) => msg.username === 'admin' || msg.username === storedUsername
      );
      setMessages(filteredMessages);
    });

    socket.on('chat message', (msg) => {
      if (msg.username === 'admin' || msg.username === username) {
        setMessages((prevMessages) => [...prevMessages, msg]);
        scrollToBottom();
        // Display browser notification
        if (Notification.permission === 'granted') {
          new Notification('New Message', {
            body: `${msg.username}: ${msg.message}`,
          });
        }
      }
    });

    socket.on('user status', (status) => {
      setUserStatuses((prevStatuses) => ({
        ...prevStatuses,
        [status.username]: status.online,
      }));
    });

    socket.on('typing', (username) => {
      if (username !== storedUsername) {
        setTypingStatus(`${username} is typing...`);
        setTimeout(() => setTypingStatus(''), 3000);
      }
    });

    return () => {
      socket.off('chat message');
      socket.off('user status');
      socket.off('typing');
    };
  }, [router, username]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      socket.emit('chat message', { username, message });
      setMessage('');
    }
  };

  const handleTyping = () => {
    socket.emit('typing', username);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const requestNotificationPermission = () => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const renderMessages = () => {
    const messageElements = [];
    let lastMessageDate = null;

    messages.forEach((msg, index) => {
      const messageDate = new Date(msg.timestamp);
      const isNewDay = !lastMessageDate || !isSameDay(lastMessageDate, messageDate);

      if (isNewDay) {
        messageElements.push(
          <Center key={`date-${index}`} my={4}>
            <Divider />
            <Text mx={2} fontSize="sm" color="gray.500">
              {format(messageDate, 'eeee, MMMM d')}
            </Text>
            <Divider />
          </Center>
        );
      }

      messageElements.push(
        <ListItem key={msg.id} mb={3}>
          <Flex justify={msg.username === username ? 'flex-end' : 'flex-start'}>
            <Box
              bg={msg.username === username ? 'green.100' : 'gray.200'}
              p={3}
              borderRadius="md"
              maxWidth="70%"
            >
              <Text>{msg.message}</Text>
              <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
                {format(messageDate, 'p')}
              </Text>
            </Box>
          </Flex>
        </ListItem>
      );

      lastMessageDate = messageDate;
    });

    return messageElements;
  };

  return (
    <Flex direction="column" height="100vh" bg="gray.100" onLoad={requestNotificationPermission}>
      <Box bg="green.500" p={4} color="white">
        <Text fontSize="xl">Chat with Admin</Text>
      </Box>
      <Center py={2}>
        {userStatuses['admin'] && (
          <Badge colorScheme="green" mr={2}>
            Admin Online
          </Badge>
        )}
        {typingStatus && (
          <Flex align="center">
            <Spinner size="sm" mr={2} />
            <Text>{typingStatus}</Text>
          </Flex>
        )}
      </Center>
      <VStack
        spacing={4}
        align="stretch"
        p={4}
        flex="1"
        overflowY="auto"
        bg="white"
      >
        <List spacing={3}>
          {renderMessages()}
          <div ref={messagesEndRef} />
        </List>
      </VStack>
      <Box p={4} bg="gray.100">
        <HStack as="form" onSubmit={sendMessage} spacing={4}>
          <Input
            id="m"
            autoComplete="off"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            bg="white"
            onKeyPress={handleTyping}
          />
          <Button type="submit" colorScheme="green">
            Send
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
}