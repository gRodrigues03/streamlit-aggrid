import React from 'react';
import { createRoot } from 'react-dom/client';
import AgGrid from './AgGrid';

const root = createRoot(document.getElementById('root')!);
root.render(<AgGrid />);