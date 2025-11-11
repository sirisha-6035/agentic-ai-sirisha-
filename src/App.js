import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import MapDemo from './pages/MapDemo';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">TravelYaari</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                <Nav.Link as={Link} to="/map-demo">Map Search</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container className="mt-4">
          <Routes>
            <Route path="/map-demo" element={<MapDemo />} />
            <Route path="/" element={
              <div className="text-center py-5">
                <h1>Welcome to TravelYaari</h1>
                <p className="lead">Your one-stop travel companion</p>
                <div className="mt-4">
                  <Link to="/map-demo" className="btn btn-primary btn-lg">
                    Try Our Map Search
                  </Link>
                </div>
              </div>
            } />
          </Routes>
        </Container>
      </div>
    </Router>
  );
};

export default App;
