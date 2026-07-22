"use client";

import React, { useState } from 'react';
import { Sparkles, RotateCcw, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const quizQuestions = [
  {
    step: 1,
    question: "What area are you most passionate about?",
    options: [
      { id: 'tech', label: 'Technology & Digital Skills', desc: 'Web dev, data, AI, design', emoji: '💻' },
      { id: 'business', label: 'Business & Entrepreneurship', desc: 'Startups, marketing, finance', emoji: '📈' },
      { id: 'creative', label: 'Creative & Media', desc: 'Content, video, writing', emoji: '🎨' },
      { id: 'trades', label: 'Skilled Trades', desc: 'Solar, construction, farming', emoji: '🔧' },
    ]
  },
  {
    step: 2,
    question: "What best describes your experience level?",
    options: [
      { id: 'beginner', label: 'Beginner', desc: 'Just starting out, eager to learn', emoji: '🌱' },
      { id: 'intermediate', label: 'Intermediate', desc: 'Some experience, ready to level up', emoji: '🚀' },
      { id: 'advanced', label: 'Advanced', desc: 'Experienced, looking for mentorship or grants', emoji: '⭐' },
    ]
  },
  {
    step: 3,
    question: "How do you prefer to learn?",
    options: [
      { id: 'online', label: 'Online & Self-Paced', desc: 'Learn anytime, anywhere on your schedule', emoji: '📱' },
      { id: 'cohort', label: 'Live Cohort Program', desc: 'Structured classes with peers and mentors', emoji: '👥' },
      { id: 'hybrid', label: 'Hybrid (Online + In-Person)', desc: 'Best of both worlds with hands-on labs', emoji: '🏫' },
    ]
  },
];

const recommendations: Record<string, { title: string; desc: string; duration: string; tags: string[]; color: string; href: string }> = {
  'tech-beginner-online': {
    title: 'Digital Foundations Program',
    desc: 'Start your tech journey with foundational courses in web development, digital literacy, and computer basics. Learn at your own pace with guided modules.',
    duration: '8 Weeks • Self-Paced',
    tags: ['Web Basics', 'Digital Literacy', 'Free Access'],
    color: 'border-blue-500/50 bg-blue-50/90 dark:bg-blue-950/60',
    href: '/register',
  },
  'tech-beginner-cohort': {
    title: 'Full-Stack Developer Bootcamp',
    desc: 'Join a live cohort learning HTML, CSS, JavaScript, and React. Build real projects with mentor support and graduate job-ready.',
    duration: '12 Weeks • Live Cohort',
    tags: ['React', 'JavaScript', 'Scholarship Available'],
    color: 'border-blue-500/50 bg-blue-50/90 dark:bg-blue-950/60',
    href: '/register',
  },
  'tech-beginner-hybrid': {
    title: 'Tech Immersion Program',
    desc: 'Combine online learning with in-person lab sessions. Get hands-on experience with real tools and a supportive learning community.',
    duration: '10 Weeks • Hybrid',
    tags: ['Hands-On Labs', 'Mentorship', 'Certificate'],
    color: 'border-blue-500/50 bg-blue-50/90 dark:bg-blue-950/60',
    href: '/register',
  },
  'tech-intermediate-online': {
    title: 'Advanced Web & Cloud Skills',
    desc: 'Level up with advanced courses in cloud computing, APIs, databases, and deployment. Perfect for developers ready to go pro.',
    duration: '10 Weeks • Self-Paced',
    tags: ['Cloud', 'APIs', 'Portfolio Projects'],
    color: 'border-blue-500/50 bg-blue-50/90 dark:bg-blue-950/60',
    href: '/register',
  },
  'tech-intermediate-cohort': {
    title: 'AI & Machine Learning Cohort',
    desc: 'Deep dive into AI, Python, and machine learning with expert instructors. Build models, deploy apps, and join the AI revolution.',
    duration: '14 Weeks • Live Cohort',
    tags: ['Python', 'AI/ML', 'Industry Projects'],
    color: 'border-blue-500/50 bg-blue-50/90 dark:bg-blue-950/60',
    href: '/register',
  },
  'tech-intermediate-hybrid': {
    title: 'IoT & Hardware Engineering Track',
    desc: 'Learn to build smart devices, sensors, and connected systems. Combine online theory with hands-on hardware lab sessions.',
    duration: '12 Weeks • Hybrid',
    tags: ['IoT', 'Hardware', 'Field Projects'],
    color: 'border-blue-500/50 bg-blue-50/90 dark:bg-blue-950/60',
    href: '/register',
  },
  'tech-advanced-online': {
    title: 'Tech Leadership & Open Source',
    desc: 'Contribute to open source, lead tech teams, and build your reputation as a senior developer. Mentorship and community included.',
    duration: 'Ongoing • Self-Directed',
    tags: ['Open Source', 'Leadership', 'Mentorship'],
    color: 'border-blue-500/50 bg-blue-50/90 dark:bg-blue-950/60',
    href: '/register',
  },
  'tech-advanced-cohort': {
    title: 'Tech Incubator & Grant Program',
    desc: 'Turn your tech idea into a real product. Get seed funding, expert mentorship, and a pathway to launch your startup.',
    duration: '16 Weeks • Cohort + Funding',
    tags: ['Incubator', 'Seed Grants', 'Launch Support'],
    color: 'border-blue-500/50 bg-blue-50/90 dark:bg-blue-950/60',
    href: '/register',
  },
  'tech-advanced-hybrid': {
    title: 'Innovation Lab Fellowship',
    desc: 'Join an elite fellowship building tech solutions for real-world problems. Access to labs, funding, and a global network.',
    duration: '6 Months • Fellowship',
    tags: ['Fellowship', 'R&D', 'Global Network'],
    color: 'border-blue-500/50 bg-blue-50/90 dark:bg-blue-950/60',
    href: '/register',
  },
  'business-beginner-online': {
    title: 'Business Foundations Course',
    desc: 'Learn the basics of business planning, marketing, and financial management. Start building your entrepreneurial mindset.',
    duration: '6 Weeks • Self-Paced',
    tags: ['Business Basics', 'Marketing', 'Free Access'],
    color: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/60',
    href: '/register',
  },
  'business-beginner-cohort': {
    title: 'Entrepreneurship Bootcamp',
    desc: 'Join a live cohort of aspiring entrepreneurs. Learn to validate ideas, build business plans, and launch your first venture.',
    duration: '10 Weeks • Live Cohort',
    tags: ['Startup Basics', 'Pitch Training', 'Networking'],
    color: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/60',
    href: '/register',
  },
  'business-beginner-hybrid': {
    title: 'Small Business Launch Program',
    desc: 'Combine online learning with in-person workshops. Get hands-on help setting up your business and connecting with local markets.',
    duration: '8 Weeks • Hybrid',
    tags: ['Business Setup', 'Local Markets', 'Workshops'],
    color: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/60',
    href: '/register',
  },
  'business-intermediate-online': {
    title: 'Growth Marketing & E-Commerce',
    desc: 'Master digital marketing, e-commerce platforms, and customer acquisition strategies to scale your business online.',
    duration: '8 Weeks • Self-Paced',
    tags: ['E-Commerce', 'Digital Marketing', 'Analytics'],
    color: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/60',
    href: '/register',
  },
  'business-intermediate-cohort': {
    title: 'Social Enterprise Incubator',
    desc: 'Build a business that creates social impact. Learn impact measurement, sustainable models, and connect with impact investors.',
    duration: '12 Weeks • Cohort',
    tags: ['Social Impact', 'Investor Ready', 'Mentorship'],
    color: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/60',
    href: '/register',
  },
  'business-intermediate-hybrid': {
    title: 'Franchise & Expansion Program',
    desc: 'Learn to scale your business through franchising, partnerships, and regional expansion with expert guidance.',
    duration: '10 Weeks • Hybrid',
    tags: ['Scaling', 'Franchising', 'Partnerships'],
    color: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/60',
    href: '/register',
  },
  'business-advanced-online': {
    title: 'Executive Leadership Program',
    desc: 'Develop advanced leadership, strategy, and financial management skills for growing your business or organization.',
    duration: 'Ongoing • Self-Directed',
    tags: ['Leadership', 'Strategy', 'Executive Skills'],
    color: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/60',
    href: '/register',
  },
  'business-advanced-cohort': {
    title: 'Venture Capital & Funding Track',
    desc: 'Learn to pitch investors, structure deals, and raise capital for your growing venture. Direct access to investor networks.',
    duration: '8 Weeks • Cohort',
    tags: ['Fundraising', 'Investor Network', 'Deal Structuring'],
    color: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/60',
    href: '/register',
  },
  'business-advanced-hybrid': {
    title: 'Global Market Expansion Program',
    desc: 'Take your business international. Learn cross-border trade, international regulations, and global market entry strategies.',
    duration: '12 Weeks • Hybrid',
    tags: ['Global Trade', 'Market Entry', 'Regulatory'],
    color: 'border-emerald-500/50 bg-emerald-50/90 dark:bg-emerald-950/60',
    href: '/register',
  },
  'creative-beginner-online': {
    title: 'Creative Skills Starter',
    desc: 'Explore content creation, graphic design basics, and storytelling. Build your creative foundation at your own pace.',
    duration: '6 Weeks • Self-Paced',
    tags: ['Design Basics', 'Content Creation', 'Free Access'],
    color: 'border-purple-500/50 bg-purple-50/90 dark:bg-purple-950/60',
    href: '/register',
  },
  'creative-beginner-cohort': {
    title: 'Digital Media Production Cohort',
    desc: 'Learn video production, photography, and social media content creation in a supportive live cohort environment.',
    duration: '8 Weeks • Live Cohort',
    tags: ['Video', 'Photography', 'Social Media'],
    color: 'border-purple-500/50 bg-purple-50/90 dark:bg-purple-950/60',
    href: '/register',
  },
  'creative-beginner-hybrid': {
    title: 'Creative Arts & Media Program',
    desc: 'Combine online creative courses with in-person workshops. Build a portfolio and connect with the creative community.',
    duration: '10 Weeks • Hybrid',
    tags: ['Portfolio', 'Workshops', 'Community'],
    color: 'border-purple-500/50 bg-purple-50/90 dark:bg-purple-950/60',
    href: '/register',
  },
  'creative-intermediate-online': {
    title: 'Advanced Content Strategy',
    desc: 'Master content strategy, brand storytelling, and audience growth. Build a professional creative career online.',
    duration: '8 Weeks • Self-Paced',
    tags: ['Strategy', 'Branding', 'Audience Growth'],
    color: 'border-purple-500/50 bg-purple-50/90 dark:bg-purple-950/60',
    href: '/register',
  },
  'creative-intermediate-cohort': {
    title: 'Filmmaking & Documentary Cohort',
    desc: 'Learn professional filmmaking from script to screen. Work on real documentary projects with industry mentors.',
    duration: '12 Weeks • Live Cohort',
    tags: ['Filmmaking', 'Documentary', 'Industry Mentors'],
    color: 'border-purple-500/50 bg-purple-50/90 dark:bg-purple-950/60',
    href: '/register',
  },
  'creative-intermediate-hybrid': {
    title: 'Creative Entrepreneurship Program',
    desc: 'Turn your creative passion into a sustainable business. Learn pricing, client management, and creative entrepreneurship.',
    duration: '10 Weeks • Hybrid',
    tags: ['Creative Business', 'Client Management', 'Pricing'],
    color: 'border-purple-500/50 bg-purple-50/90 dark:bg-purple-950/60',
    href: '/register',
  },
  'creative-advanced-online': {
    title: 'Creative Director Track',
    desc: 'Develop advanced creative direction, team leadership, and brand strategy skills for senior creative roles.',
    duration: 'Ongoing • Self-Directed',
    tags: ['Creative Direction', 'Leadership', 'Brand Strategy'],
    color: 'border-purple-500/50 bg-purple-50/90 dark:bg-purple-950/60',
    href: '/register',
  },
  'creative-advanced-cohort': {
    title: 'Media Production Incubator',
    desc: 'Build a media production company with expert guidance, equipment access, and industry connections.',
    duration: '14 Weeks • Cohort',
    tags: ['Production Company', 'Equipment Access', 'Industry'],
    color: 'border-purple-500/50 bg-purple-50/90 dark:bg-purple-950/60',
    href: '/register',
  },
  'creative-advanced-hybrid': {
    title: 'Global Creative Network Fellowship',
    desc: 'Join a global network of creative professionals. Collaborate on international projects and build your global portfolio.',
    duration: '6 Months • Fellowship',
    tags: ['Global Network', 'Collaboration', 'Portfolio'],
    color: 'border-purple-500/50 bg-purple-50/90 dark:bg-purple-950/60',
    href: '/register',
  },
  'trades-beginner-online': {
    title: 'Skilled Trades Foundations',
    desc: 'Learn the basics of solar installation, carpentry, or agriculture. Start your journey in a high-demand skilled trade.',
    duration: '6 Weeks • Self-Paced',
    tags: ['Trade Basics', 'Safety', 'Free Access'],
    color: 'border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/60',
    href: '/register',
  },
  'trades-beginner-cohort': {
    title: 'Solar Installation Bootcamp',
    desc: 'Hands-on training in solar panel installation, maintenance, and business setup. Graduate ready to work or start your own service.',
    duration: '8 Weeks • Live Cohort',
    tags: ['Solar', 'Hands-On', 'Certification'],
    color: 'border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/60',
    href: '/register',
  },
  'trades-beginner-hybrid': {
    title: 'AgriTech & Smart Farming Program',
    desc: 'Combine online learning with field work. Learn modern farming techniques, soil science, and agri-tech tools.',
    duration: '10 Weeks • Hybrid',
    tags: ['Smart Farming', 'Field Work', 'AgriTech'],
    color: 'border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/60',
    href: '/register',
  },
  'trades-intermediate-online': {
    title: 'Advanced Trade Skills',
    desc: 'Deepen your expertise in your chosen trade. Learn advanced techniques, business management, and quality standards.',
    duration: '8 Weeks • Self-Paced',
    tags: ['Advanced Skills', 'Quality Standards', 'Business'],
    color: 'border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/60',
    href: '/register',
  },
  'trades-intermediate-cohort': {
    title: 'Renewable Energy Technician Program',
    desc: 'Become a certified renewable energy technician. Learn solar, wind, and battery systems with industry-recognized certification.',
    duration: '12 Weeks • Live Cohort',
    tags: ['Renewable Energy', 'Certification', 'Industry Ready'],
    color: 'border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/60',
    href: '/register',
  },
  'trades-intermediate-hybrid': {
    title: 'Construction & Building Trades Program',
    desc: 'Master construction skills with online theory and hands-on site work. Learn project management and safety standards.',
    duration: '14 Weeks • Hybrid',
    tags: ['Construction', 'Project Management', 'Safety'],
    color: 'border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/60',
    href: '/register',
  },
  'trades-advanced-online': {
    title: 'Trade Business Management',
    desc: 'Learn to run a successful trade business. Cover contracts, team management, scaling, and financial planning.',
    duration: 'Ongoing • Self-Directed',
    tags: ['Business Management', 'Contracts', 'Scaling'],
    color: 'border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/60',
    href: '/register',
  },
  'trades-advanced-cohort': {
    title: 'Master Craftsman Fellowship',
    desc: 'Join an elite fellowship of master tradespeople. Teach, mentor, and lead the next generation of skilled workers.',
    duration: '6 Months • Fellowship',
    tags: ['Mastership', 'Teaching', 'Leadership'],
    color: 'border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/60',
    href: '/register',
  },
  'trades-advanced-hybrid': {
    title: 'Trade Innovation & Technology Lab',
    desc: 'Combine traditional trade skills with modern technology. Learn automation, smart tools, and sustainable practices.',
    duration: '12 Weeks • Hybrid',
    tags: ['Innovation', 'Smart Tools', 'Sustainability'],
    color: 'border-amber-500/50 bg-amber-50/90 dark:bg-amber-950/60',
    href: '/register',
  },
};

export const QuickSkillQuizWidget: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answers, setAnswers] = useState<{
    area: string;
    level: string;
    format: string;
  }>({
    area: '',
    level: '',
    format: ''
  });

  const [isFinished, setIsFinished] = useState<boolean>(false);

  const handleSelect = (questionStep: number, value: string) => {
    if (questionStep === 1) {
      setAnswers((prev) => ({ ...prev, area: value }));
      setCurrentStep(2);
    } else if (questionStep === 2) {
      setAnswers((prev) => ({ ...prev, level: value }));
      setCurrentStep(3);
    } else if (questionStep === 3) {
      setAnswers((prev) => ({ ...prev, format: value }));
      setIsFinished(true);
    }
  };

  const handleReset = () => {
    setAnswers({ area: '', level: '', format: '' });
    setCurrentStep(1);
    setIsFinished(false);
  };

  const getRecommendation = () => {
    const key = `${answers.area}-${answers.level}-${answers.format}`;
    return recommendations[key] || {
      title: 'Personalized Learning Pathway',
      desc: 'Based on your interests, we have curated a learning path that matches your goals, experience level, and preferred style.',
      duration: 'Flexible • Tailored to You',
      tags: ['Personalized', 'Flexible Schedule', 'Support Available'],
      color: 'border-blue-500/50 bg-blue-50/90 dark:bg-blue-950/60',
      href: '/register',
    };
  };

  const rec = isFinished ? getRecommendation() : null;
  const currentQuestion = quizQuestions.find((q) => q.step === currentStep);

  return (
    <div className="w-full max-w-xl rounded-3xl p-5 sm:p-6 bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-xl backdrop-blur-xl transition-all">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="space-grotesk font-bold text-sm text-slate-900 dark:text-white">
              Discover Your Path
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              3 quick questions to find your ideal program
            </p>
          </div>
        </div>

        {!isFinished && (
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
            {currentStep}/3
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {!isFinished && (
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      )}

      {/* QUIZ QUESTIONS */}
      {!isFinished && currentQuestion ? (
        <div className="space-y-3 animate-fadeIn">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            {currentQuestion.question}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(currentStep, option.id)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 text-left transition-all group"
              >
                <div className="text-sm mb-1">{option.emoji}</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {option.label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {option.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* QUIZ RESULT CARD */
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              We found your match!
            </span>
          </div>

          {rec && (
            <div className={`p-4 rounded-2xl border ${rec.color} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  Recommended for You
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {rec.duration}
                </span>
              </div>

              <div>
                <h4 className="space-grotesk font-bold text-base text-slate-900 dark:text-white">
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {rec.desc}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {rec.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake</span>
            </button>

            <Link
              href={rec?.href || '/how-it-works'}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Explore This Program</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
