import { useNavigate } from 'react-router-dom';

type Role = 'coach' | 'player' | 'admin';

export function RoleSelection() {
  const navigate = useNavigate();

  const goToSignIn = (role: Role) => {
    navigate(`/sign-in?role=${role}`, { state: { role } });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
      style={{ backgroundImage: `url('/landing-bg.png')` }}
    >
      <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm" />

      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 relative z-10 border border-gray-200">
        <div className="text-center mb-8">
          <img src="/ventra-logo.png" alt="Ventra" className="h-36 w-auto mx-auto mb-6" />
          <h1 className="text-3xl text-gray-900 mb-2">Log In As</h1>
          <p className="text-gray-600">Choose your account type to continue</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => goToSignIn('coach')}
            className="w-full border border-gray-300 bg-white text-gray-900 py-3 rounded-lg hover:bg-gray-200 hover:border-gray-500 hover:shadow-md transition-all font-medium"
          >
            Coach
          </button>
          <button
            onClick={() => goToSignIn('player')}
            className="w-full border border-gray-300 bg-white text-gray-900 py-3 rounded-lg hover:bg-gray-200 hover:border-gray-500 hover:shadow-md transition-all font-medium"
          >
            Player
          </button>
          <button
            onClick={() => goToSignIn('admin')}
            className="w-full border border-gray-300 bg-white text-gray-900 py-3 rounded-lg hover:bg-gray-200 hover:border-gray-500 hover:shadow-md transition-all font-medium"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}
