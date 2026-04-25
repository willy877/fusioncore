
import React, { useState } from 'react';

// Functional component for testing webhook integration
const MiBoton = () => {
  // State management for response data, loading status, and error messages
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle webhook call
  const handleWebhookCall = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // POST request to the specified n8n webhook URL
      const res = await fetch('https://no-va.app.n8n.cloud/webhook/fusioncore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Hardcoded JSON body as requested
        body: JSON.stringify({
          nombre: "William",
          accion: "test"
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // Parse the JSON response
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Webhook error:', err);
      setError(err.message || 'Failed to fetch data from webhook');
    } finally {
      setLoading(false);
    }
  };

  // JSX Rendering
  return (
    <div className="p-6 bg-slate-800 rounded-lg shadow-lg border border-slate-700 max-w-md mx-auto my-8">
      <h3 className="text-xl font-bold text-white mb-4">Webhook Test</h3>
      
      {/* Action Button */}
      <button
        onClick={handleWebhookCall}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-md font-medium text-white transition-all duration-200 
          ${loading 
            ? 'bg-blue-800 cursor-not-allowed opacity-70' 
            : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98] shadow-md hover:shadow-lg'
          }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          'Trigger Webhook'
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-md text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className="mt-4">
          <p className="text-sm text-slate-400 mb-2">Response:</p>
          <div className="p-3 bg-slate-950 rounded-md border border-slate-800 overflow-x-auto">
            <pre className="text-xs text-green-400 font-mono">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiBoton;
