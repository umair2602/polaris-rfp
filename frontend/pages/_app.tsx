import '../styles/globals.css'
import Head from 'next/head'
import type { AppProps } from 'next/app'
import { ToastProvider } from '../components/ui/Toast'
import { AuthProvider } from '../lib/auth'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.png" />
      </Head>
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Component {...pageProps} />
          </div>
        </AuthProvider>
      </ToastProvider>
    </>
  )
}