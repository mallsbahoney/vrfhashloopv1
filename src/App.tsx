import HomePage from '@/components/HomePage';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/hooks/use-theme';
// import { OAuthProvider } from '@/contexts/OAuthContext';
import { JSX } from 'react';
import { Route, Routes } from 'react-router-dom';

function App(): JSX.Element {
  return (
    <ThemeProvider>
      {/* NOTE: UI Generator - Uncomment OAuthProvider wrapper below if OAuth functionality is needed.
          See .claude/skills/oauth/docs/implementation-guide.md for OAuth implementation guide. */}
      {/* <OAuthProvider> */}
      <div
        id='app-container'
        className='relative min-h-screen flex flex-col bg-background'
      >
        <main id='app-main' className='flex-1'>
          <Routes>
            <Route path='/' element={<HomePage />} />
          </Routes>
        </main>

        <Toaster />
      </div>
      {/* </OAuthProvider> */}
    </ThemeProvider>
  );
}

export default App;
