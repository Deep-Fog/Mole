import React from 'react';

// 格式化文件大小
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileTransfer = ({ file }) => {
  if (!file) return null;

  const { name, size, progress, status } = file;

  return (
    <div className="glass p-4 w-72 my-2">
      <div className="flex justify-between items-center text-sm">
        <span className="truncate max-w-[150px]">{name}</span>
        <span className="text-gray-400">{formatBytes(size)}</span>
      </div>
      <div className="relative w-full bg-gray-700/50 rounded-full h-2.5 mt-2">
        <div
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
       <div className="text-xs text-right mt-1 text-gray-300">
         {status === 'completed' ? 'Completed' : `${Math.round(progress)}%`}
       </div>
    </div>
  );
};

export default FileTransfer;
