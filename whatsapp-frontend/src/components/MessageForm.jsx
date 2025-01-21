import React from 'react';
import { Send } from 'lucide-react';

function MessageForm({ message, setMessage, onSend, isLoading, hasMedia }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
      <div className="space-y-2">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          الرسالة
        </label>
        <textarea
          id="message"
          rows={4}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
        />
      </div>

      <button
        onClick={onSend}
        disabled={isLoading || (!message && !hasMedia)}
        className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white 
          ${isLoading || (!message && !hasMedia)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
      >
        {isLoading ? (
          <span>جاري الإرسال...</span>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            <span>إرسال</span>
          </>
        )}
      </button>
    </div>
  );
}

export default MessageForm;