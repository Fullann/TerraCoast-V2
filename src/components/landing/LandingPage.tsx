import { useState } from "react";
import {
  Users,
  BookOpen,
  Zap,
  Target,
  Star,
  Globe,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { languageNames, type Language } from "../../i18n/translations";

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { t, language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const offers = [
    t("landing.about.offer1"),
    t("landing.about.offer2"),
    t("landing.about.offer3"),
    t("landing.about.offer4"),
    t("landing.about.offer5"),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header moderne avec navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                TerraCoast
              </span>
            </div>

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-700 hover:text-emerald-600 transition-colors font-medium"
              >
                {t("landing.nav.features")}
              </a>
              <a
                href="#about"
                className="text-gray-700 hover:text-emerald-600 transition-colors font-medium"
              >
                {t("landing.nav.about")}
              </a>
              <a
                href="#contact"
                className="text-gray-700 hover:text-emerald-600 transition-colors font-medium"
              >
                {t("landing.nav.contact")}
              </a>
            </nav>

            {/* Boutons action + langue */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Sélecteur de langue */}
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Globe className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {language.toUpperCase()}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {(Object.keys(languageNames) as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors ${
                          language === lang
                            ? "bg-emerald-50 text-emerald-600 font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {languageNames[lang]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigate("login")}
                className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
              >
                {t("landing.hero.login")}
              </button>
              <button
                onClick={() => onNavigate("register")}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md font-medium"
              >
                {t("landing.hero.startAdventure")}
              </button>
            </div>

            {/* Menu burger mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <a
                href="#features"
                className="block px-4 py-2 text-gray-700 hover:bg-emerald-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("landing.nav.features")}
              </a>
              <a
                href="#about"
                className="block px-4 py-2 text-gray-700 hover:bg-emerald-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("landing.nav.about")}
              </a>
              <a
                href="#contact"
                className="block px-4 py-2 text-gray-700 hover:bg-emerald-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("landing.nav.contact")}
              </a>

              {/* Langue mobile */}
              <div className="pt-3 border-t border-gray-200">
                <p className="px-4 py-2 text-sm font-semibold text-gray-500">
                  Langue / Language
                </p>
                {(Object.keys(languageNames) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      language === lang
                        ? "bg-emerald-50 text-emerald-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {languageNames[lang]}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    onNavigate("login");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
                >
                  {t("landing.hero.login")}
                </button>
                <button
                  onClick={() => {
                    onNavigate("register");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium"
                >
                  {t("landing.hero.startAdventure")}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 mb-6">
            {t("landing.hero.welcome")}{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              TerraCoast
            </span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto mb-4">
            {t("landing.hero.subtitle")}{" "}
            <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t("landing.hero.subtitleHighlight")}
            </span>
          </p>

          {/* Badges sociaux */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <a
              href="https://discord.gg/VOTRE_INVITE_CODE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="hidden sm:inline">Discord</span>
            </a>

            <a
              href="https://www.patreon.com/VOTRE_PAGE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF424D] text-white rounded-lg hover:bg-[#E13D47] transition-all shadow-md hover:shadow-lg font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
              </svg>
              <span className="hidden sm:inline">Patreon</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate("register")}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg font-semibold text-lg flex items-center justify-center"
            >
              {t("landing.hero.startAdventure")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button
              onClick={() => onNavigate("login")}
              className="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-xl hover:bg-emerald-50 transition-all font-semibold text-lg"
            >
              {t("landing.hero.login")}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="group bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {t("landing.features.free.title")}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t("landing.features.free.desc")}
            </p>
          </div>

          <div className="group bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {t("landing.features.community.title")}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t("landing.features.community.desc")}
            </p>
          </div>

          <div className="group bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Star className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {t("landing.features.progress.title")}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {t("landing.features.progress.desc")}
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
            {t("landing.about.title")}
          </h2>

          <div className="space-y-6 text-gray-700 text-base sm:text-lg leading-relaxed">
            <p>{t("landing.about.intro")}</p>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-600 p-6 rounded-r-xl">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-emerald-600" />
                {t("landing.about.mission")}
              </h3>
              <p className="text-gray-700">{t("landing.about.missionText")}</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 rounded-r-xl">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-blue-600" />
                {t("landing.about.goal")}
              </h3>
              <p className="text-gray-700">{t("landing.about.goalText")}</p>
            </div>

            <div className="bg-gray-50 border-l-4 border-gray-600 p-6 rounded-r-xl">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                {t("landing.about.offers")}
              </h3>
              <ul className="space-y-3">
                {offers.map((offer, index) => (
                  <li key={index} className="flex items-start">
                    <Star className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <span>{offer}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 flex items-center">
                <Globe className="w-6 h-6 mr-2" />
                {t("landing.about.joinTitle")}
              </h3>
              <p className="text-emerald-50">{t("landing.about.joinText")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-2">
              100%
            </div>
            <div className="text-sm sm:text-base text-gray-600">
              {t("landing.stats.free")}
            </div>
          </div>
          <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
              0
            </div>
            <div className="text-sm sm:text-base text-gray-600">
              {t("landing.stats.ads")}
            </div>
          </div>
          <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl sm:text-4xl font-bold text-amber-600 mb-2">
              ∞
            </div>
            <div className="text-sm sm:text-base text-gray-600">
              {t("landing.stats.quizzes")}
            </div>
          </div>
          <div className="text-center bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">
              24/7
            </div>
            <div className="text-sm sm:text-base text-gray-600">
              {t("landing.stats.available")}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section
        id="contact"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      >
        <div className="text-center bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
            {t("landing.cta.ready")}
          </h3>
          <button
            onClick={() => onNavigate("register")}
            className="px-8 sm:px-12 py-4 sm:py-5 bg-white text-emerald-600 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl font-bold text-lg sm:text-xl"
          >
            {t("landing.cta.createAccount")}
          </button>
        </div>
      </section>

      {/* Footer amélioré */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Colonne 1: Logo et description */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">TerraCoast</span>
              </div>
              <p className="text-gray-400 text-sm">© 2025 TerraCoast</p>
              <p className="text-gray-400 text-sm mt-2">
                {t("landing.footer.tagline")}
              </p>
            </div>

            {/* Colonne 2: Liens légaux */}
            <div>
              <h4 className="font-bold text-lg mb-4">Informations</h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setShowLegal(true)}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {t("landing.footer.legal")}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowPrivacy(true)}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {t("landing.footer.privacy")}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowTerms(true)}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {t("landing.footer.terms")}
                  </button>
                </li>
              </ul>
            </div>

            {/* Colonne 3: Réseaux sociaux */}
            <div>
              <h4 className="font-bold text-lg mb-4">{t("landing.footer.social")}</h4>
              <div className="flex flex-col space-y-3">
                <a
                  href="https://discord.gg/VOTRE_INVITE_CODE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Discord
                </a>
                <a
                  href="https://www.patreon.com/VOTRE_PAGE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
                  </svg>
                  Patreon
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center text-gray-400 text-sm">
            <p>TerraCoast - {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>

      {/* Modales pour mentions légales */}
      {showLegal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {t("landing.footer.legal")}
              </h3>
              <button
                onClick={() => setShowLegal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700">
              <h4 className="font-bold">Éditeur du site</h4>
              <p>
                TerraCoast
                <br />
                Site web : terracoast.com
              </p>

              <h4 className="font-bold mt-6">Hébergement</h4>
              <p>Le site est hébergé par Supabase</p>

              <h4 className="font-bold mt-6">Propriété intellectuelle</h4>
              <p>
                L'ensemble du contenu du site TerraCoast est protégé par le
                droit d'auteur. Toute reproduction non autorisée est interdite.
              </p>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {t("landing.footer.privacy")}
              </h3>
              <button
                onClick={() => setShowPrivacy(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700">
              <h4 className="font-bold">Collecte des données</h4>
              <p>
                TerraCoast collecte uniquement les données nécessaires au
                fonctionnement du service : adresse email, pseudo, et
                statistiques de jeu.
              </p>

              <h4 className="font-bold mt-6">Utilisation des données</h4>
              <p>
                Vos données sont utilisées uniquement pour améliorer votre
                expérience sur la plateforme. Nous ne vendons ni ne partageons
                vos données avec des tiers.
              </p>

              <h4 className="font-bold mt-6">Cookies</h4>
              <p>
                Le site utilise des cookies essentiels pour assurer son bon
                fonctionnement et votre authentification.
              </p>

              <h4 className="font-bold mt-6">Vos droits</h4>
              <p>
                Vous disposez d'un droit d'accès, de rectification et de
                suppression de vos données personnelles.
              </p>
            </div>
          </div>
        </div>
      )}

      {showTerms && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {t("landing.footer.terms")}
              </h3>
              <button
                onClick={() => setShowTerms(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700">
              <h4 className="font-bold">Acceptation des conditions</h4>
              <p>
                En utilisant TerraCoast, vous acceptez les présentes conditions
                d'utilisation.
              </p>

              <h4 className="font-bold mt-6">Utilisation du service</h4>
              <p>
                TerraCoast est une plateforme gratuite d'apprentissage de la
                géographie. Vous vous engagez à utiliser le service de manière
                responsable.
              </p>

              <h4 className="font-bold mt-6">Contenu utilisateur</h4>
              <p>
                En créant des quiz, vous accordez à TerraCoast le droit de les
                diffuser sur la plateforme. Vous restez propriétaire de votre
                contenu.
              </p>

              <h4 className="font-bold mt-6">Comportement</h4>
              <p>
                Tout comportement inapproprié (spam, harcèlement, contenu
                illégal) entraînera la suspension ou la suppression de votre
                compte.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
