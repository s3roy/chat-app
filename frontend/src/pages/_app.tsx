import React from 'react';

import { AppProps } from 'next/app';
import { CSSReset, ChakraProvider } from '@chakra-ui/react';
function App({ Component, pageProps }: AppProps): React.ReactNode {
  return (
    <ChakraProvider>
      <CSSReset />
      <Component {...pageProps} />
    </ChakraProvider>
  );
}
export default App;