import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';

import Layout from './pages/Layout';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Help from './pages/Help';

ReactDOM.render(
  <BrowserRouter>
    <Layout>
      <Switch>
        <Route exact path="/" component={Logs} />
        <Route exact path="/settings" component={Settings} />
        <Route exact path="/help" component={Help} />
        <Redirect to="/" />
      </Switch>
    </Layout>
  </BrowserRouter>,
  document.getElementById('app')
);
