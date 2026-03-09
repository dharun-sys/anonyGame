import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lobby from './components/Lobby';
import RoomView from './components/RoomView';
import './App.css';

/*
  Run Backend:
    cd /home/dharun/drive_1/anonyGame/backend
    rm -rf dist && ./node_modules/.bin/tsc -p tsconfig.json
    node dist/server.js

  Run Frontend:
    cd /home/dharun/drive_1/anonyGame/my-react-app
    npm run dev
*/

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<RoomView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
