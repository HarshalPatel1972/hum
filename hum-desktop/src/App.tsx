import { useState } from "react";
import { motion } from "framer-motion";

function App() {
  const [roomId, setRoomId] = useState("");

  const generateRandomRoom = () => {
    const adjectives = ["velvet", "cosmic", "silent", "neon", "amber"];
    const nouns = ["wave", "echo", "pulse", "dream", "vibe"];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}-${noun}`;
  };

  const handleCreateRoom = () => {
    const newRoom = roomId || generateRandomRoom();
    window.location.href = `/room/${newRoom}`;
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      window.location.href = `/room/${roomId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold font-outfit mb-3 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            HUM
          </h1>
          <p className="text-zinc-500 text-sm tracking-[0.3em]">
            हम ~ तुम ~ धुन
          </p>
          <p className="text-zinc-600 text-xs mt-2">Desktop App</p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
            placeholder="Enter room name..."
            className="w-full px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl
                     text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700
                     transition-all"
          />

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateRoom}
              className="px-6 py-4 bg-white text-zinc-950 rounded-2xl font-medium
                       hover:bg-zinc-200 transition-all"
            >
              Create Room
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoinRoom}
              disabled={!roomId.trim()}
              className="px-6 py-4 bg-zinc-800 text-white rounded-2xl font-medium
                       hover:bg-zinc-700 transition-all disabled:opacity-50
                       disabled:cursor-not-allowed"
            >
              Join Room
            </motion.button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12 text-zinc-600 text-xs"
        >
          Listen together, vibe together. Perfect sync, every time.
        </motion.p>
      </div>
    </div>
  );
}

export default App;
