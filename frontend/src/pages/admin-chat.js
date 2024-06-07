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

const socket = io(process.env.BACKEND_URL);

export default function AdminChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [typingStatus, setTypingStatus] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const router = useRouter();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const storedAdminUsername = localStorage.getItem('adminUsername');
    if (!storedAdminUsername) {
      router.push('/admin-auth');
    } else {
      setAdminUsername(storedAdminUsername);
      socket.emit('user connected', storedAdminUsername);
    }

    socket.on('initial messages', (initialMessages) => {
      setMessages(initialMessages);
    });

    socket.on('chat message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
      scrollToBottom();
      // Display browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Message', {
          body: `${msg.username}: ${msg.message}`,
        });
      }
    });

    socket.on('user status', (status) => {
      setUserStatuses((prevStatuses) => ({
        ...prevStatuses,
        [status.username]: status.online,
      }));
    });

    socket.on('typing', (data) => {
      if (data.username !== adminUsername) {
        setTypingStatus(`${data.username} is typing: ${data.message}`);
        setTimeout(() => setTypingStatus(''), 3000);
      }
    });

    return () => {
      socket.off('chat message');
      socket.off('user status');
      socket.off('typing');
    };
  }, [router, adminUsername]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      socket.emit('chat message', { username: adminUsername, message });
      setMessage('');
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', { username: adminUsername, message: e.target.value });
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
    let lastUsername = null;

    messages.forEach((msg, index) => {
      const messageDate = new Date(msg.timestamp);
      const isNewDay = !lastMessageDate || !isSameDay(lastMessageDate, messageDate);
      const showUsername = msg.username !== lastUsername;

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
          <Flex justify={msg.username === adminUsername ? 'flex-end' : 'flex-start'}>
            <Box
              bg={msg.username === adminUsername ? 'blue.100' : 'gray.200'}
              p={3}
              borderRadius="md"
              maxWidth="70%"
            >
              {showUsername && (
                <Text fontWeight="bold" mb={1}>
                  {msg.username}
                </Text>
              )}
              <Text>{msg.message}</Text>
              <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
                {format(messageDate, 'p')}
              </Text>
            </Box>
          </Flex>
        </ListItem>
      );

      lastMessageDate = messageDate;
      lastUsername = msg.username;
    });

    return messageElements;
  };

  return (
    <Flex direction="column" height="100vh" bg="gray.100" onLoad={requestNotificationPermission}>
      <Box bg="blue.500" p={4} color="white">
        <Text fontSize="xl">Admin Chat</Text>
      </Box>
      <Center py={2}>
        {Object.keys(userStatuses)
          .filter(username => username !== adminUsername && userStatuses[username])
          .map(username => (
            <Badge colorScheme="green" mr={2} key={username}>
              {username} Online
            </Badge>
          ))}
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
            onChange={handleTyping}
            placeholder="Type a message"
            bg="white"
          />
          <Button type="submit" colorScheme="blue">
            Send
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
}
