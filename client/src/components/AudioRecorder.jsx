import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Volume2, AlertCircle } from 'lucide-react';

export default function AudioRecorder({ onAudioRecorded, audioBlob, setAudioBlob }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [permissionError, setPermissionError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setPermissionError('');
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError('Audio recording is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBlob(audioBlob);
        if (onAudioRecorded) {
          onAudioRecorded(audioBlob);
        }

        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setPermissionError('Microphone access denied or unavailable. You can proceed without audio.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordDuration(0);
    if (onAudioRecorded) onAudioRecorded(null);
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
          <Volume2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Voice Grievance Note (Optional)</span>
        </label>
        {isRecording && (
          <span className="flex items-center space-x-1.5 text-xs text-rose-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
            <span>Recording {formatSeconds(recordDuration)}</span>
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Record a voice note describing the hazard. Gemini Flash will analyze your speech and prioritize the grievance.
      </p>

      {permissionError && (
        <div className="flex items-center space-x-2 p-2.5 mb-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {!audioUrl ? (
        <div className="flex items-center space-x-3">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center space-x-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium border border-blue-200 transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4 text-blue-600" />
              <span>Record Voice Note</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3 w-full">
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Recording ({formatSeconds(recordDuration)})</span>
              </button>

              {/* Simulated waveform bars */}
              <div className="flex items-center space-x-1 h-5 flex-1">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-rose-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.max(20, Math.sin(i + recordDuration) * 100)}%`,
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
          <audio controls src={audioUrl} className="h-8 w-full max-w-xs" />
          <button
            type="button"
            onClick={clearAudio}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200/60 transition-colors w-fit"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard Recording</span>
          </button>
        </div>
      )}
    </div>
  );
}
