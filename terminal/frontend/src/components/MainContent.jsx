import React from 'react';
import Buses from '../pages/Buses';
import Rutas from '../pages/Rutas';
import ComprarTicket from '../pages/ComprarTicket';
import BuscarBuses from '../pages/BuscarBuses';
import Mapa from '../components/Mapa';

function MainContent({ view }) {
  // Determina si se debe aplicar el fondo en BuscarBuses o Buses
  const isBuscarBuses = view === 'buscarBuses' || view === 'buses';
  return (
    <main
      className={`flex-grow p-6${isBuscarBuses ? ' buscar-buses-bg' : ''}`}
      style={{ border: '0.1px solid var(--color-lime)', backgroundColor: isBuscarBuses ? 'transparent' : '#fff' }}
    >
      {view === null && (
        <div className="text-center">
          <h2 className="text-4xl font-semibold mb-4">Bienvenido a Terminal</h2>
          <p className="text-lg text-gray-700 mb-8">
            Selecciona una opción para explorar nuestras rutas y buses.
          </p>
        </div>
      )}
      {view === 'buses' && <Buses />}
      {view === 'rutas' && <Rutas />}
      {view === 'ComprarTicket' && <ComprarTicket />}
      {view === 'buscarBuses' && <BuscarBuses />}
      {view === 'mapa' && <Mapa />}
    </main>
  );
}

export default MainContent;