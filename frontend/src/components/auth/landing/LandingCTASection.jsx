import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

const LandingCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="pt-20 pb-32 md:pb-36 relative">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 leading-tight text-text">
          Ready to elevate your teamwork?
        </h2>

        <p className="text-text-secondary text-base mb-6 leading-relaxed">
          Create your workspace in seconds, invite your teammates, and experience seamless collaboration.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/auth?action=register')}
            className="w-full sm:w-auto px-8 py-4 bg-button hover:bg-button-hover text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group text-base"
          >
            Create Workspace Now
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default LandingCTASection;
