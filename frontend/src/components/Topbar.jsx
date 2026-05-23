import React from 'react';
import { Bell, Settings, Search } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const Topbar = () => {
  const { activeWorkspace, activeView, activeBoard } = useWorkspace();

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 z-10">
      <div className="flex items-center gap-4">
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks, boards..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all w-64"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 pr-6 border-r border-gray-100">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <Settings size={20} />
          </button>
        </div>
        
        <button className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-50 transition-colors group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-none">John Doe</p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">Product Designer</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white group-hover:scale-105 transition-transform">
            JD
          </div>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
