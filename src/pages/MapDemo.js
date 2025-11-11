import React, { useState } from 'react';
import { Container, Card, Alert } from 'react-bootstrap';
import MapSearch from '../components/MapSearch/MapSearch';

const MapDemo = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Location Search with OpenStreetMap</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <MapSearch onLocationSelect={handleLocationSelect} />
        </Card.Body>
      </Card>

      {selectedLocation && (
        <Card>
          <Card.Header>Selected Location Details</Card.Header>
          <Card.Body>
            <h5>{selectedLocation.displayName}</h5>
            <div className="mt-2">
              <p className="mb-1"><strong>Latitude:</strong> {selectedLocation.lat.toFixed(6)}</p>
              <p className="mb-1"><strong>Longitude:</strong> {selectedLocation.lng.toFixed(6)}</p>
              {selectedLocation.address && (
                <div className="mt-2">
                  <h6>Address Details:</h6>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em' }}>
                    {JSON.stringify(selectedLocation.address, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      <Alert variant="info" className="mt-4">
        <h5>How to use:</h5>
        <ol>
          <li>Enter a location in the search box (e.g., "Taj Mahal, India")</li>
          <li>Click on any result to center the map on that location</li>
          <li>View the selected location details below the map</li>
        </ol>
      </Alert>
    </Container>
  );
};

export default MapDemo;
