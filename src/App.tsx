import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
// import icon from '../assets/icon.svg';

import './App.global.css';

import Editor from './Pages/Editor';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Editor} />
      </Switch>
    </Router>
  );
}
