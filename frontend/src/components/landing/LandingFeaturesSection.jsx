import { useState, useEffect } from 'react';
import { Kanban, CheckSquare, MessageSquare, MousePointer2, CheckCircle2, Lock } from 'lucide-react';

const LandingFeaturesSection = () => {
  // Animation phase state for 2-person live cursor demo inside Card 1:
  // 0 = Idle hover, 1 = Maya grabs Task A, 2 = Maya drags Task A, 3 = Maya drops Task A in Done, 4 = Retract
  const [phase, setPhase] = useState(0);

  // Live chat state for Card 3: 'idle' -> 'typing' -> 'message' -> 'idle'
  const [chatState, setChatState] = useState('idle');

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((prev) => (prev + 1) % 5);
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setChatState((prev) => {
        if (prev === 'idle') return 'typing';
        if (prev === 'typing') return 'message';
        return 'idle';
      });
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  const isMayaDragging = phase === 2;
  const isTaskADone = phase >= 3;

  // Person 1 (Maya) Cursor Coordinates
  const mayaCoordinates = [
    { x: '18%', y: '30%' },  // Phase 0: Hover near In Progress
    { x: '22%', y: '42%' },  // Phase 1: Touch Task A
    { x: '72%', y: '42%' },  // Phase 2: Dragging Task A across
    { x: '72%', y: '52%' },  // Phase 3: Dropped in Done
    { x: '88%', y: '82%' },  // Phase 4: Retract
  ];

  // Person 2 (Denmarc) Cursor Coordinates
  const denmarcCoordinates = [
    { x: '70%', y: '25%' },  // Phase 0: Hover near Done
    { x: '22%', y: '78%' },  // Phase 1: Hover near Task B
    { x: '24%', y: '78%' },  // Phase 2: Move slightly
    { x: '70%', y: '78%' },  // Phase 3: Move to inspect Done
    { x: '82%', y: '85%' },  // Phase 4: Retract
  ];

  const currentMayaCursor = mayaCoordinates[phase] || mayaCoordinates[0];
  const currentDenmarcCursor = denmarcCoordinates[phase] || denmarcCoordinates[0];

  return (
    <section id="live-demo" className="w-full border-b border-outline-variant py-12 sm:py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex flex-col gap-10 md:gap-12">
        {/* Section Header */}
        <div className="flex flex-col gap-3 items-start max-w-3xl">
          <h2 className="font-headline-lg text-2xl sm:text-3xl md:text-4xl font-semibold text-on-surface tracking-tight">
            Built for High-Speed Real-Time Execution
          </h2>
          <p className="font-body-lg text-base sm:text-lg text-secondary">
            Eliminate context switching. Manage tasks, view live cursors, chat with teammates, and broadcast announcements from a single platform.
          </p>
        </div>

        {/* Bento Grid: Dynamic height on mobile, 440px on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-auto md:auto-rows-[440px]">
          {/* Feature 1: Live Kanban & Cursors */}
          <div className="bg-surface-container-low border border-outline-variant rounded-DEFAULT p-6 sm:p-8 flex flex-col justify-between hover:border-primary transition-colors group relative overflow-hidden min-h-[380px] md:min-h-0">
            <div className="z-10 relative">
              <div className="flex items-center gap-2 mb-1.5">
                <Kanban size={20} className="text-on-surface" />
                <h3 className="font-headline-md text-xl sm:text-2xl font-medium text-on-surface">
                  Live Kanban & Peer Cursors
                </h3>
              </div>
              <p className="font-body-md text-xs sm:text-sm text-secondary max-w-md">
                Full drag-and-drop boards with instant client sync, live peer cursors, task labels, and visual item locking.
              </p>
            </div>

            {/* MINI BOARD DEMO CONTAINER */}
            <div className="w-full mt-4 relative overflow-hidden flex flex-col gap-3 select-none">
              {/* Board Header Bar */}
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-28 bg-on-surface/80 rounded-none" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <div className="w-4 h-4 rounded-full bg-primary/60 border border-outline-variant" />
                    <div className="w-4 h-4 rounded-full bg-secondary/40 border border-outline-variant" />
                  </div>
                  <div className="h-2 w-10 bg-secondary/40 rounded-none" />
                </div>
              </div>

              {/* Zoomed Kanban Columns Grid */}
              <div className="grid grid-cols-2 gap-3 relative min-h-[190px]">
                {/* Column 1: In Progress */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-2.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-outline-variant/40">
                    <div className="h-2 w-16 bg-on-surface/70 rounded-none" />
                    <div className="h-2 w-4 bg-on-surface/50 rounded-none" />
                  </div>

                  {/* Task Card A (Moved by Maya) */}
                  {!isTaskADone && (
                    <div className={`bg-surface-container-low border rounded-DEFAULT p-2.5 transition-all duration-500 flex flex-col gap-2 ${
                      isMayaDragging 
                        ? 'border-primary opacity-50 shadow-xs' 
                        : 'border-outline-variant shadow-xs'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="h-2.5 w-24 bg-on-surface/80 rounded-none" />
                        {isMayaDragging && (
                          <div className="p-0.5 rounded bg-primary text-on-primary">
                            <Lock size={9} />
                          </div>
                        )}
                      </div>
                      <div className="h-1.5 w-16 bg-secondary/40 rounded-none" />
                      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30 text-[10px] text-outline">
                        <div className="h-2 w-8 bg-secondary/40 rounded-none" />
                        <div className="w-3.5 h-3.5 rounded-full bg-primary/40" />
                      </div>
                    </div>
                  )}

                  {/* Task Card B */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-DEFAULT p-2.5 shadow-xs flex flex-col gap-2">
                    <div className="h-2.5 w-28 bg-on-surface/80 rounded-none" />
                    <div className="h-1.5 w-20 bg-secondary/40 rounded-none" />
                    <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30 text-[10px] text-outline">
                      <div className="h-2 w-8 bg-secondary/40 rounded-none" />
                      <div className="w-3.5 h-3.5 rounded-full bg-secondary/40" />
                    </div>
                  </div>
                </div>

                {/* Column 2: Done */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-2.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-outline-variant/40">
                    <div className="h-2 w-12 bg-secondary/60 rounded-none" />
                    <div className="h-2 w-4 bg-secondary/40 rounded-none" />
                  </div>

                  {/* Task Card A dropped into Done */}
                  {isTaskADone && (
                    <div className="bg-surface-container-low border border-primary rounded-DEFAULT p-2.5 shadow-sm flex flex-col gap-2 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="h-2.5 w-24 bg-on-surface/80 rounded-none" />
                        <CheckCircle2 size={12} className="text-emerald-600" />
                      </div>
                      <div className="h-1.5 w-16 bg-secondary/40 rounded-none" />
                      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/30 text-[10px] text-outline">
                        <div className="h-2 w-8 bg-secondary/40 rounded-none" />
                        <div className="w-3.5 h-3.5 rounded-full bg-primary/40" />
                      </div>
                    </div>
                  )}

                  {/* Pre-existing Task Card in Done */}
                  <div className="bg-surface-container-low border border-outline-variant rounded-DEFAULT p-2.5 opacity-65 flex flex-col gap-2">
                    <div className="h-2.5 w-20 bg-on-surface/60 rounded-none" />
                    <div className="h-1.5 w-14 bg-secondary/30 rounded-none" />
                  </div>
                </div>

                {/* PERSON 1: MAYA'S LIVE CURSOR */}
                <div 
                  className="absolute pointer-events-none transition-all duration-700 ease-in-out z-30 flex items-center gap-1 transform -translate-x-1 -translate-y-1"
                  style={{ left: currentMayaCursor.x, top: currentMayaCursor.y }}
                >
                  <MousePointer2 className="w-4 h-4 text-primary fill-primary shadow-sm" />
                  <div className="bg-primary text-on-primary font-mono-label text-[10px] font-bold px-2 py-0.5 rounded-DEFAULT shadow-md whitespace-nowrap">
                    <span>Maya</span>
                  </div>
                </div>

                {/* PERSON 2: DENMARC'S LIVE CURSOR */}
                <div 
                  className="absolute pointer-events-none transition-all duration-700 ease-in-out z-30 flex items-center gap-1 transform -translate-x-1 -translate-y-1"
                  style={{ left: currentDenmarcCursor.x, top: currentDenmarcCursor.y }}
                >
                  <MousePointer2 className="w-4 h-4 text-emerald-600 fill-emerald-600 shadow-sm" />
                  <div className="bg-emerald-600 text-white font-mono-label text-[10px] font-bold px-2 py-0.5 rounded-DEFAULT shadow-md whitespace-nowrap">
                    <span>Denmarc</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Cross-Workspace Tasks */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT p-6 sm:p-8 flex flex-col justify-between hover:border-primary transition-colors select-none min-h-[380px] md:min-h-0">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <CheckSquare size={20} className="text-on-surface" />
                <h3 className="font-headline-md text-xl sm:text-2xl font-medium text-on-surface">
                  Cross-Workspace Tasks
                </h3>
              </div>
              <p className="font-body-md text-xs sm:text-sm text-secondary">
                Consolidated view of all action items across active workspaces in one central dashboard.
              </p>
            </div>

            {/* GEOMETRIC ABSTRACTION TASK LIST PREVIEW */}
            <div className="w-full mt-4 flex flex-col gap-2.5">
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                <div className="h-2.5 w-36 bg-on-surface/80 rounded-none" />
                <div className="h-2 w-16 bg-secondary/40 rounded-none" />
              </div>

              {/* Task 1 */}
              <div className="bg-surface-container-low border border-outline-variant p-2.5 sm:p-3 rounded-DEFAULT flex items-center justify-between shadow-xs hover:border-primary transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4 h-4 border border-primary rounded-xs shrink-0" />
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="h-2.5 w-32 bg-on-surface/80 rounded-none" />
                    <div className="h-2 w-24 bg-secondary/50 rounded-none" />
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="h-2 w-10 bg-secondary/40 rounded-none" />
                </div>
              </div>

              {/* Task 2 */}
              <div className="bg-surface-container-low border border-outline-variant p-2.5 sm:p-3 rounded-DEFAULT flex items-center justify-between shadow-xs hover:border-primary transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4 h-4 border border-primary rounded-xs shrink-0" />
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="h-2.5 w-28 bg-on-surface/80 rounded-none" />
                    <div className="h-2 w-28 bg-secondary/50 rounded-none" />
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="h-2 w-12 bg-secondary/40 rounded-none" />
                </div>
              </div>

              {/* Task 3 (Completed) */}
              <div className="bg-surface-container-low border border-outline-variant p-2.5 sm:p-3 rounded-DEFAULT flex items-center justify-between shadow-xs opacity-75">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-4 h-4 bg-primary border border-primary rounded-xs flex items-center justify-center text-on-primary shrink-0">
                    <CheckSquare size={10} className="fill-primary text-on-primary" />
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="h-2.5 w-36 bg-secondary/60 rounded-none" />
                    <div className="h-2 w-20 bg-secondary/40 rounded-none" />
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="h-2 w-8 bg-secondary/30 rounded-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Workspace Chat & Announcements (100% UNCLIPPED RESPONSIVE MOBILE CHAT) */}
          <div className="md:col-span-2 bg-surface-container-low border border-outline-variant rounded-DEFAULT p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-primary transition-colors gap-6 md:gap-8 overflow-hidden relative">
            <div className="flex-1 z-10 max-w-xl">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={20} className="text-on-surface" />
                <h3 className="font-headline-md text-xl sm:text-2xl font-medium text-on-surface">
                  Workspace Chat & Announcements
                </h3>
              </div>
              <p className="font-body-md text-xs sm:text-sm text-secondary">
                Communicate directly within your workspace context. Send live messages with typing indicators and broadcast pinned announcements to keep your entire team aligned.
              </p>
            </div>

            {/* Mobile: h-auto py-2 (unclipped vertical height), Desktop: md:h-[195px] */}
            <div className="flex-1 w-full h-auto md:h-[195px] relative flex justify-center md:justify-end items-center z-10 select-none py-2 md:py-0">
              {/* Responsive w-full max-w-sm flex flex-col gap-3 */}
              <div className="flex flex-col gap-3 w-full max-w-sm sm:max-w-md">
                {/* Base Message 1: Teammate (LEFT) */}
                <div className="bg-surface-container-lowest border border-outline-variant p-3 rounded-DEFAULT self-start w-[85%] sm:w-[80%] shadow-xs flex flex-col gap-1.5 shrink-0">
                  <div className="h-2 w-full bg-secondary/40 rounded-none" />
                  <div className="h-2 w-3/4 bg-secondary/40 rounded-none" />
                </div>

                {/* Base Message 2: Active User (RIGHT) */}
                <div className="bg-primary text-on-primary border border-primary p-3 rounded-DEFAULT self-end w-[85%] sm:w-[80%] shadow-xs flex flex-col gap-1.5 shrink-0">
                  <div className="h-2 w-full bg-on-primary/70 rounded-none" />
                  <div className="h-2 w-4/5 bg-on-primary/70 rounded-none" />
                </div>

                {/* Slot 3: Live Typing Indicator -> Incoming Message Bubble */}
                <div className="min-h-[44px] flex items-center">
                  {chatState === 'typing' && (
                    <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-DEFAULT self-start w-[32%] sm:w-[30%] shadow-xs flex items-center justify-center gap-1.5 animate-pulse shrink-0">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    </div>
                  )}

                  {chatState === 'message' && (
                    <div className="bg-surface-container-lowest border border-outline-variant p-3 rounded-DEFAULT self-start w-[85%] sm:w-[80%] shadow-xs flex flex-col gap-1.5 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="h-2 w-full bg-secondary/40 rounded-none" />
                      <div className="h-2 w-1/2 bg-secondary/40 rounded-none" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFeaturesSection;
