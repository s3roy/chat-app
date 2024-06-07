import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useRouter } from "next/router";
import { format, isSameDay } from "date-fns";
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
  useColorModeValue,
} from "@chakra-ui/react";

const socket = io(process.env.BACKEND_URL);

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [typingStatus, setTypingStatus] = useState("");
  const [username, setUsername] = useState("");
  const router = useRouter();
  const messagesEndRef = useRef(null);

  const bgColor = useColorModeValue("gray.100", "gray.900");
  const msgBgColor = useColorModeValue("white", "gray.800");
  const msgTextColor = useColorModeValue("gray.700", "gray.200");
  const myMsgBgColor = useColorModeValue("pink.100", "pink.700");
  const myMsgTextColor = useColorModeValue("gray.800", "gray.200");
  const adminMsgBgColor = useColorModeValue("blue.100", "blue.500");
  const adminMsgTextColor = useColorModeValue("black", "white");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      router.push("/auth");
    } else {
      setUsername(storedUsername);
      socket.emit("user connected", storedUsername);

      socket.on("connect", () => {
        socket.emit("request initial messages");
      });

      socket.on("initial messages", (initialMessages) => {
        const filteredMessages = initialMessages.filter(
          (msg) => msg.username === "admin" || msg.username === storedUsername
        );
        setMessages(filteredMessages);
      });

      socket.on("chat message", (msg) => {
        if (msg.username === "admin" || msg.username === username) {
          setMessages((prevMessages) => [...prevMessages, msg]);
          scrollToBottom();
          if (Notification.permission === "granted") {
            new Notification("New Message", {
              body: `${msg.username}: ${msg.message}`,
            });
          }
        }
      });

      socket.on("user status", (status) => {
        setUserStatuses((prevStatuses) => ({
          ...prevStatuses,
          [status.username]: status.online,
        }));
      });

      socket.on("typing", (data) => {
        if (data.username !== storedUsername) {
          setTypingStatus(`${data.username} is typing: ${data.message}`);
          setTimeout(() => setTypingStatus(""), 3000);
        }
      });

      return () => {
        socket.off("connect");
        socket.off("initial messages");
        socket.off("chat message");
        socket.off("user status");
        socket.off("typing");
      };
    }
  }, [router, username]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
      socket.emit("chat message", { username, message });
      setMessage("");
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", { username, message: e.target.value });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const requestNotificationPermission = () => {
    if (Notification.permission !== "granted") {
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
              {format(messageDate, "eeee, MMMM d")}
            </Text>
            <Divider />
          </Center>
        );
      }

      messageElements.push(
        <ListItem key={msg.id} mb={3}>
          <Flex justify={msg.username === username ? "flex-end" : "flex-start"}>
            <Box
              bg={msg.username === username ? myMsgBgColor : msg.username === "admin" ? adminMsgBgColor : msgBgColor}
              p={3}
              borderRadius="md"
              maxWidth="70%"
            >
              <Text color={msg.username === username ? myMsgTextColor : msg.username === "admin" ? adminMsgTextColor : msgTextColor}>
                {msg.message}
              </Text>
              <Text fontSize="xx-small" color="gray.500" mt={1} textAlign="right">
                {format(messageDate, "p")}
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
    <Flex
      direction="column"
      height="100vh"
      bg={bgColor}
      onLoad={requestNotificationPermission}
    >
      <Box bg="pink.500" p={4} color="white">
        <Text fontSize="xl">Souvik</Text>
      </Box>
      <Center py={2}>
        {userStatuses["admin"] && (
          <Badge colorScheme="pink" mr={2}>
            Souvik Online
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
        bg={msgBgColor}
      >
        <List spacing={3}>
          {renderMessages()}
          <div ref={messagesEndRef} />
        </List>
      </VStack>
      <Box p={4} bg={bgColor}>
        <HStack as="form" onSubmit={sendMessage} spacing={4}>
          <Input
            id="m"
            autoComplete="off"
            value={message}
            onChange={handleTyping}
            placeholder="Type a message"
            bg="white"
            flexGrow={1}
          />
          <Button type="submit" colorScheme="pink">
            Send
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
}
