import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from "react-router";

import Layout from './pages/Layout';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

ReactDOM.render(
  <Router history={browserHistory}>
    <Route path="" component={Layout}>
      <Route path="logs" component={Logs} />
      <Route path="settings" component={Settings} />
      <Route path="*" component={Logs}/>
    </Route>
  </Router>,
document.getElementById('app'));