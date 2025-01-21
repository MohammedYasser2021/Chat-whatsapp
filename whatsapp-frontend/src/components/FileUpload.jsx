import React from 'react';
import { Upload } from 'lucide-react';

function FileUpload({ onExcelUpload, onMediaUpload }) {
  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onExcelUpload(file);
    }
  };

  const handleMediaUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onMediaUpload(files);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <label className="cursor-pointer block">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-600">
              ملف Excel (يحتوي على أرقام الهواتف)
            </span>
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
            />
          </label>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <label className="cursor-pointer block">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-600">
              ملف الوسائط (صور، فيديو)
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;