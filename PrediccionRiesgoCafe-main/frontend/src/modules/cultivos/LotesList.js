import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../users/AuthContext';
import { getMisLotes, getEstadisticas, deleteLote } from './api';
import LoteForm from './LoteForm';
import LoteEditForm from './LoteEditForm';
import './LotesList.css'; // Importa el archivo CSS

export default function LotesList() {
  const { accessToken } = useContext(AuthContext);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLote, setEditingLote] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [filtros, setFiltros] = useState({
    departamento: '',
    variedad: '',
    nivel_sombra: ''
  });
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (accessToken) {
      loadLotes();
      loadEstadisticas();
    } else {
      setError('No estás autenticado. Por favor inicia sesión.');
      setLoading(false);
    }
  }, [accessToken]);

  const loadLotes = async () => {
    try {
      setLoading(true);
      const response = await getMisLotes(accessToken);
      setLotes(response.data);
    } catch (err) {
      setError(`Error: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEstadisticas = async () => {
    try {
      const response = await getEstadisticas(accessToken);
      setEstadisticas(response.data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  };

  const handleLoteCreado = (nuevoLote) => {
    setLotes(prev => [nuevoLote, ...prev]);
    setShowForm(false);
    loadEstadisticas();
  };

  const handleLoteActualizado = (loteActualizado) => {
    setLotes(prev => prev.map(l => l.id === loteActualizado.id ? loteActualizado : l));
    setEditingLote(null);
    loadEstadisticas();
  };

  const handleDeleteLote = async (loteId) => {
    if (window.confirm('¿Estás seguro de eliminar este lote?')) {
      try {
        await deleteLote(loteId, accessToken);
        setLotes(prev => prev.filter(l => l.id !== loteId));
        loadEstadisticas();
      } catch (err) {
        alert('Error eliminando lote: ' + err.message);
      }
    }
  };

  // Filtrar lotes
  const lotesFiltrados = lotes.filter(lote => {
    const coincideBusqueda = lote.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            lote.departamento.toLowerCase().includes(busqueda.toLowerCase());
    const coincideDepartamento = !filtros.departamento || lote.departamento === filtros.departamento;
    const coincideVariedad = !filtros.variedad || lote.variedad === filtros.variedad;
    const coincideSombra = !filtros.nivel_sombra || lote.nivel_sombra === filtros.nivel_sombra;
    return coincideBusqueda && coincideDepartamento && coincideVariedad && coincideSombra;
  });

  if (!accessToken) {
    return <div className="loading">🔐 Debes iniciar sesión para acceder a los lotes.</div>;
  }

  if (showForm) {
    return <LoteForm onLoteCreado={handleLoteCreado} onCancel={() => setShowForm(false)} />;
  }

  if (editingLote) {
    return <LoteEditForm lote={editingLote} onLoteActualizado={handleLoteActualizado} onCancel={() => setEditingLote(null)} />;
  }

  if (loading) {
    return <div className="loading">🔄 Cargando lotes...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={loadLotes}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="lotesContainer">
      {/* Header con estadísticas */}
      <div className="header">
        <div>
          <h1>🌱 Mis Lotes de Café</h1>
          {estadisticas && (
            <div className="stats">
              <span>📊 {estadisticas.total_lotes} lotes</span>
              <span>📏 {estadisticas.total_hectareas} ha totales</span>
              <span>🌳 {estadisticas.total_arboles?.toLocaleString()} árboles</span>
              {estadisticas.variedades && (
                <span>🌱 {Object.keys(estadisticas.variedades).length} variedades</span>
              )}
            </div>
          )}
        </div>
        <button onClick={() => setShowForm(true)} className="addBtn">
          + Nuevo Lote
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="filtersPanel">
        <div className="filterGroup">
          <label>🔍 Buscar</label>
          <input
            type="text"
            placeholder="Buscar por nombre o departamento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="filterGroup">
          <label>📍 Departamento</label>
          <select
            value={filtros.departamento}
            onChange={(e) => setFiltros(prev => ({ ...prev, departamento: e.target.value }))}
          >
            <option value="">Todos</option>
            {[...new Set(lotes.map(l => l.departamento))].map(depto => (
              <option key={depto} value={depto}>{depto}</option>
            ))}
          </select>
        </div>
        <div className="filterGroup">
          <label>🌱 Variedad</label>
          <select
            value={filtros.variedad}
            onChange={(e) => setFiltros(prev => ({ ...prev, variedad: e.target.value }))}
          >
            <option value="">Todas</option>
            {[...new Set(lotes.map(l => l.variedad))].map(variedad => (
              <option key={variedad} value={variedad}>{variedad}</option>
            ))}
          </select>
        </div>
        <div className="filterGroup">
          <label>🌳 Sombra</label>
          <select
            value={filtros.nivel_sombra}
            onChange={(e) => setFiltros(prev => ({ ...prev, nivel_sombra: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="Alto">Alto</option>
            <option value="Medio">Medio</option>
            <option value="Bajo">Bajo</option>
          </select>
        </div>
      </div>

      {/* Estadísticas de Filtros */}
      {lotesFiltrados.length !== lotes.length && (
        <div className="filterStats">
          Mostrando {lotesFiltrados.length} de {lotes.length} lotes
          <button
            onClick={() => {
              setFiltros({ departamento: '', variedad: '', nivel_sombra: '' });
              setBusqueda('');
            }}
            className="clearFiltersBtn"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {lotesFiltrados.length === 0 ? (
        <div className="emptyState">
          <h3>No se encontraron lotes.</h3>
          <p>Intenta ajustar tus filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="lotesGrid">
          {lotesFiltrados.map(lote => (
            <div key={lote.id} className="loteCard">
              <div className="cardHeader">
                <h3>{lote.nombre}</h3>
                <div className="cardActions">
                  <button onClick={() => setEditingLote(lote)} className="editBtn">
                    Editar
                  </button>
                  <button onClick={() => handleDeleteLote(lote.id)} className="deleteBtn">
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="cardContent">
                <div className="infoRow">
                  <span className="label">Ubicación:</span>
                  <span className="value">{lote.departamento}</span>
                </div>
                <div className="infoRow">
                  <span className="label">Área:</span>
                  <span className="value">{lote.hectareas} ha</span>
                </div>
                <div className="infoRow">
                  <span className="label">Variedad:</span>
                  <span className="value">{lote.variedad}</span>
                </div>
                <div className="infoRow">
                  <span className="label">Nivel de Sombra:</span>
                  <span className="value">{lote.nivel_sombra}</span>
                </div>
                {lote.descripcion && (
                  <div className="description">
                    <p>{lote.descripcion}</p>
                  </div>
                )}
              </div>
              <div className="cardFooter">
                <small>Creado el: {new Date(lote.fecha_creacion).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
