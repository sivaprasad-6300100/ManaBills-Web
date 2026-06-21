import './App.css';
import AppRoutes from './routes/AppRoutes';
import InstallPrompt from './InstallPrompt';

function App() {
  return (
    <>
      <InstallPrompt />
      <AppRoutes />
    </>
  );
}

export default App;