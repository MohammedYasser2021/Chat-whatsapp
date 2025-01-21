import React from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

function StatusIndicator({ status, numbers, results }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">حالة الاتصال:</span>
        {status === 'connected' ? (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-1" />
            <span>متصل</span>
          </div>
        ) : status === 'waiting-for-qr' ? (
          <div className="flex items-center text-yellow-600">
            <Loader className="h-5 w-5 mr-1 animate-spin" />
            <span>في انتظار مسح رمز QR</span>
          </div>
        ) : (
          <div className="flex items-center text-red-600">
            <XCircle className="h-5 w-5 mr-1" />
            <span>غير متصل</span>
          </div>
        )}
      </div>

      {numbers.length > 0 && (
        <div className="text-sm text-gray-600">
          عدد الأرقام: {numbers.length}
        </div>
      )}

      {results && (
        <div className="space-y-2">
          <div className="text-green-600">
            تم الإرسال بنجاح: {results.success.length}
          </div>
          <div className="text-red-600">
            فشل الإرسال: {results.failed.length}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusIndicator;