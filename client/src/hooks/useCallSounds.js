import { useRef, useCallback } from 'react';

export const useCallSounds = () => {
  const activeAudio = useRef(null);
  const activePath = useRef(null);

  const stopAllCallSounds = useCallback(() => {
    console.log(`[useCallSounds] 🛑 stopAllCallSounds invoked. Active sound was: ${activePath.current || 'None'}`);
    if (activeAudio.current) {
      try {
        activeAudio.current.pause();
        activeAudio.current.currentTime = 0;
        console.log(`[useCallSounds] ✅ Successfully paused and reset: ${activePath.current}`);
      } catch (err) {
        console.error(`[useCallSounds] ❌ Error trying to stop: ${activePath.current}`, err);
      }
      activeAudio.current = null;
      activePath.current = null;
    }
  }, []);

  const spawnAndPlay = useCallback((filePath, shouldLoop = false) => {
    console.log(`[useCallSounds] 🚀 spawnAndPlay triggered for: ${filePath} (Loop: ${shouldLoop})`);
    
    // 1. Clear existing audio
    stopAllCallSounds();

    try {
      // 2. Initialize fresh instance
      console.log(`[useCallSounds] 🛠️ Instantiating new Audio context for: ${filePath}`);
      const audio = new Audio(filePath);
      audio.loop = shouldLoop;
      
      activeAudio.current = audio;
      activePath.current = filePath;

      // 3. Attach standard browser event tracers
      audio.oncanplaythrough = () => {
        console.log(`[useCallSounds] 🎧 Event: [canplaythrough] -> File fully buffered/accessible at: ${filePath}`);
      };

      audio.onplay = () => {
        console.log(`[useCallSounds]🔊 Event: [onplay] -> Browser hardware processing playback for: ${filePath}`);
      };

      audio.onplaying = () => {
        console.log(`[useCallSounds]🎉 Event: [onplaying] -> SOUND IS NOW AUDIBLY PLAYING!`);
      };

      audio.onerror = (e) => {
        console.error(`[useCallSounds] 🔥 Browser Audio Pipeline Error for ${filePath}:`, {
          code: audio.error?.code,
          message: audio.error?.message,
          nativeEvent: e
        });
      };

      // 4. Fire trigger and watch for Promise resolutions
      console.log(`[useCallSounds] ⚡ Requesting .play() from browser engine...`);
      audio.play()
        .then(() => {
          console.log(`[useCallSounds] ✅ Playback promise RESOLVED successfully for: ${filePath}`);
        })
        .catch((error) => {
          console.error(`[useCallSounds] ⛔ Playback promise REJECTED! Browser blocked execution.`, {
            errorName: error.name,
            errorMessage: error.message,
            tip: "This is usually caused by lack of user gesture interaction before play() execution."
          });
        });

    } catch (err) {
      console.error(`[useCallSounds] 💥 Critical synchronous exception inside spawnAndPlay:`, err);
    }
  }, [stopAllCallSounds]);

  const playIncomingTone = useCallback(() => {
    console.log('[useCallSounds] Hook API call -> playIncomingTone()');
    spawnAndPlay('/sounds/incoming.mp3', true);
  }, [spawnAndPlay]);

  const playOutgoingTone = useCallback(() => {
    console.log('[useCallSounds] Hook API call -> playOutgoingTone()');
    spawnAndPlay('/sounds/outgoing.mp3', true);
  }, [spawnAndPlay]);

  const playConnectedTone = useCallback(() => {
    console.log('[useCallSounds] Hook API call -> playConnectedTone()');
    spawnAndPlay('/sounds/connected.mp3', false);
  }, [spawnAndPlay]);

  const playEndedTone = useCallback(() => {
    console.log('[useCallSounds] Hook API call -> playEndedTone()');
    spawnAndPlay('/sounds/ended.mp3', false);
  }, [spawnAndPlay]);

  return { 
    playIncomingTone, 
    playOutgoingTone, 
    playConnectedTone, 
    playEndedTone, 
    stopAllCallSounds 
  };
};
