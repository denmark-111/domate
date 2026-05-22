import React from 'react';

const HomeDashboard = ({ workspaces, onSelectWorkspace }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome back, John</h1>
          <p className="text-gray-500">Select a workspace to start collaborating or managing your tasks.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => onSelectWorkspace(ws.id)}
              className="group bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all text-left flex flex-col h-48"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-sm group-hover:scale-110 transition-transform">
                  {ws.name[0]}
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  ws.type === 'team' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                }`}>
                  {ws.type}
                </span>
              </div>
              
              <div className="mt-auto">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {ws.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {ws.type === 'team' ? 'Collaborate with your team' : 'Manage your personal goals'}
                </p>
              </div>
            </button>
          ))}

          {/* Create New Workspace Button */}
          <button className="group p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 group-hover:border-blue-500 flex items-center justify-center text-2xl text-gray-400 group-hover:text-blue-500 transition-all">
              +
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-gray-900">Create Workspace</h3>
              <p className="text-xs text-gray-500 mt-1">Add a new team or personal space</p>
            </div>
          </button>
        </section>

        {/* Recent Activity or Pinned Boards could go here later */}
        <section className="mt-16">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Recent Boards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">#</div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Development</h4>
                <p className="text-xs text-gray-500">Product Team</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">#</div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Daily Routine</h4>
                <p className="text-xs text-gray-500">Personal Tasks</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomeDashboard;
