import { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Input, VStack, Heading } from '@chakra-ui/react';

export default function AdminAuth() {
  const [adminUsername, setAdminUsername] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminUsername) {
      localStorage.setItem('adminUsername', adminUsername);
      router.push('/admin-chat');
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
          Admin Login
        </Heading>
        <Input
          type="text"
          value={adminUsername}
          onChange={(e) => setAdminUsername(e.target.value)}
          placeholder="Enter admin username"
        />
        <Button type="submit" colorScheme="blue">
          Login
        </Button>
      </VStack>
    </Box>
  );
}
