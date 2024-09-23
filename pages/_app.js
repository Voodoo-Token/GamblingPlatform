import { SignerProvider } from '@/state/signer'
import '@/styles/globals.css'

export default function App({ Component, pageProps }) {
  return ( 
  <SignerProvider>
  <Component {...pageProps} />
  </SignerProvider>
  )
}
