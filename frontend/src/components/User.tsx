import { useRecoilState } from 'recoil';
import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { userChannelsAtom,userSubscriptionsAtom } from '../atoms/userAtoms';
import axios from 'axios';

export interface channel {
  id: string;
  name: string;
}

interface userData {
  userSubscriptions: channel[];
  userChannels: channel[];
}

export default function User() {
  const [userSubscriptions, setUserSubscriptions] = useRecoilState(userSubscriptionsAtom);
  const [userChannels, setUserChannels] = useRecoilState(userChannelsAtom);
  const [loading, setLoading] = useState<boolean>(true);
  useSocket();

  const userId = "68739d6c2096d43a331991e0";

  const handleGetChannel = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/users/getChannel/${userId}`);
      const { userSubscriptions, userChannels } = response.data as userData;
      setUserSubscriptions(userSubscriptions);
      setUserChannels(userChannels);
    } catch (error) {
      console.error("Error fetching channel:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    try {
      console.log("Creating channel for user ID:", userId);
      // await axios.post('/api/channel/create', { userId });
      // handleGetChannel();
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  useEffect(() => {
    handleGetChannel();
  }, [userId]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 w-full bg-white shadow-md rounded-xl  text-center">
        <h2 className="text-4xl font-bold mb-6 text-black-700">📡 Channel Information</h2>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-2xl font-semibold mb-2">🧾 Subscriptions</h3>
              {userSubscriptions.length === 0 ? (
                <p className="text-gray-500">No subscriptions found.</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {userSubscriptions.map((sub) => (
                    <span
                      key={sub.id}
                      className="bg-gray-200 text-sm px-3 py-1 rounded-full shadow-sm"
                    >
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-2">📺 Your Channels</h3>
              {userChannels.length === 0 ? (
                <div className="flex flex-col items-center">
                  <p className="text-gray-600 mb-2">No channels found. Let’s create one!</p>
                  <button
                    onClick={handleCreateChannel}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-all"
                  >
                    ➕ Create Channel
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {userChannels.map((channel) => (
                    <span
                      key={channel.id}
                      className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full shadow-sm"
                    >
                      {channel.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
