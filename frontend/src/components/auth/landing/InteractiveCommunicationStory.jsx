import { useState, useEffect, useRef } from 'react';
import { Pin, Calendar, MessageCircle, Megaphone } from 'lucide-react';
import avatarDenmarc from '../../../assets/avatar_denmarc.jpg';
import avatarMaya from '../../../assets/avatar_maya.jpg';
import avatarMarcus from '../../../assets/avatar_marcus.jpg';

const InteractiveCommunicationStory = () => {
  // scene: 'announcement' | 'chat'
  const [scene, setScene] = useState('announcement');
  // announcementState: 'entering' | 'visible' | 'fadingOut'
  const [announcementState, setAnnouncementState] = useState('entering');
  // chatStep: 0, 1, 2, 3, 4, 5
  const [chatStep, setChatStep] = useState(0);
  const [isChatFadingOut, setIsChatFadingOut] = useState(false);

  const containerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let timers = [];

    const runStorySequence = () => {
      if (!isMountedRef.current) return;
      // Step 1: Start Announcement pop-in animation
      setScene('announcement');
      setAnnouncementState('entering');
      setChatStep(0);
      setIsChatFadingOut(false);

      // Trigger enter animation almost immediately
      timers.push(
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setAnnouncementState('visible');
        }, 50)
      );

      // Step 2 (2.5s): Fade out Announcement
      timers.push(
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setAnnouncementState('fadingOut');
        }, 2500)
      );

      // Step 3 (3.0s): Switch scene to Chat Thread
      timers.push(
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setScene('chat');
          setChatStep(0);
        }, 3000)
      );

      // Step 4 (3.8s): Chat Message 1 (Maya Lin)
      timers.push(
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setChatStep(1);
        }, 3800)
      );

      // Step 5 (5.0s): Chat Message 2 (Denmarc - Active User)
      timers.push(
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setChatStep(2);
        }, 5000)
      );

      // Step 6 (6.2s): Chat Message 3 (Marcus Chen)
      timers.push(
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setChatStep(3);
        }, 6200)
      );

      // Step 7 (7.4s): Typing Indicator (Maya Lin)
      timers.push(
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setChatStep(4);
        }, 7400)
      );

      // Step 8 (8.8s): Chat Message 4 (Maya Lin final reply)
      timers.push(
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setChatStep(5);
        }, 8800)
      );

      // Step 9 (13.5s): Restart story sequence smoothly
      timers.push(
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setIsChatFadingOut(true);
          setTimeout(() => {
            if (isMountedRef.current) runStorySequence();
          }, 400);
        }, 13500)
      );
    };

    // IntersectionObserver to handle scroll into/out of view
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          timers.forEach(clearTimeout);
          timers = [];
          runStorySequence();
        } else {
          timers.forEach(clearTimeout);
          timers = [];
          setScene('announcement');
          setAnnouncementState('entering');
          setChatStep(0);
          setIsChatFadingOut(false);
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      isMountedRef.current = false;
      timers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="max-w-3xl mx-auto rounded-xl border border-border bg-bg-secondary p-4 sm:p-6 shadow-xl overflow-hidden text-left relative transition-all duration-500 min-h-[420px] flex flex-col justify-between"
    >
      {/* Background ambient glow matching Domate theme */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-button/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar matching Domate in-app header */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6 shrink-0">
        <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300">
          {scene === 'announcement' ? (
            <span className="flex items-center gap-1.5 text-button animate-fadeIn">
              <Megaphone size={14} /> Team Announcement
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-button animate-fadeIn">
              <MessageCircle size={14} /> Workspace Team Chat
            </span>
          )}
        </span>

        <span className="text-[11px] font-medium text-text-tertiary">
          {scene === 'announcement' ? 'Instant Updates' : 'Live Discussion'}
        </span>
      </div>

      {/* Main Dynamic Stage Container */}
      <div className="flex-1 flex flex-col justify-start pt-2 min-h-[300px] relative">
        {/* SCENE 1: Announcement Broadcast (Animates in as just sent) */}
        {scene === 'announcement' && (
          <div
            className={`transition-all duration-400 ease-out ${
              announcementState === 'entering'
                ? 'opacity-0 translate-y-4 scale-95'
                : announcementState === 'visible'
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-2 scale-95'
            }`}
          >
            <div className="rounded-xl border border-border bg-bg p-5 shadow-xs relative">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-bg-tertiary text-text-secondary text-[11px] font-semibold rounded-full mb-2">
                    <Pin size={11} /> Pinned Announcement
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-text">
                    Q3 Product Roadmap & Release Deliverables
                  </h3>
                </div>
                <span className="text-[10px] sm:text-xs text-button font-semibold flex items-center gap-1 shrink-0 animate-pulse">
                  <Calendar size={12} /> Just now
                </span>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                We are finalizing the Q3 product release schedule. Please review the updated milestone deliverables before our team sync on Thursday.
              </p>

              <div className="flex items-center gap-2 pt-3 border-t border-border/40 text-xs text-text-secondary">
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-border">
                  <img src={avatarDenmarc} alt="Denmarc" className="w-full h-full object-cover" />
                </div>
                <span className="font-semibold text-text">Denmarc</span>
                <span className="text-text-tertiary text-[11px]">• Product Lead</span>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 2: Chat Discussion Thread */}
        {scene === 'chat' && (
          <div
            className={`space-y-3.5 transition-all duration-500 ease-in-out ${
              isChatFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {/* Message 1: Maya Lin */}
            <div
              className={`flex gap-3 transition-all duration-500 ease-out ${
                chatStep >= 1
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3 pointer-events-none'
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border/40">
                <img src={avatarMaya} alt="Maya Lin" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-text">Maya Lin</span>
                  <span className="text-[10px] text-text-tertiary">09:32 AM</span>
                </div>
                <div className="px-3.5 py-2.5 rounded-lg bg-bg text-text text-xs sm:text-sm leading-relaxed rounded-bl-sm border border-border/40 shadow-xs">
                  Checking out the updated deliverables now. The onboarding designs are fully finalized!
                </div>
              </div>
            </div>

            {/* Message 2: Denmarc (Active User - Right Aligned) */}
            <div
              className={`flex gap-3 flex-row-reverse transition-all duration-500 ease-out ${
                chatStep >= 2
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3 pointer-events-none'
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border/40">
                <img src={avatarDenmarc} alt="Denmarc (You)" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-end max-w-[85%]">
                <div className="flex items-center gap-2 flex-row-reverse mb-1">
                  <span className="text-xs font-semibold text-text">You</span>
                  <span className="text-[10px] text-text-tertiary">09:33 AM</span>
                </div>
                <div className="px-3.5 py-2.5 rounded-lg bg-button text-white text-xs sm:text-sm leading-relaxed rounded-br-sm border border-button shadow-xs">
                  Great work team! Reviewing the onboarding screens now.
                </div>
              </div>
            </div>

            {/* Message 3: Marcus Chen */}
            <div
              className={`flex gap-3 transition-all duration-500 ease-out ${
                chatStep >= 3
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3 pointer-events-none'
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border/40">
                <img src={avatarMarcus} alt="Marcus Chen" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-text">Marcus Chen</span>
                  <span className="text-[10px] text-text-tertiary">09:34 AM</span>
                </div>
                <div className="px-3.5 py-2.5 rounded-lg bg-bg text-text text-xs sm:text-sm leading-relaxed rounded-bl-sm border border-border/40 shadow-xs">
                  Performance tests for the search API look clean. We are good to go for release.
                </div>
              </div>
            </div>

            {/* Dedicated stationary slot for Typing Indicator & Final Message */}
            <div className="min-h-[52px] relative flex items-center">
              {/* Typing Indicator: Maya Lin */}
              {chatStep === 4 && (
                <div className="flex items-center gap-3 pt-1 animate-fadeIn">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-border/40 shrink-0">
                    <img src={avatarMaya} alt="Maya Lin" className="w-full h-full object-cover" />
                  </div>
                  <div className="px-3.5 py-2 rounded-lg bg-bg border border-border/40 text-text flex items-center gap-1.5 rounded-bl-sm shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Message 4: Maya Lin follow up */}
              {chatStep >= 5 && (
                <div className="flex gap-3 transition-all duration-500 ease-out opacity-100 translate-y-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border/40">
                    <img src={avatarMaya} alt="Maya Lin" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col items-start max-w-[92%] sm:max-w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-text">Maya Lin</span>
                      <span className="text-[10px] text-text-tertiary">09:36 AM</span>
                    </div>
                    <div className="px-3.5 py-2.5 rounded-lg bg-bg text-text text-xs sm:text-sm leading-relaxed rounded-bl-sm border border-border/40 shadow-xs w-fit">
                      Awesome! See you all at Thursday's team sync.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveCommunicationStory;
