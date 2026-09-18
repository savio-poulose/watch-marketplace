import { BrowserRouter, Routes, Route,  } from 'react-router-dom';
import Register from "./pages/Register.jsx"
import Home from './pages/Home.jsx';

function App() {
  return(
    <>
    <BrowserRouter>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path="/register" element={<Register/>}/>
    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
