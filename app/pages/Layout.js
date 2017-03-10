import React from 'react';
import { Link } from 'react-router';

import { Container } from 'semantic-ui-react';

import Head from '../components/Head';
import Footer from '../components/Footer';

class Layout extends React.Component {
  render () {
    return (
      <div>
        <Head />
        <Container fluid>
          {this.props.children} 
        </Container>
      </div>
    )
  }
}

module.exports = Layout;