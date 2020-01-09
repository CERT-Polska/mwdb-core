import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import { Provider } from "react-redux";
import store from "./store";

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css';
import './styles/index.css';
import "swagger-ui-react/swagger-ui.css"

ReactDOM.render((
  <Provider store={store}>
      <App />
  </Provider>
), document.getElementById('root'));
