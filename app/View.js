import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, hashHistory } from "react-router";

import Information from './pages/Information';
import Layout from './pages/Layout';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

ReactDOM.render(
  <Router history={hashHistory}>
    <Route path="/" component={Layout}>
      <IndexRoute component={Logs} />
      <Route path="settings" component={Settings} />
      <Route path="information" component={Information} />
    </Route>
  </Router>,
document.getElementById('app'));