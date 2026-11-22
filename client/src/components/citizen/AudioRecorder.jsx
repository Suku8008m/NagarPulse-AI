import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Mic, Square, Trash2, Volume2, Play, Pause } from 'lucide-react';

export const AudioRecorder = ({ onAudioRecorded, onAudioCleared }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        if (onAudioRecorded) {
          onAudioRecorded(audioBlob);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('[AudioRecorder error]:', err.message);
      toast.error('Microphone access was denied or is unavailable on this device.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingDuration(0);
    if (onAudioCleared) onAudioCleared();
  };

  const togglePlayback = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-blue-700" />
          Optional Voice Note (Citizen Audio)
        </span>
        {isRecording && (
          <span className="flex items-center gap-1.5 font-mono text-red-600 font-bold text-[11px] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            RECORDING {formatTime(recordingDuration)}
          </span>
        )}
      </div>

      {!audioUrl ? (
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              <Mic className="w-3.5 h-3.5 text-red-600" />
              <span>Record Voice Note</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer animate-pulse"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop Recording ({formatTime(recordingDuration)})</span>
            </button>
          )}
          <span className="text-[11px] text-slate-400">
            Explain in Telugu or English (Gemini Multimodal analyzes both)
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlayback}
              className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <span className="text-xs font-mono text-slate-600 font-medium">
              Voice Note Recorded ({formatTime(recordingDuration)})
            </span>
          </div>

          <button
            type="button"
            onClick={clearAudio}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
            title="Delete Audio Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
