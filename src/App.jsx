import React, { useState, useEffect, useRef } from 'react';
import { Activity, Bell, BellRing, ChevronLeft, Crosshair, Shield, ShieldAlert, Target, Zap, Loader2, Star, Users, Trash2, LayoutDashboard, Trophy } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { KeepAwake } from '@capacitor-community/keep-awake';

// --- CONFIGURAÇÕES E API ---
const API_BASE = 'https://backend-sofa-production.up.railway.app';

const getPlayerImageUrl = (playerId) => {
  return `${API_BASE}/player-image/${playerId || 0}`;
};

// --- COMPONENTE DE IMAGEM SEGURO ---
const ImageWithFallback = ({ src, fallbackName, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  const handleError = () => {
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || '?')}&background=1e293b&color=10b981&font-size=0.4`;
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  return <img src={imgSrc} alt={alt || fallbackName} className={className} onError={handleError} />;
};

// --- DADOS FAKE PARA DEMONSTRAÇÃO ---
const MOCK_GAMES = [
  { id: 1, homeTeam: { name: 'Flamengo', score: 1 }, awayTeam: { name: 'Palmeiras', score: 0 }, tournament: 'Brasileirão Série A', minute: 45, status: 'Live' },
  { id: 2, homeTeam: { name: 'Real Madrid', score: 2 }, awayTeam: { name: 'Barcelona', score: 2 }, tournament: 'La Liga', minute: 78, status: 'Live' }
];

const MOCK_LINEUPS = {
  home: {
    name: 'Home Team',
    starters: [
      { id: 101, name: 'Rossi', position: 'G', shirtNumber: '1', minutes: 90, substitute: false, statistics: { rating: 7.2 } },
      { id: 102, name: 'Varela', position: 'D', shirtNumber: '2', minutes: 90, substitute: false, statistics: { rating: 6.8 } },
      { id: 103, name: 'F. Bruno', position: 'D', shirtNumber: '15', minutes: 90, substitute: false, statistics: { rating: 7.5 } },
      { id: 104, name: 'L. Pereira', position: 'D', shirtNumber: '4', minutes: 90, substitute: false, statistics: { rating: 6.9 } },
      { id: 105, name: 'A. Lucas', position: 'D', shirtNumber: '6', minutes: 90, substitute: false, statistics: { rating: 7.1 } },
      { id: 106, name: 'Pulgar', position: 'M', shirtNumber: '5', minutes: 90, substitute: false, statistics: { rating: 6.5 } },
      { id: 107, name: 'De La Cruz', position: 'M', shirtNumber: '18', minutes: 90, substitute: false, statistics: { rating: 8.0 } },
      { id: 108, name: 'Arrascaeta', position: 'M', shirtNumber: '14', minutes: 90, substitute: false, statistics: { rating: 7.8 } },
      { id: 109, name: 'Gerson', position: 'F', shirtNumber: '8', minutes: 90, substitute: false, statistics: { rating: 7.3 } },
      { id: 110, name: 'Cebolinha', position: 'F', shirtNumber: '11', minutes: 90, substitute: false, statistics: { rating: 6.7 } },
      { id: 111, name: 'Pedro', position: 'F', shirtNumber: '9', minutes: 90, substitute: false, statistics: { rating: 8.5 } }
    ],
    substitutes: [
      { id: 112, name: 'Gabigol', position: 'F', shirtNumber: '10', minutes: 0, substitute: true, statistics: {} }
    ]
  },
  away: {
    name: 'Away Team',
    starters: [
      { id: 201, name: 'Weverton', position: 'G', shirtNumber: '21', minutes: 90, substitute: false, statistics: { rating: 6.4 } },
      { id: 202, name: 'Mayke', position: 'D', shirtNumber: '12', minutes: 90, substitute: false, statistics: { rating: 6.6 } },
      { id: 203, name: 'Gómez', position: 'D', shirtNumber: '15', minutes: 90, substitute: false, statistics: { rating: 7.0 } },
      { id: 204, name: 'Murilo', position: 'D', shirtNumber: '26', minutes: 90, substitute: false, statistics: { rating: 6.8 } },
      { id: 205, name: 'Piquerez', position: 'D', shirtNumber: '22', minutes: 90, substitute: false, statistics: { rating: 7.4 } },
      { id: 206, name: 'Zé Rafael', position: 'M', shirtNumber: '8', minutes: 90, substitute: false, statistics: { rating: 6.2 } },
      { id: 207, name: 'Moreno', position: 'M', shirtNumber: '5', minutes: 90, substitute: false, statistics: { rating: 6.7 } },
      { id: 208, name: 'Veiga', position: 'M', shirtNumber: '23', minutes: 90, substitute: false, statistics: { rating: 7.1 } },
      { id: 209, name: 'Estêvão', position: 'F', shirtNumber: '41', minutes: 90, substitute: false, statistics: { rating: 8.1 } },
      { id: 210, name: 'Rony', position: 'F', shirtNumber: '10', minutes: 90, substitute: false, statistics: { rating: 5.9 } },
      { id: 211, name: 'Endrick', position: 'F', shirtNumber: '9', minutes: 90, substitute: false, statistics: { rating: 7.5 } }
    ],
    substitutes: [
      { id: 212, name: 'Dudu', position: 'F', shirtNumber: '7', minutes: 0, substitute: true, statistics: {} }
    ]
  }
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const normalizeStats = (raw, oldStats = {}) => {
    if (!raw) return oldStats;
    return {
      tackles: Math.max(raw.tackles ?? raw.totalTackle ?? 0, oldStats.tackles ?? 0),
      fouls: Math.max(raw.fouls ?? raw.foulsCommitted ?? raw.foulsCommited ?? 0, oldStats.fouls ?? 0),
      foulsDrawn: Math.max(raw.foulsDrawn ?? raw.wasFouled ?? 0, oldStats.foulsDrawn ?? 0),
      shotsTotal: Math.max(raw.shotsTotal ?? raw.totalShots ?? 0, oldStats.shotsTotal ?? 0),
      shotsOnTarget: Math.max(raw.shotsOnTarget ?? raw.onTargetScoringAttempt ?? 0, oldStats.shotsOnTarget ?? 0),
      minutes: Math.max(raw.minutes ?? raw.minutesPlayed ?? 0, oldStats.minutes ?? 0),
      rating: raw.rating && raw.rating !== '-' && raw.rating !== 0 ? raw.rating : (oldStats.rating ?? 0)
    };
  };

  const [view, setView] = useState('saved');
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [lineups, setLineups] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 1. PERSISTÊNCIA DE DADOS
  const [savedPlayers, setSavedPlayers] = useState(() => {
    try {
      const localData = localStorage.getItem('@sofatracker_saved_players');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Erro ao carregar dados do disco:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('@sofatracker_saved_players', JSON.stringify(savedPlayers));
  }, [savedPlayers]);

  const [trackedStats, setTrackedStats] = useState({
    tackles: false, fouls: false, foulsDrawn: false, shotsTotal: false, shotsOnTarget: false
  });
  
  const [playerStats, setPlayerStats] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // VARIÁVEL CHAVE PARA ENERGIA
  const isMonitoring = savedPlayers.length > 0;

  // 2. CONFIGURAÇÃO NATIVA (Sem o plugin causador de crash)
  useEffect(() => {
    const initNativeConfig = async () => {
      try {
        await LocalNotifications.requestPermissions();
        
        await LocalNotifications.createChannel({
          id: 'sofatracker_alerts',
          name: 'Alertas de Jogadores',
          description: 'Notificações importantes de lances',
          importance: 5,
          visibility: 1,
          vibration: true,
        });
      } catch (e) {
        console.log('Permissões nativas falharam.', e);
      }
    };
    initNativeConfig();
  }, []);

 // 2.1 GERENCIAMENTO DINÂMICO DE ENERGIA (O Retorno Seguro)
  useEffect(() => {
    const managePowerState = async () => {
      try {
        if (isMonitoring) {
          await KeepAwake.keepAwake(); // Mantém a tela acesa quando em primeiro plano
        } else {
          await KeepAwake.allowSleep();
        }
      } catch (e) {
        console.log('KeepAwake error', e);
      }

      // O MOTOR VOLTA AQUI (Mas sem a função que causava o Crash)
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
        const bgMode = window.cordova.plugins.backgroundMode;
        
        if (isMonitoring) {
          // Liga o serviço de segundo plano (Isso cria aquela notificação fixa no celular)
          if (!bgMode.isActive()) {
            bgMode.enable();
            bgMode.setDefaults({
              title: '🟢 SofaTracker Ativo',
              text: 'Buscando estatísticas em tempo real...',
              icon: 'icon', 
              color: '#10b981', 
              hidden: false,
              sticky: true // Torna a notificação fixa para o Android não matar
            });
          }
        } else {
          // Se não tem ninguém sendo monitorado, desliga tudo pra poupar bateria
          if (bgMode.isActive()) {
            bgMode.disable();
          }
        }
      }
    };

    managePowerState();
  }, [isMonitoring]);

  // Refs de sincronização
  const viewRef = useRef(view);
  const savedPlayersRef = useRef(savedPlayers);
  const playerStatsRef = useRef(playerStats);
  const trackedStatsRef = useRef(trackedStats);
  const selectedPlayerRef = useRef(selectedPlayer);
  const selectedGameRef = useRef(selectedGame);
  const isDemoModeRef = useRef(isDemoMode);

  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { savedPlayersRef.current = savedPlayers; }, [savedPlayers]);
  useEffect(() => { playerStatsRef.current = playerStats; }, [playerStats]);
  useEffect(() => { trackedStatsRef.current = trackedStats; }, [trackedStats]);
  useEffect(() => { selectedPlayerRef.current = selectedPlayer; }, [selectedPlayer]);
  useEffect(() => { selectedGameRef.current = selectedGame; }, [selectedGame]);
  useEffect(() => { isDemoModeRef.current = isDemoMode; }, [isDemoMode]);

  const fetchBackendData = async (endpoint) => {
    try {
      const url = `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}t=${Date.now()}`;
      const response = await fetch(url, { method: 'GET', mode: 'cors' });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      return null;
    }
  };

  const loadLiveGames = async () => {
    setLoading(true);
    const data = await fetchBackendData('/live');
    const events = data?.events || (Array.isArray(data) ? data : []);
    
    if (events && events.length > 0) {
      const formattedGames = events.map(e => ({
        id: e?.id,
        homeTeam: { name: e?.homeTeam?.name || 'Casa', score: e?.homeScore?.current },
        awayTeam: { name: e?.awayTeam?.name || 'Fora', score: e?.awayScore?.current },
        tournament: e?.tournament?.name || 'Desconhecido',
        minute: e?.status?.type === 'inprogress' ? e?.time?.minute : undefined,
        status: e?.status?.description || 'Live'
      }));
      setGames(formattedGames);
      setIsDemoMode(false);
    } else {
      setGames(MOCK_GAMES);
      setIsDemoMode(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLiveGames();
  }, []);

  const handleSelectGame = async (game) => {
    setSelectedGame(game);
    setView('lineups');
    setLoading(true);
    
    if (isDemoMode) {
      setTimeout(() => {
        setLineups(MOCK_LINEUPS);
        setLoading(false);
      }, 500);
      return;
    }

    const data = await fetchBackendData(`/lineups/${game?.id}`);
    if (data && data.home && data.away) {
      const processTeam = (teamData) => {
        const starters = [];
        const substitutes = [];
        (teamData?.players || []).forEach((row) => {
          const p = row?.player;
          if (!p) return;
          const playerObj = { id: p.id, name: p.name || p.shortName || '?', position: p.position || 'M', substitute: row.substitute, statistics: row.statistics || {} };
          if (row.substitute) substitutes.push(playerObj);
          else starters.push(playerObj);
        });
        return { name: teamData?.name || 'Equipa', starters, substitutes };
      };
      setLineups({ home: processTeam(data.home), away: processTeam(data.away) });
    } else {
       setLineups(MOCK_LINEUPS);
       setIsDemoMode(true);
    }
    setLoading(false);
  };

  const handleSelectPlayer = (player) => {
    if (!player) return;
    setSelectedPlayer(player);
    const savedProfile = savedPlayers.find(sp => sp?.player?.id === player.id);
    
    if (savedProfile) {
      setPlayerStats(savedProfile.stats || {});
      setTrackedStats(savedProfile.tracked || {});
    } else {
      setPlayerStats(normalizeStats(player.statistics || {}));
      setTrackedStats({ tackles: false, fouls: false, foulsDrawn: false, shotsTotal: false, shotsOnTarget: false });
    }
    setView('tracker');
    setNotifications([]);
  };

  const toggleSavePlayer = () => {
    if (!selectedPlayer) return;
    const isSaved = savedPlayers.some(sp => sp?.player?.id === selectedPlayer.id);
    if (isSaved) {
      setSavedPlayers(prev => prev.filter(sp => sp?.player?.id !== selectedPlayer.id));
      addNotification('Removido', `${selectedPlayer.name} removido dos salvos.`, 'info');
    } else {
      setSavedPlayers(prev => [...prev, { game: selectedGame, player: selectedPlayer, stats: playerStats, tracked: trackedStats }]);
      addNotification('Salvo!', `${selectedPlayer.name} a ser monitorizado.`, 'success');
    }
  };

  // ADIÇÃO AUTOMÁTICA AO CLICAR NA ESTATÍSTICA
  const toggleTrack = (statKey) => {
    const newTracked = { ...(trackedStats || {}), [statKey]: !(trackedStats || {})[statKey] };
    setTrackedStats(newTracked);
    
    const isSaved = savedPlayers.some(sp => sp?.player?.id === selectedPlayer?.id);

    if (!isSaved) {
      // Se não estiver salvo, salva automaticamente
      setSavedPlayers(prev => [...prev, { 
        game: selectedGame, 
        player: selectedPlayer, 
        stats: playerStats, 
        tracked: newTracked 
      }]);
      addNotification('Automático', `${selectedPlayer?.name} adicionado aos favoritos.`, 'success');
    } else {
      // Se já estiver, apenas atualiza as estatísticas rastreadas
      setSavedPlayers(prev => prev.map(sp => {
        if (sp?.player?.id === selectedPlayer?.id) {
          return { ...sp, tracked: newTracked };
        }
        return sp;
      }));
    }
  };

  const removeSavedPlayer = (playerId, e) => {
    e.stopPropagation();
    setSavedPlayers(prev => prev.filter(sp => sp?.player?.id !== playerId));
  };

  const handleOpenSavedPlayer = (sp) => {
    if (!sp) return;
    setSelectedGame(sp.game);
    setSelectedPlayer(sp.player);
    setPlayerStats(sp.stats || {});
    setTrackedStats(sp.tracked || {});
    setView('tracker');
  };

  // 3. FUNÇÃO DE NOTIFICAÇÃO NATIVA (Limpa de chamadas antigas)
  const addNotification = async (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [{ id, title, message, type }, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: message,
            id: Math.floor(Math.random() * 1000000), 
            schedule: { at: new Date(Date.now() + 1000) },
            channelId: 'sofatracker_alerts', 
            sound: null,
            attachments: null,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (e) {
      console.warn('Ambiente não suporta notificações nativas:', e);
    }
  };

  // 4. LOOP BLINDADO COM WEB WORKER
  useEffect(() => {
    const pollStats = async () => {
      const targets = [...savedPlayersRef.current];
      const currentViewed = selectedPlayerRef.current;
      const currentGame = selectedGameRef.current;
      
      if (currentViewed && currentGame && viewRef.current === 'tracker') {
        if (!targets.find(t => t?.player?.id === currentViewed.id)) {
          targets.push({ game: currentGame, player: currentViewed, stats: playerStatsRef.current, tracked: trackedStatsRef.current, isTemp: true });
        }
      }

      if (targets.length === 0) return;

      const updatedSavedPlayers = [...savedPlayersRef.current];
      let viewedStatsUpdated = false;
      let newViewedStats = null;

      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        if (!target?.player || !target?.game) continue;

        let newData = null;

        if (isDemoModeRef.current) {
          const oldStats = target.stats || {};
          newData = { ...oldStats };
          const rand = Math.random();
          if (rand > 0.7) newData.tackles = (newData.tackles || 0) + 1;
          else if (rand > 0.5) newData.shotsTotal = (newData.shotsTotal || 0) + 1;
          else if (rand > 0.4) newData.shotsOnTarget = (newData.shotsOnTarget || 0) + 1;
          else if (rand > 0.3) newData.fouls = (newData.fouls || 0) + 1;
          else if (rand > 0.2) newData.foulsDrawn = (newData.foulsDrawn || 0) + 1;
          newData.minutes = (newData.minutes || 0) + 1;
        } else {
          const nameEncoded = encodeURIComponent(target.player.name || '');
          const res = await fetchBackendData(`/player/${target.game.id}/${nameEncoded}`);
          if (res) {
            const oldStats = target.stats || {};
            newData = normalizeStats(res, oldStats);
          }
        }

        if (newData) {
          const oldStats = target.stats || {};
          const tracked = target.tracked || {};

          const checkStat = (key, label, iconType) => {
            if (tracked[key] && (newData[key] || 0) > (oldStats[key] || 0)) {
              const diff = (newData[key] || 0) - (oldStats[key] || 0);
              addNotification(`${target.player.name}: ${label}!`, `+${diff} registado. Total: ${newData[key]}`, iconType);
            }
          };

          checkStat('tackles', 'Desarme', 'success');
          checkStat('shotsTotal', 'Remate', 'info');
          checkStat('shotsOnTarget', 'No Alvo', 'warning');
          checkStat('fouls', 'Falta', 'danger');
          checkStat('foulsDrawn', 'Sofrida', 'success');

          if (target.isTemp) {
            viewedStatsUpdated = true;
            newViewedStats = newData;
          } else {
            const idx = updatedSavedPlayers.findIndex(sp => sp?.player?.id === target.player.id);
            if (idx !== -1) {
              updatedSavedPlayers[idx] = { ...updatedSavedPlayers[idx], stats: newData };
            }
            if (currentViewed && currentViewed.id === target.player.id) {
              viewedStatsUpdated = true;
              newViewedStats = newData;
            }
          }
        }
      }

      setSavedPlayers(updatedSavedPlayers);
      if (viewedStatsUpdated && newViewedStats) {
        setPlayerStats(prev => ({ ...(prev || {}), ...newViewedStats }));
      }
    };

    const intervalTime = isDemoModeRef.current ? 5000 : 15000;
    
    // TRUQUE DO WEB WORKER PARA DRIBLAR A ECONOMIA DE BATERIA
    const workerCode = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data.command === 'start') {
          timer = setInterval(() => { self.postMessage('tick'); }, e.data.interval);
        } else if (e.data.command === 'stop') {
          clearInterval(timer);
        }
      };
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = () => {
      pollStats();
    };

    worker.postMessage({ command: 'start', interval: intervalTime });
    pollStats();

    return () => {
      worker.postMessage({ command: 'stop' });
      worker.terminate();
    };
  }, []);

  const getRatingColor = (rating) => {
    if (!rating || rating === '-') return 'bg-slate-500';
    const num = parseFloat(rating);
    if (isNaN(num)) return 'bg-slate-500';
    if (num >= 7.0) return 'bg-emerald-500';
    if (num >= 6.0) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const renderTeamFormation = (team, isTop) => {
    if (!team || !team.starters || !Array.isArray(team.starters)) return null;
    
    const groups = { G: [], D: [], M: [], F: [] };
    team.starters.forEach(p => {
      if (!p) return;
      const pos = (p.position || 'M').charAt(0).toUpperCase();
      if (groups[pos]) groups[pos].push(p);
      else groups.M.push(p); 
    });

    const order = isTop ? ['G', 'D', 'M', 'F'] : ['F', 'M', 'D', 'G'];

    return order.map(pos => {
      if (!groups[pos] || groups[pos].length === 0) return null;
      return (
        <div key={pos} className="flex justify-around items-center w-full px-1 sm:px-2 z-10 my-0.5 sm:my-1">
          {groups[pos].map(player => {
            if (!player) return null;
            const rating = player?.statistics?.rating || (isDemoMode ? (Math.random() * (8.5 - 5.5) + 5.5).toFixed(1) : '-');
            const safeName = player.name || '?';

            return (
              <div 
                key={player.id || Math.random()} 
                onClick={() => handleSelectPlayer(player)}
                className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform relative group w-[22%] sm:w-auto"
              >
                <div className="relative">
                  <div className="w-7 h-7 sm:w-11 sm:h-11 bg-slate-800 rounded-full border-2 border-white overflow-hidden shadow-lg">
                    <ImageWithFallback
                      src={getPlayerImageUrl(player.id)}
                      fallbackName={safeName}
                      alt={safeName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${getRatingColor(rating)} text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 rounded-sm shadow-sm border border-black/20 z-10`}>
                    {rating}
                  </div>
                </div>
                <div className="mt-2 sm:mt-2.5 flex items-center justify-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] text-white font-medium drop-shadow-md bg-black/50 px-1 sm:px-1.5 py-0.5 rounded max-w-full">
                  <span className="text-slate-300 font-bold">{player.shirtNumber || '-'}</span>
                  <span className="truncate max-w-[35px] sm:max-w-[70px] tracking-tight">{safeName}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-2 sm:p-4 shadow-lg shadow-black/20">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
          
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {(view === 'lineups' || view === 'tracker') && (
              <button 
                onClick={() => {
                  if (view === 'tracker') {
                    setView('lineups');
                  } else {
                    setView('games');
                  }
                }}
                className="p-1 sm:p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <ChevronLeft size={20} className="text-emerald-400" />
              </button>
            )}
            <div className="flex items-center gap-1 sm:gap-2 cursor-pointer" onClick={() => setView('saved')}>
              <Zap className="text-emerald-500 fill-emerald-500" size={18} sm:size={24} />
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white hidden sm:block">
                Sofa<span className="text-emerald-500">Tracker</span>
              </h1>
            </div>
          </div>

          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-700/50 shadow-inner">
            <button 
              onClick={() => setView('saved')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-lg transition-all text-[11px] sm:text-sm font-medium ${
                view === 'saved' || (view === 'tracker' && savedPlayers.some(sp => sp?.player?.id === selectedPlayer?.id))
                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard size={14} className="sm:w-4 sm:h-4" />
              <span>Painel</span>
            </button>
            <button 
              onClick={() => setView('games')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-lg transition-all text-[11px] sm:text-sm font-medium ${
                view === 'games' || view === 'lineups' || (view === 'tracker' && !savedPlayers.some(sp => sp?.player?.id === selectedPlayer?.id))
                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Trophy size={14} className="sm:w-4 sm:h-4" />
              <span>Jogos</span>
            </button>
          </div>

          <div className="flex items-center justify-end shrink-0 gap-1 sm:gap-2">
            
            <button 
              onClick={() => addNotification('Teste Recebido! 🛡️', 'A notificação nativa está a funcionar.', 'success')}
              className="flex text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-full border border-emerald-500/30 items-center gap-1.5 transition-colors font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              title="Testar Notificação Nativa no Celular"
            >
              <BellRing size={14} className="animate-pulse" /> 
              <span className="hidden sm:inline">Alerta Nativo</span>
            </button>

            {isDemoMode && (
              <span className="hidden sm:flex text-[10px] sm:text-xs bg-amber-500/20 text-amber-400 px-2 sm:px-3 py-1 rounded-full border border-amber-500/30 items-center gap-1">
                <Activity size={10} sm:size={12} /> <span className="hidden md:inline">Demo Mode</span>
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-4 pb-24">
        
        {view === 'games' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <Activity className="text-emerald-500" /> Jogos Ao Vivo
              </h2>
              <button onClick={loadLiveGames} className="text-sm text-slate-400 hover:text-white flex items-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin" />}
                Atualizar
              </button>
            </div>

            {loading && games.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="animate-spin mb-4 text-emerald-500" size={32} />
                <p>A procurar jogos...</p>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                Nenhum jogo ao vivo encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map(game => (
                  <div 
                    key={game?.id || Math.random()} 
                    onClick={() => handleSelectGame(game)}
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 group"
                  >
                    <div className="text-xs text-slate-500 mb-3 flex justify-between items-center">
                      <span className="truncate pr-2">{game?.tournament || '-'}</span>
                      <span className="text-emerald-400 font-medium flex items-center gap-1 bg-emerald-400/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider animate-pulse">
                         {game?.minute ? `${game.minute}'` : 'Live'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-medium">
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="truncate">{game?.homeTeam?.name || '-'}</span>
                          <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">
                            {game?.homeTeam?.score !== undefined ? game.homeTeam.score : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="truncate">{game?.awayTeam?.name || '-'}</span>
                          <span className="font-bold text-white bg-slate-800 px-3 py-1 rounded-lg">
                            {game?.awayTeam?.score !== undefined ? game.awayTeam.score : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'lineups' && selectedGame && (
          <div className="animate-in slide-in-from-right duration-300">
            <div className="mb-6 text-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h2 className="text-slate-400 text-sm mb-2 uppercase tracking-widest">{selectedGame?.tournament || '-'}</h2>
              <div className="flex justify-center items-center gap-4 sm:gap-6 text-xl sm:text-2xl font-bold">
                <span className="flex-1 text-right truncate">{selectedGame?.homeTeam?.name || '-'}</span>
                <span className="bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
                  {selectedGame?.homeTeam?.score !== undefined ? selectedGame.homeTeam.score : '-'} - {selectedGame?.awayTeam?.score !== undefined ? selectedGame.awayTeam.score : '-'}
                </span>
                <span className="flex-1 text-left truncate">{selectedGame?.awayTeam?.name || '-'}</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
            ) : lineups ? (
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-lg aspect-[2/3] sm:aspect-[3/4] bg-[#2e6b41] rounded-xl border-[4px] border-white/80 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] mb-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-overlay">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-white/60 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-20 h-20 sm:w-28 sm:h-28 border-[3px] border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-0 left-1/2 w-[55%] h-[16%] border-x-[3px] border-b-[3px] border-white/60 -translate-x-1/2"></div>
                  <div className="absolute top-0 left-1/2 w-[25%] h-[6%] border-x-[3px] border-b-[3px] border-white/60 -translate-x-1/2"></div>
                  <div className="absolute top-[16%] left-1/2 w-12 h-6 border-b-[3px] border-white/60 -translate-x-1/2 rounded-b-full"></div>
                  <div className="absolute bottom-0 left-1/2 w-[55%] h-[16%] border-x-[3px] border-t-[3px] border-white/60 -translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-1/2 w-[25%] h-[6%] border-x-[3px] border-t-[3px] border-white/60 -translate-x-1/2"></div>
                  <div className="absolute bottom-[16%] left-1/2 w-12 h-6 border-t-[3px] border-white/60 -translate-x-1/2 rounded-t-full"></div>

                  <div className="absolute inset-0 flex flex-col pointer-events-none">
                    <div className="w-full h-1/2 flex flex-col justify-around py-2 pointer-events-auto">
                      {renderTeamFormation(lineups?.home, true)}
                    </div>
                    <div className="w-full h-1/2 flex flex-col justify-around py-2 pointer-events-auto">
                      {renderTeamFormation(lineups?.away, false)}
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center justify-center gap-2 border-b border-slate-800 pb-3">
                    <Users className="text-emerald-500" size={20} /> Banco de Reservas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { teamName: lineups?.home?.name || 'Casa', players: lineups?.home?.substitutes || [], color: 'bg-blue-500' },
                      { teamName: lineups?.away?.name || 'Fora', players: lineups?.away?.substitutes || [], color: 'bg-red-500' }
                    ].map((team, idx) => (
                      <div key={idx}>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-400">
                          <div className={`w-2 h-2 rounded-full ${team.color}`}></div>
                          {team.teamName}
                        </h4>
                        <div className="space-y-2">
                          {team.players.length > 0 ? team.players.map(player => (
                            <div 
                              key={player?.id || Math.random()} 
                              onClick={() => handleSelectPlayer(player)}
                              className="flex items-center gap-3 p-2.5 bg-slate-950 hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-xl cursor-pointer transition-colors"
                            >
                              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                                {player?.shirtNumber || '-'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-slate-200 truncate">{player?.name || '?'}</p>
                                <p className="text-[10px] text-slate-500">Pos: {player?.position || 'M'}</p>
                              </div>
                              <ChevronLeft className="rotate-180 text-slate-600 shrink-0" size={16} />
                            </div>
                          )) : (
                            <p className="text-xs text-slate-600 italic">Sem reservas disponíveis.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-500 mt-10">Escalações não disponíveis.</p>
            )}
          </div>
        )}

        {view === 'tracker' && selectedPlayer && (
          <div className="animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 bg-slate-800 border-2 border-slate-700 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                  <ImageWithFallback
                    src={getPlayerImageUrl(selectedPlayer?.id)}
                    fallbackName={selectedPlayer?.name || '?'}
                    alt={selectedPlayer?.name || '?'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    {selectedPlayer?.name || 'Jogador'}
                    <button 
                      onClick={toggleSavePlayer}
                      className={`p-2 rounded-full border transition-all ${savedPlayers.some(sp => sp?.player?.id === selectedPlayer?.id) ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      <Star size={20} className={savedPlayers.some(sp => sp?.player?.id === selectedPlayer?.id) ? 'fill-amber-400' : ''} />
                    </button>
                  </h2>
                  <p className="text-emerald-400 flex items-center gap-2 font-medium">
                    {selectedGame?.homeTeam?.name || '-'} vs {selectedGame?.awayTeam?.name || '-'}
                  </p>
                  <div className="flex gap-3 mt-3">
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">Pos: {selectedPlayer?.position || '-'}</span>
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 flex items-center gap-1">
                      <Activity size={12}/> {playerStats?.minutes || 0}' jogados
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Bell size={16} className="text-amber-400" /> O que notificar?
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {[
                  { key: 'tackles', label: 'Desarmes', icon: Shield },
                  { key: 'fouls', label: 'Faltas', icon: ShieldAlert },
                  { key: 'foulsDrawn', label: 'Faltas Sofridas', icon: Activity },
                  { key: 'shotsTotal', label: 'Remates', icon: Crosshair },
                  { key: 'shotsOnTarget', label: 'No Alvo', icon: Target },
                ].map((stat) => {
                  const Icon = stat.icon;
                  const isActive = trackedStats?.[stat.key] || false;
                  return (
                    <button
                      key={stat.key}
                      onClick={() => toggleTrack(stat.key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        isActive 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <Icon size={20} className={isActive ? 'text-emerald-500' : ''} />
                      <span className="text-xs text-center font-medium leading-tight">{stat.label}</span>
                      {isActive ? <Bell size={12} className="absolute top-2 right-2 opacity-50"/> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
               {[
                 { key: 'tackles', label: 'Desarmes' },
                 { key: 'fouls', label: 'Faltas' },
                 { key: 'foulsDrawn', label: 'Sofridas' },
                 { key: 'shotsTotal', label: 'Remates' },
                 { key: 'shotsOnTarget', label: 'No Alvo' },
               ].map((stat) => (
                 <div key={stat.key} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                   <span className="text-slate-400 text-xs uppercase tracking-wider mb-2">{stat.label}</span>
                   <span className="text-3xl font-bold text-white">
                     {playerStats?.[stat.key] !== undefined ? playerStats[stat.key] : '-'}
                   </span>
                   <div className={`mt-2 w-2 h-2 rounded-full ${trackedStats?.[stat.key] ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-slate-800'}`}></div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {view === 'saved' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                  <Activity className="text-emerald-500" /> Dashboard Ao Vivo
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">Acompanhe todos os jogadores monitorizados.</p>
              </div>
              {savedPlayers.length > 0 && (
                <button 
                  onClick={() => setSavedPlayers([])}
                  className="text-[10px] sm:text-xs flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors border border-slate-700 hover:border-red-500/50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-slate-800/50 shrink-0"
                >
                  <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Limpar</span>
                </button>
              )}
            </div>

            {savedPlayers.length === 0 ? (
              <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>Dashboard vazio.</p>
                <button onClick={() => setView('games')} className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full">
                  Explorar Jogos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {savedPlayers.map(sp => (
                  <div key={sp?.player?.id || Math.random()} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group flex-1" onClick={() => handleOpenSavedPlayer(sp)}>
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-800 border border-slate-700 rounded-full overflow-hidden shrink-0 group-hover:border-emerald-500">
                          <ImageWithFallback
                            src={getPlayerImageUrl(sp?.player?.id)}
                            fallbackName={sp?.player?.name || '?'}
                            alt={sp?.player?.name || '?'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-base sm:text-lg text-white leading-tight group-hover:text-emerald-400">{sp?.player?.name || 'Jogador'}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                            <span className="text-emerald-400 font-bold flex items-center bg-emerald-400/10 px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] uppercase tracking-wider animate-pulse border border-emerald-500/20">
                               {sp?.game?.minute ? `${sp.game.minute}'` : 'Live'}
                            </span>
                            <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[150px]">{sp?.game?.homeTeam?.name || '-'} vs {sp?.game?.awayTeam?.name || '-'}</p>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => removeSavedPlayer(sp?.player?.id, e)} className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 p-1.5 sm:p-2 rounded-full shrink-0 ml-2">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-auto relative z-10">
                      {[
                        { key: 'tackles', label: 'Desarmes' }, { key: 'fouls', label: 'Faltas' },
                        { key: 'foulsDrawn', label: 'Sofridas' }, { key: 'shotsTotal', label: 'Remates' }, { key: 'shotsOnTarget', label: 'No Alvo' }
                      ].map((stat) => {
                        const isTracked = sp?.tracked?.[stat.key] || false;
                        const val = sp?.stats?.[stat.key] !== undefined ? sp.stats[stat.key] : '-';
                        return (
                          <div key={stat.key} className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg sm:rounded-xl border ${isTracked ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]' : 'bg-slate-950/50 border-slate-800'}`}>
                            <span className="text-[7px] sm:text-[10px] text-slate-400 uppercase tracking-tighter truncate w-full text-center mb-0.5 sm:mb-1">{stat.label}</span>
                            <span className={`text-sm sm:text-xl font-bold ${isTracked ? 'text-emerald-400' : 'text-slate-300'}`}>{val}</span>
                            {isTracked && <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* BALÕES VISUAIS DENTRO DO APP */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
        {notifications.map(notif => (
          <div key={notif.id} className="animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto flex items-start gap-3 p-4 bg-slate-800 border-l-4 border-emerald-500 rounded-xl shadow-2xl shadow-black/50" style={{ borderLeftColor: notif.type === 'success' ? '#10b981' : notif.type === 'warning' ? '#f59e0b' : notif.type === 'danger' ? '#ef4444' : '#3b82f6' }}>
            <div className={`mt-0.5 ${notif.type === 'success' ? 'text-emerald-500' : notif.type === 'warning' ? 'text-amber-500' : notif.type === 'danger' ? 'text-red-500' : 'text-blue-500'}`}>
              <Bell size={20} className="animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-white">{notif.title}</h4>
              <p className="text-xs text-slate-300 mt-1">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}