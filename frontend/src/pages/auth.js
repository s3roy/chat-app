import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Input, VStack, Text } from '@chakra-ui/react';

export default function Auth() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      router.push('/chat');
    }
  }, [router]);

  const handleLogin = () => {
    localStorage.setItem('username', username);
    router.push('/chat');
  };

  return (
    <Box p={4} bg="gray.100" minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={4} p={6} bg="white" borderRadius="md" boxShadow="md">
        <Text fontSize="2xl" mb={4}>Login</Text>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
        <Button onClick={handleLogin} colorScheme="blue">Login</Button>
      </VStack>
    </Box>
  );
}
