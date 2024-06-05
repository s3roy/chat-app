import React from 'react';

import { AppProps } from 'next/app';
import { CSSReset, ChakraProvider } from '@chakra-ui/react';
import Head from 'next/head';
function App({ Component, pageProps }: AppProps): React.ReactNode {
  return (
    <ChakraProvider>
      <CSSReset />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}
export default App;