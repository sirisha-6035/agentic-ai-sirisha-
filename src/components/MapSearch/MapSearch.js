import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons
const hotelIcon = L.icon({
  iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const restaurantIcon = L.icon({
  iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678132-map-marker-512.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const attractionIcon = L.icon({
  iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapSearch = ({ onLocationSelect, initialPosition = [20.5937, 78.9629] }) => {
  const [position, setPosition] = useState(initialPosition);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pois, setPois] = useState({ hotels: [], restaurants: [], attractions: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef();

  const fetchPOIs = async (lat, lon) => {
    try {
      const radius = 2000; // 2km radius
      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      
      // Query for hotels
      const hotelResponse = await fetch(`${overpassUrl}?data=[out:json];(
        node["tourism"="hotel"](around:${radius},${lat},${lon});
        way["tourism"="hotel"](around:${radius},${lat},${lon});
        relation["tourism"="hotel"](around:${radius},${lat},${lon});
      );out body;>;out skel qt;`);
      
      // Query for restaurants
      const restaurantResponse = await fetch(`${overpassUrl}?data=[out:json];(
        node["amenity"="restaurant"](around:${radius},${lat},${lon});
        way["amenity"="restaurant"](around:${radius},${lat},${lon});
        relation["amenity"="restaurant"](around:${radius},${lat},${lon});
      );out body;>;out skel qt;`);

      // Query for tourist attractions
      const attractionResponse = await fetch(`${overpassUrl}?data=[out:json];(
        node["tourism"~"attraction|museum|viewpoint"](around:${radius},${lat},${lon});
        way["tourism"~"attraction|museum|viewpoint"](around:${radius},${lat},${lon});
        relation["tourism"~"attraction|museum|viewpoint"](around:${radius},${lat},${lon});
      );out body;>;out skel qt;`);

      const [hotels, restaurants, attractions] = await Promise.all([
        hotelResponse.json(),
        restaurantResponse.json(),
        attractionResponse.json()
      ]);

      setPois({
        hotels: hotels.elements || [],
        restaurants: restaurants.elements || [],
        attractions: attractions.elements || []
      });
    } catch (err) {
      console.error('Error fetching POIs:', err);
      setError('Failed to load nearby places. Please try again.');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const firstResult = data[0];
        const newPosition = [parseFloat(firstResult.lat), parseFloat(firstResult.lon)];
        setPosition(newPosition);
        setSearchResults(data);
        
        // Fetch POIs after setting the position
        await fetchPOIs(newPosition[0], newPosition[1]);
        
        if (onLocationSelect) {
          onLocationSelect({
            lat: newPosition[0],
            lng: newPosition[1],
            displayName: firstResult.display_name,
            address: firstResult
          });
        }

        // Update map view
        if (mapRef.current) {
          mapRef.current.flyTo(newPosition, 15);
        }
      } else {
        setError('No results found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setError('Failed to search location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    map.setView(center, zoom);
    return null;
  };

  // Function to render POI markers
  const renderPOIMarkers = (items, icon, type) => {
    return items.map((item, index) => {
      const lat = item.lat || item.center?.lat;
      const lon = item.lon || item.center?.lon;
      
      if (!lat || !lon) return null;
      
      const name = item.tags?.name || `Unnamed ${type}`;
      const address = item.tags?.['addr:street'] || 'Address not available';
      
      return (
        <Marker 
          key={`${type}-${index}`} 
          position={[lat, lon]} 
          icon={icon}
        >
          <Popup>
            <div>
              <strong>{name}</strong><br />
              <small>{type.charAt(0).toUpperCase() + type.slice(1)}</small><br />
              <small>{address}</small>
            </div>
          </Popup>
        </Marker>
      );
    });
  };

  return (
    <div className="map-search-container">
      <div className="search-box">
        <form onSubmit={handleSearch} className="d-flex mb-3">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        {error && <div className="alert alert-danger">{error}</div>}
      </div>
      
      <div className="map-container" style={{ height: '500px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          <ChangeView center={position} zoom={13} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Current location marker */}
          {position && (
            <Marker position={position}>
              <Popup>
                <strong>Your Location</strong><br />
                {searchResults[0]?.display_name || 'Selected Location'}
              </Popup>
            </Marker>
          )}
          
          {/* Nearby POIs */}
          {renderPOIMarkers(pois.hotels, hotelIcon, 'hotel')}
          {renderPOIMarkers(pois.restaurants, restaurantIcon, 'restaurant')}
          {renderPOIMarkers(pois.attractions, attractionIcon, 'attraction')}
          
          {/* Search radius circle */}
          <Circle 
            center={position} 
            radius={2000} // 2km radius
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
          />
        </MapContainer>
        
        <div className="map-legend p-2" style={{
          position: 'absolute',
          bottom: '20px',
          right: '10px',
          backgroundColor: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          zIndex: 1000,
          fontSize: '12px'
        }}>
          <div className="legend-item d-flex align-items-center mb-1">
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'red',
              borderRadius: '50%',
              marginRight: '5px',
              display: 'inline-block'
            }}></div>
            <span>Hotels</span>
          </div>
          <div className="legend-item d-flex align-items-center mb-1">
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'green',
              borderRadius: '50%',
              marginRight: '5px',
              display: 'inline-block'
            }}></div>
            <span>Restaurants</span>
          </div>
          <div className="legend-item d-flex align-items-center">
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'purple',
              borderRadius: '50%',
              marginRight: '5px',
              display: 'inline-block'
            }}></div>
            <span>Attractions</span>
          </div>
        </div>
      </div>
      
      {searchResults.length > 0 && (
        <div className="search-results mt-3">
          <h5>Search Results:</h5>
          <ul className="list-group">
            {searchResults.slice(0, 5).map((result, index) => (
              <li 
                key={index} 
                className="list-group-item list-group-item-action"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  const newPosition = [parseFloat(result.lat), parseFloat(result.lon)];
                  setPosition(newPosition);
                  setSearchQuery(result.display_name);
                  if (onLocationSelect) {
                    onLocationSelect({
                      lat: newPosition[0],
                      lng: newPosition[1],
                      displayName: result.display_name,
                      address: result
                    });
                  }
                }}
              >
                {result.display_name}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <style jsx global>{`
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }
        .map-search-container {
          margin: 20px 0;
        }
      `}</style>
    </div>
  );
};

export default MapSearch;
