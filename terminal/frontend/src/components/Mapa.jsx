import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import "../styles/Mapa.css";

const SOCKET_URL = "http://localhost:4004";

const Mapa = () => {
  const location = useLocation();
  const ruta = location.state?.ruta;
  const bus = location.state?.bus;
  const showBusLocation = location.state?.showBusLocation; // true si viene de ticket, false si solo quiere ver la ruta
  const [municipios, setMunicipios] = useState([]);
  const [lugares, setLugares] = useState([]); // NUEVO: lugares relevantes
  const [busLocation, setBusLocation] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Siempre conectar socket si hay bus, para saber si hay ubicación activa
    if (bus && bus.bus_id) {
      socketRef.current = io(SOCKET_URL);

      socketRef.current.emit("joinBus", bus.bus_id);

      socketRef.current.on("busLocation", (data) => {
        setBusLocation({
          lat: data.lat,
          lng: data.lng,
          timestamp: data.timestamp,
        });
        if (markerRef.current && mapRef.current) {
          markerRef.current.setPosition({ lat: data.lat, lng: data.lng });
          mapRef.current.panTo({ lat: data.lat, lng: data.lng });
        }
      });

      return () => {
        socketRef.current.emit("leaveBus", bus.bus_id);
        socketRef.current.disconnect();
      };
    }
  }, [bus]);

  useEffect(() => {
    const mapContainer = document.getElementById("map");
    if (mapContainer) {
      mapContainer.innerHTML = "";
    }
    if (!mapContainer || !ruta || !ruta.origen || !ruta.destino) return;

    const scriptId = "google-maps-script";
    const existingScript = document.getElementById(scriptId);

    const loadGoogleMaps = () => {
      if (typeof google !== "undefined") {
        initializeMap();
      }
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places";
      script.async = true;
      script.defer = true;
      script.onload = loadGoogleMaps;
      script.onerror = () => {
        mapContainer.innerHTML =
          '<p style="color: red; text-align: center;">Error al cargar el mapa.</p>';
      };
      document.body.appendChild(script);
    } else {
      loadGoogleMaps();
    }
    // eslint-disable-next-line
  }, [ruta]);

  const initializeMap = () => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    const map = new google.maps.Map(mapContainer, {
      center: { lat: 0, lng: 0 },
      zoom: 8,
    });
    mapRef.current = map;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode(
      { address: ruta.origen },
      (resultsOrigen, statusOrigen) => {
        if (statusOrigen === "OK" && resultsOrigen[0]) {
          geocoder.geocode(
            { address: ruta.destino },
            (resultsDestino, statusDestino) => {
              if (statusDestino === "OK" && resultsDestino[0]) {
                const request = {
                  origin: resultsOrigen[0].geometry.location,
                  destination: resultsDestino[0].geometry.location,
                  travelMode: google.maps.TravelMode.DRIVING,
                };

                directionsService.route(request, (result, status) => {
                  if (status === "OK") {
                    directionsRenderer.setDirections(result);
                    extractMunicipios(result.routes[0].legs[0].steps, geocoder);
                   // buscarLugaresRelevantes(result.routes[0].legs[0].steps, map); // NUEVO
                  }
                });
              }
            }
          );
        }
      }
    );

    // Si ya hay ubicación del bus, mostrar marcador
    if (busLocation) {
      addOrUpdateBusMarker(busLocation.lat, busLocation.lng, map);
    }
  };

  // Añadir o actualizar marcador del bus SOLO si hay ubicación activa
  const addOrUpdateBusMarker = (lat, lng, map) => {
    if (!window.google) return;
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: "Ubicación actual del bus",
        icon: "https://maps.google.com/mapfiles/ms/icons/bus.png",
      });
    }
    map.panTo({ lat, lng });
  };

  // Actualiza el marcador cuando cambia la ubicación
  useEffect(() => {
    if (busLocation && mapRef.current) {
      addOrUpdateBusMarker(busLocation.lat, busLocation.lng, mapRef.current);
    }
    // eslint-disable-next-line
  }, [busLocation]);

  const extractMunicipios = (steps, geocoder) => {
    const municipiosArray = []; // Cambiado de Set a Array
    let processedCount = 0; // Contador para procesar en orden

    steps.forEach((step, stepIndex) => {
      const location = step.end_location;
      geocoder.geocode({ location }, (results, status) => {
        if (status === "OK" && results[0]) {
          const municipioComponent = results[0].address_components.find(
            (component) =>
              component.types.includes("locality") ||
              component.types.includes("administrative_area_level_2")
          );
          if (municipioComponent) {
            const municipioName = municipioComponent.long_name;
            // Añadir al array en la posición correcta y evitar duplicados
            // Esta lógica asume que los callbacks de geocode pueden no retornar en orden
            // por lo que se usa un array temporal y se ordena por el índice del step
            // o se asegura que el procesamiento final mantenga el orden.
            // Para simplificar y dado que el orden de los steps es secuencial,
            // podemos intentar agregar directamente si el geocoding es rápido
            // o usar un objeto para mapear y luego convertir a array.

            // Solución más simple: asumir que los callbacks se resuelven más o menos en orden
            // y filtrar duplicados al final o antes de agregar.
            // Para garantizar el orden exacto de la ruta, necesitamos procesar secuencialmente
            // o almacenar los resultados con su índice original.

            // Guardamos el municipio con su índice original del step
            municipiosArray[stepIndex] = municipioName;
          }
        }
        processedCount++;
        if (processedCount === steps.length) {
          // Una vez todos los steps han sido geocodificados
          // Filtramos los undefined (si algún geocode falló o no encontró municipio)
          // y luego filtramos duplicados manteniendo el primer aparecimiento (orden de ruta)
          const orderedUniqueMunicipios = municipiosArray.filter(m => m)
            .filter((value, index, self) => self.indexOf(value) === index);
          setMunicipios(orderedUniqueMunicipios);
        }
      });
    });
  };

  // NUEVO: Buscar lugares relevantes cerca de cada paso de la ruta
  const buscarLugaresRelevantes = (steps, map) => {
    if (!window.google) return;
    const placesService = new window.google.maps.places.PlacesService(map);
    // Elimina "gas_station" del array de tipos
    const tipos = ["bus_station", "transit_station", "subway_station", "train_station"];
    const lugaresSet = new Map();
    let pending = 0;

    steps.forEach((step) => {
      tipos.forEach((tipo) => {
        pending++;
        placesService.nearbySearch(
          {
            location: step.end_location,
            radius: 1200, // 1.2km alrededor del paso
            type: tipo,
          },
          (results, status) => {
            pending--;
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              results.forEach((lugar) => {
                if (!lugaresSet.has(lugar.place_id)) {
                  lugaresSet.set(lugar.place_id, lugar);
                  // Opcional: marcador en el mapa
                  new window.google.maps.Marker({
                    position: lugar.geometry.location,
                    map,
                    title: lugar.name,
                    icon: lugar.icon,
                  });
                }
              });
            }
            if (pending === 0) {
              setLugares(Array.from(lugaresSet.values()));
            }
          }
        );
      });
    });
  };

  return (
    <div className="map-container">
      <div id="map" className="map-box" />

      <div className="route-section">
        <h3 className="route-title">📍 Municipios en la ruta</h3>
        <ul className="route-list">
          {municipios.map((municipio, index) => (
            <li key={index} className="route-item">
              {municipio}
            </li>
          ))}
        </ul>
      </div>

      <div className="route-section">
        <h3 className="route-title">⭐ Lugares relevantes en la ruta</h3>
        <ul className="route-list">
          {lugares.length === 0 && <li>No se encontraron lugares relevantes aún.</li>}
          {lugares.map((lugar, index) => (
            <li key={lugar.place_id || index} className="route-item">
              <strong>{lugar.name}</strong>
              {lugar.vicinity && <> - {lugar.vicinity}</>}
              {lugar.types && (
                <span style={{ color: "#888", fontSize: 12 }}>
                  {" "}
                  ({lugar.types[0].replace(/_/g, " ")})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {bus && busLocation && (
        <div className="bus-location-section">
          <h4 className="bus-title">🚌 Ubicación actual del bus</h4>
          <p className="bus-details">
            <strong>Latitud:</strong> {busLocation.lat} |{" "}
            <strong>Longitud:</strong> {busLocation.lng}
          </p>
          <p className="bus-update">
            ⏳ Última actualización:{" "}
            {new Date(busLocation.timestamp).toLocaleTimeString()}
          </p>
          <p className="bus-info">
            <strong>Bus:</strong> {bus.numero_bus} - <strong>Conductor:</strong>{" "}
            {bus.conductor}
          </p>
        </div>
      )}

      {bus && !busLocation && (
        <div className="bus-location-section">
          <h4 className="bus-title">
            ⚠️ No hay ubicación activa para este bus.
          </h4>
        </div>
      )}
    </div>
  );
};

export default Mapa;
