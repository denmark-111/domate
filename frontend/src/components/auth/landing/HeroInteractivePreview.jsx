import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MousePointer2, 
  ArrowRight, 
  GripVertical, 
  Calendar, 
  MessageSquare, 
  AlignLeft, 
  Paperclip,
  MessageCircle
} from 'lucide-react';
import avatarDenmarc from '../../../assets/avatar_denmarc.jpg';
import avatarMaya from '../../../assets/avatar_maya.jpg';
import avatarAlex from '../../../assets/avatar_alex.jpg';
import avatarElena from '../../../assets/avatar_elena.jpg';
import avatarMarcus from '../../../assets/avatar_marcus.jpg';

const HeroInteractivePreview = () => {
  const navigate = useNavigate();

  // Simulated cursor animation state
  const [cursorPos, setCursorPos] = useState({ x: 55, y: 40 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorPos((prev) => ({
        x: prev.x === 55 ? 25 : 55,
        y: prev.y === 40 ? 65 : 40
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden py-14 md:py-20">
      {/* Background glowing glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-button/20 via-purple-500/15 to-pink-500/20 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-text tracking-tight mb-6 leading-[1.15]">
          Your Projects & Team Updates,{' '}
          <span className="bg-gradient-to-r from-button via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Always in Sync
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
          Organize Kanban boards, broadcast team updates, and collaborate in real-time—all in one workspace.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            onClick={() => navigate('/auth?action=register')}
            className="w-full sm:w-auto px-8 py-3.5 bg-button hover:bg-button-hover text-white font-semibold rounded-xl shadow-lg shadow-button/25 hover:shadow-button/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            Get Started
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('demo-communication');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-7 py-3.5 border border-border bg-bg-secondary hover:bg-bg-tertiary text-text font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} className="text-button" />
            See Team Chat & Updates
          </button>
        </div>

        {/* Authentic Domate UI Window Preview */}
        <div className="relative max-w-5xl mx-auto rounded-xl border border-border bg-bg-secondary p-4 sm:p-5 shadow-2xl overflow-hidden text-left flex flex-col">
          {/* Compact Board Header Bar (Without topbar) */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40 select-none shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text uppercase tracking-wider">
                Q3 Product Sprint Board
              </span>
            </div>

            {/* Online Avatars (No background color) */}
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
              <div className="flex -space-x-1.5 shrink-0">
                <img src={avatarDenmarc} alt="Denmarc" className="w-4.5 h-4.5 rounded-full object-cover ring-1 ring-bg" />
                <img src={avatarMaya} alt="Maya" className="w-4.5 h-4.5 rounded-full object-cover ring-1 ring-bg" />
                <img src={avatarAlex} alt="Alex" className="w-4.5 h-4.5 rounded-full object-cover ring-1 ring-bg" />
              </div>
              <span className="text-[11px] text-text-tertiary">3 online</span>
            </div>
          </div>

          {/* Canvas Body - Matches Board.jsx & ListColumn layout */}
          <div className="overflow-x-auto flex-1 flex flex-col">
            <div className="flex gap-4 min-w-[700px] relative items-start">

              {/* Column 1: TO DO */}
              <div className="w-64 sm:w-72 shrink-0 flex flex-col gap-2 bg-bg border border-border rounded-lg p-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GripVertical size={12} className="text-text-secondary" />
                    <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">TO DO</h3>
                    <span className="text-[10px] font-medium text-text-secondary bg-bg-tertiary px-1.5 py-0.5 rounded-full">2</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="bg-bg p-3 rounded-lg border border-border">
                    <div className="flex items-start gap-1.5">
                      <input type="checkbox" readOnly className="w-3.5 h-3.5 rounded border-text-secondary accent-button mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text">Mobile App Onboarding Flow</p>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded text-white bg-blue-600">Design</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-text-secondary text-[10px]">
                          <span className="flex items-center gap-0.5"><Calendar size={10} /> Aug 5</span>
                          <div className="flex items-center min-h-[20px]">
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-bg z-2">
                              <img src={avatarDenmarc} alt="Denmarc" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 -ml-1.5 border border-bg z-1" title="Elena Rostova">
                              <img src={avatarElena} alt="Elena Rostova" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg p-3 rounded-lg border border-border">
                    <div className="flex items-start gap-1.5">
                      <input type="checkbox" readOnly className="w-3.5 h-3.5 rounded border-text-secondary accent-button mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text">Optimize Search API Performance</p>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded text-white bg-purple-600">Backend</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-text-secondary text-[10px]">
                          <span className="flex items-center gap-0.5"><AlignLeft size={10} /></span>
                          <div className="flex items-center min-h-[20px]">
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-bg z-2" title="Marcus Chen">
                              <img src={avatarMarcus} alt="Marcus Chen" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full py-1.5 text-xs text-text-secondary bg-bg hover:bg-bg-tertiary rounded-lg transition-colors text-center">
                  + Add Task
                </button>
              </div>

              {/* Column 2: IN PROGRESS */}
              <div className="w-64 sm:w-72 shrink-0 flex flex-col gap-2 bg-bg border border-border rounded-lg p-3 shadow-xs relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GripVertical size={12} className="text-text-secondary" />
                    <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
                      IN PROGRESS
                    </h3>
                    <span className="text-[10px] font-medium text-text-secondary bg-bg-tertiary px-1.5 py-0.5 rounded-full">1</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="bg-bg p-3 rounded-lg border-2 border-button shadow-md relative">
                    <div className="flex items-start gap-1.5">
                      <input type="checkbox" readOnly className="w-3.5 h-3.5 rounded border-text-secondary accent-button mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text">Design System Color Audit</p>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded text-white bg-indigo-600">UI / Design</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-text-secondary text-[10px]">
                          <span className="flex items-center gap-1 text-button font-medium">
                            <MessageSquare size={10} /> 4 comments
                          </span>
                          <div className="flex items-center min-h-[20px]">
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-bg z-3">
                              <img src={avatarMaya} alt="Maya" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 -ml-1.5 border border-bg z-2">
                              <img src={avatarDenmarc} alt="Denmarc" className="w-full h-full object-cover" />
                            </div>
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 -ml-1.5 border border-bg z-1" title="Marcus Chen">
                              <img src={avatarMarcus} alt="Marcus Chen" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full py-1.5 text-xs text-text-secondary bg-bg hover:bg-bg-tertiary rounded-lg transition-colors text-center">
                  + Add Task
                </button>
              </div>

              {/* Column 3: DONE */}
              <div className="w-64 sm:w-72 shrink-0 flex flex-col gap-2 bg-bg border border-border rounded-lg p-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GripVertical size={12} className="text-text-secondary" />
                    <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">DONE</h3>
                    <span className="text-[10px] font-medium text-text-secondary bg-bg-tertiary px-1.5 py-0.5 rounded-full">1</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="bg-bg p-3 rounded-lg border border-border opacity-70">
                    <div className="flex items-start gap-1.5">
                      <input type="checkbox" checked readOnly className="w-3.5 h-3.5 rounded border-text-secondary accent-button mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text line-through text-text-secondary">User Feedback & Interview Survey</p>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded text-white bg-emerald-600">Research</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-text-secondary text-[10px]">
                          <span className="flex items-center gap-0.5"><Paperclip size={10} /> 2</span>
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" title="Elena Rostova">
                            <img src={avatarElena} alt="Elena Rostova" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="w-full py-1.5 text-xs text-text-secondary bg-bg hover:bg-bg-tertiary rounded-lg transition-colors text-center">
                  + Add Task
                </button>
              </div>

              {/* Floating Peer Cursor */}
              <div
                className="absolute pointer-events-none transition-all duration-1000 ease-in-out z-20 flex items-center gap-1.5"
                style={{
                  top: `${cursorPos.y}%`,
                  left: `${cursorPos.x}%`
                }}
              >
                <MousePointer2 size={18} className="text-purple-500 fill-purple-500 drop-shadow-md" />
                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-semibold shadow-md whitespace-nowrap">
                  Maya Lin
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroInteractivePreview;
