import { useState } from 'react';
import { PinScreen, checkPinVerified } from './components/PinScreen';
import { HomeScreen } from './components/HomeScreen';
import { PlayerSelect } from './components/PlayerSelect';
import { ManagePlayers } from './components/ManagePlayers';
import { FieldScreen } from './components/FieldScreen';
import { MatchStats } from './components/MatchStats';
import { usePlayers } from './hooks/usePlayers';
import { useMatchState } from './hooks/useMatchState';
import type { AppView, Formation } from './types';

function App() {
  const [view, setView] = useState<AppView>(() =>
    checkPinVerified() ? 'home' : 'pin'
  );
  const [confirmNewMatch, setConfirmNewMatch] = useState(false);

  const { players, loading: playersLoading, addPlayer, removePlayer } = usePlayers();
  const {
    matchState,
    loading: matchLoading,
    setFormation,
    assignPlayerToPosition,
    movePlayerToBench,
    startNewMatch,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerTime,
    getPlayerPlayTime,
    getPlayerFlagTime,
    addPlayerToMatch,
    removePlayerFromMatch,
    assignPlayerToFlag,
  } = useMatchState();

  // Check if there's an active match (has present players)
  const hasActiveMatch =
    matchState !== null && matchState.present_players.length > 0;

  const handlePinSuccess = () => {
    setView('home');
  };

  const handleNewMatchClick = () => {
    if (hasActiveMatch) {
      setConfirmNewMatch(true);
    } else {
      setView('select-players');
    }
  };

  const handleConfirmNewMatch = () => {
    setConfirmNewMatch(false);
    setView('select-players');
  };

  const handleStartMatch = async (
    presentPlayerIds: string[],
    formation: Formation,
    opponentName: string | null
  ) => {
    await startNewMatch(presentPlayerIds, formation, opponentName);
    setView('field');
  };

  const handleFormationChange = async (formation: Formation) => {
    await setFormation(formation);
  };

  // Show loading while data is being fetched
  if (view !== 'pin' && (playersLoading || matchLoading)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-xl font-bold">VVIJ</span>
          </div>
          <p className="text-gray-500">Laden...</p>
        </div>
      </div>
    );
  }

  // Confirm dialog for new match
  if (confirmNewMatch) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Nieuwe wedstrijd starten?
          </h2>
          <p className="text-gray-600 mb-6">
            De huidige opstelling en speeltijden worden gewist. Weet je het zeker?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmNewMatch(false)}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleConfirmNewMatch}
              className="flex-1 py-2 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Doorgaan
            </button>
          </div>
        </div>
      </div>
    );
  }

  switch (view) {
    case 'pin':
      return <PinScreen onSuccess={handlePinSuccess} />;

    case 'home':
      return (
        <HomeScreen
          matchState={matchState}
          hasCurrentMatch={hasActiveMatch}
          onNewMatch={handleNewMatchClick}
          onContinueMatch={() => setView('field')}
          onManagePlayers={() => setView('manage-players')}
        />
      );

    case 'select-players':
      return (
        <PlayerSelect
          players={players}
          onStart={handleStartMatch}
          onCancel={() => setView('home')}
        />
      );

    case 'manage-players':
      return (
        <ManagePlayers
          players={players}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onBack={() => setView('home')}
        />
      );

    case 'field':
      if (!matchState) {
        setView('home');
        return null;
      }
      return (
        <FieldScreen
          matchState={matchState}
          players={players}
          allPlayers={players}
          onFormationChange={handleFormationChange}
          onAssignPlayer={assignPlayerToPosition}
          onMoveToBench={movePlayerToBench}
          onAssignToFlag={assignPlayerToFlag}
          onNewMatch={handleNewMatchClick}
          onManagePlayers={() => setView('manage-players')}
          onStartTimer={startTimer}
          onPauseTimer={pauseTimer}
          onSetTime={setTimerTime}
          onShowStats={() => setView('match-stats')}
          onAddPlayerToMatch={addPlayerToMatch}
          onRemovePlayerFromMatch={removePlayerFromMatch}
          onCreatePlayer={addPlayer}
        />
      );

    case 'match-stats':
      if (!matchState) {
        setView('home');
        return null;
      }
      return (
        <MatchStats
          matchState={matchState}
          players={players}
          getPlayerPlayTime={getPlayerPlayTime}
          getPlayerFlagTime={getPlayerFlagTime}
          onClose={() => setView('field')}
          onResetTimer={resetTimer}
        />
      );

    default:
      return null;
  }
}

export default App;
