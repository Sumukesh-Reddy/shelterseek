// components/HomeListings/HomeListings.jsx
import React, { useState, useEffect } from 'react';
import HomeBlock from '../HomeBlock/HomeBlock';
import {  categorizeSize } from '../sortedHousesUtils';
import './HomeListings.css';

const HomeListings = ({ filters }) => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSlowServerMessage, setShowSlowServerMessage] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let slowTimer;
    const fetchRooms = async () => {
      setIsLoading(true);
      setShowSlowServerMessage(false);

      // Set a timer to show the "please wait" message if the server takes > 3.5 seconds
      slowTimer = setTimeout(() => {
        setShowSlowServerMessage(true);
      }, 3500);

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/rooms`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          const processedRooms = result.data.map(room => ({
            ...room,
            size: categorizeSize(room.roomSize),
            host: {
              gen: room.hostGender || '',
              email: room.email || '',
              food: room.foodFacility || '',
              name: room.name || 'Unknown Host',
              image: room.hostImage || '/images/logo.png',
              yearsWithUs: room.yearsWithUs || 0,
              latitude: room.coordinates?.lat || 0,
              longitude: room.coordinates?.lng || 0
            },
            maxdays: room.maxStayDays || 10,
            amenities: Array.isArray(room.amenities) ? room.amenities : 
                      Object.keys(room.amenities || {}).filter(key => room.amenities[key])
          }));
          setRooms(processedRooms);
        } else {
          setError('No room data found.');
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError('Failed to load rooms. Please try again later.');
      } finally {
        clearTimeout(slowTimer);
        setIsLoading(false);
        setShowSlowServerMessage(false);
      }
    };
    fetchRooms();

    return () => {
      if (slowTimer) clearTimeout(slowTimer);
    };
  }, []);

  // Apply filters to rooms
  const filteredRooms = rooms.filter(room => {
    const homePrice = parseFloat(room.price);
    const matchesKeywords = !filters.searchKeywords || 
      filters.searchKeywords.split(',').map(k => k.trim().toLowerCase()).some(keyword => 
        room.title.toLowerCase().includes(keyword) || 
        room.location.toLowerCase().includes(keyword)
      );
    const matchesPrice = homePrice >= filters.minPrice && homePrice <= filters.maxPrice;
    const matchesRoomType = filters.roomType === 'any' || room.roomType?.toLowerCase() === filters.roomType;
    const matchesBedrooms = filters.bedrooms <= (room.bedrooms || 0);
    const matchesBeds = filters.beds <= (room.beds || 0);
    const matchesAdults = filters.adults <= (room.capacity || 0);
    const matchesChildren = filters.children <= (room.capacity || 0);
    const matchesPropertyType = filters.selectedTypes.length === 0 || 
    (room.propertyType && filters.selectedTypes.some(type => 
      room.propertyType.toLowerCase() === type.toLowerCase().replace(/\s+/g, '-')
    ));
      const matchesLocation = filters.selectedLocations.length === 0 || 
      (room.roomLocation && filters.selectedLocations.some(location => 
        room.roomLocation.toLowerCase() === location.toLowerCase().replace(/\s+/g, '-')
      ));
      const matchesAmenities = filters.selectedAmenities.length === 0 || 
      filters.selectedAmenities.every(amenity => {
        const amenityKey = amenity.toLowerCase().replace(/\s+/g, '-');
        return Array.isArray(room.amenities) && room.amenities.includes(amenityKey);
      });
    const matchesHostGender = filters.hostGender === 'any' || 
      room.hostGender?.toLowerCase() === filters.hostGender;
    const matchesRoomSize = filters.roomSize === 'any' || 
      room.size.toLowerCase() === filters.roomSize;
    const matchesTransport = filters.transport === 'Any' || 
      room.transportDistance === filters.transport;
      const matchesFoodPreferences = filters.foodPreferences.length === 0 || 
      (room.foodFacility && filters.foodPreferences.some(food => 
        room.foodFacility.toLowerCase() === food.toLowerCase()
      ));
    const matchesDays = !room.maxdays || room.maxdays >= filters.days;

    return (
      matchesKeywords &&
      matchesPrice &&
      matchesRoomType &&
      matchesBedrooms &&
      matchesBeds &&
      matchesAdults &&
      matchesChildren &&
      matchesPropertyType &&
      matchesLocation &&
      matchesAmenities &&
      matchesHostGender &&
      matchesRoomSize &&
      matchesTransport &&
      matchesFoodPreferences &&
      matchesDays
    );
  });

  useEffect(() => {
    console.log('Filtered rooms:', filteredRooms);
  }, [filteredRooms]);

  const SkeletonLoader = () => (
    <>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
        <div key={n} className="skeleton-card">
          <div className="skeleton skeleton-image"></div>
          <div className="skeleton-info">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-price"></div>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="main-home-block" id="homes-container">
      {showSlowServerMessage && (
        <div className="server-wakeup-notice">
          <div className="server-wakeup-icon">⏳</div>
          <div className="server-wakeup-text">
            <h4>Connecting to server...</h4>
            <p>Our backend is hosted on a free plan which sleeps after 15 minutes of inactivity. It is currently waking up. Please wait a minute or two for the site to load.</p>
          </div>
        </div>
      )}
      {isLoading && <SkeletonLoader />}
      {error && <div className="error-message animate-fade-in">{error}</div>}
      {filteredRooms.length === 0 && !isLoading && !error && (
        <div className="no-results animate-fade-in">No rooms match your filters.</div>
      )}
      {!isLoading && filteredRooms.map((room, index) => (
        <div key={room._id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
          <HomeBlock room={room} />
        </div>
      ))}
    </div>
  );
};

export default HomeListings;