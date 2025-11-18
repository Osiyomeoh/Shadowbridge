import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import SwapInterface from './pages/SwapInterface';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<SwapInterface />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
