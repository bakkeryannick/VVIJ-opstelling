import { useState } from 'react';

const CORRECT_PIN = '5512';
const PIN_STORAGE_KEY = 'vvij-pin-verified';

interface PinScreenProps {
  onSuccess: () => void;
}

export function PinScreen({ onSuccess }: PinScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handlePinChange = (value: string) => {
    if (value.length > 4) return;
    setError(false);
    setPin(value);

    if (value.length === 4) {
      if (value === CORRECT_PIN) {
        try { localStorage.setItem(PIN_STORAGE_KEY, 'true'); } catch { /* ignore */ }
        onSuccess();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setPin('');
          setShake(false);
        }, 500);
      }
    }
  };

  const handleKeyPress = (digit: string) => {
    handlePinChange(pin + digit);
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-xs">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">VVIJ</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">VVIJ Zondag 2</h1>
          <p className="text-gray-500 mt-1">Voer pincode in</p>
        </div>

        {/* Pin dots */}
        <div
          className={`flex justify-center gap-4 mb-8 ${shake ? 'animate-shake' : ''}`}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? error
                    ? 'bg-red-500 border-red-500'
                    : 'bg-red-600 border-red-600'
                  : 'border-gray-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-red-500 text-sm mb-4">
            Onjuiste pincode
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map(
            (key, idx) => {
              if (key === '') {
                return <div key={idx} />;
              }

              if (key === 'back') {
                return (
                  <button
                    key={idx}
                    onClick={handleBackspace}
                    className="h-16 rounded-lg bg-gray-200 hover:bg-gray-300 active:bg-gray-400 flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                      />
                    </svg>
                  </button>
                );
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleKeyPress(key)}
                  className="h-16 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100 text-2xl font-medium text-gray-800 shadow-sm border border-gray-200 transition-colors"
                >
                  {key}
                </button>
              );
            }
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export function checkPinVerified(): boolean {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}
