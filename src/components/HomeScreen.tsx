import type { MatchState } from '../types';

interface HomeScreenProps {
  matchState: MatchState | null;
  hasCurrentMatch: boolean;
  onNewMatch: () => void;
  onContinueMatch: () => void;
  onManagePlayers: () => void;
}

export function HomeScreen({
  hasCurrentMatch,
  onNewMatch,
  onContinueMatch,
  onManagePlayers,
}: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">VVIJ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Zondag 2</h1>
          <p className="text-gray-500 mt-1">Opstelling App</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {hasCurrentMatch && (
            <button
              onClick={onContinueMatch}
              className="w-full py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              Ga verder met huidige wedstrijd
            </button>
          )}

          <button
            onClick={onNewMatch}
            className={`w-full py-4 font-semibold rounded-lg transition-colors shadow-sm ${
              hasCurrentMatch
                ? 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Nieuwe wedstrijd starten
          </button>

          <button
            onClick={onManagePlayers}
            className="w-full py-4 bg-white text-gray-800 font-semibold rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm"
          >
            Spelers beheren
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-8">
          IJsselstein
        </p>
      </div>
    </div>
  );
}
