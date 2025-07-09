interface User {
  id: string;
  name: string;
  email: string;
}

export default function Main({ user }: { user: User }) {
  return (
    <div className="relative h-screen bg-gray-100">
      {/* Top bar */}
      <div className="absolute top-0 left-0 w-full bg-green-700 h-12 flex items-center justify-between px-4 shadow-md">
        <div className="text-white text-lg font-semibold">
          Bonjor! {user.name}
        </div>
        <div className="w-8 h-8 rounded-full bg-white"></div>
      </div>

      {/* Centered button */}
      <div className="flex items-center justify-center h-full pt-12">
        <button className="bg-amber-100 px-4 py-2 rounded shadow">
          Create Channel
        </button>
      </div>
    </div>
  );
}
