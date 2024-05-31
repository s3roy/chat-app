import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Input, VStack, Heading } from '@chakra-ui/react';

export default function Auth() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username) {
      localStorage.setItem('username', username);
      router.push('/chat');
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      bg="gray.100"
    >
      <VStack
        as="form"
        onSubmit={handleLogin}
        spacing={4}
        p={6}
        boxShadow="lg"
        bg="white"
        borderRadius="md"
      >
        <Heading as="h1" size="lg">
          Login
        </Heading>
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
        <Button type="submit" colorScheme="blue">
          Login
        </Button>
      </VStack>
    </Box>
  );
}
