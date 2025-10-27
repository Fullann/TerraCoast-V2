import { Trophy, Users, BookOpen, Zap, Target, Star, Globe, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header avec logo et boutons sociaux */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="TerraCoast Logo" 
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback si le logo n'existe pas encore
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="ml-3 text-2xl font-bold text-emerald-600">TerraCoast</span>
          </div>

          {/* Boutons sociaux */}
          <div className="flex items-center gap-3">
            <a
              href="https://discord.gg/VOTRE_INVITE_CODE"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Discord
            </a>

            <a
              href="https://www.patreon.com/VOTRE_PAGE"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#FF424D] text-white rounded-lg hover:bg-[#E13D47] transition-colors font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003"/>
              </svg>
              Patreon
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 mb-6">
            Bienvenue sur <span className="text-emerald-600">TerraCoast</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            La plateforme ultime pour apprendre la géographie, <span className="font-bold text-emerald-600">gratuitement et sans publicité</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('register')}
              className="px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all transform hover:scale-105 shadow-lg font-semibold text-lg flex items-center justify-center"
            >
              Commencer l'aventure
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-600 rounded-xl hover:bg-emerald-50 transition-all font-semibold text-lg"
            >
              Se connecter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">100% Gratuit</h3>
            <p className="text-gray-600">
              Aucun abonnement, aucune publicité, aucun pop-up. La géographie doit être accessible à tous.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Créé par la communauté</h3>
            <p className="text-gray-600">
              Crée tes propres quiz et partage-les avec la communauté. Tout le monde peut contribuer.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Star className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Progression & Défis</h3>
            <p className="text-gray-600">
              Gagne de l'expérience, débloque des badges et affronte tes amis en duel.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
              Qui sommes-nous ?
            </h2>

            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>
                Nous sommes deux étudiants en informatique qui avons décidé de mêler nos compétences en développement pour l'un 
                et sa passion géographique pour l'autre.
              </p>

              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-6 rounded-r-xl my-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-emerald-600" />
                  Notre Mission
                </h3>
                <p className="text-gray-700 mb-4">
                  Nous avons créé ce site car <span className="font-bold">les plateformes actuelles ne permettent pas de faire tout ce que l'on veut sans payer un abonnement</span>. 
                  Notre vision est simple : <span className="font-bold text-emerald-600">la géographie doit être accessible à tous et GRATUITEMENT</span>.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-xl my-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Zap className="w-6 h-6 mr-2 text-blue-600" />
                  Objectif Principal
                </h3>
                <p className="text-gray-700">
                  À travers ce site, nous voulons donner la possibilité à n'importe qui de pouvoir <span className="font-bold">apprendre la géographie sans contrainte</span> d'abonnement, 
                  de publicité ou autres pop-ups intrusifs.
                </p>
              </div>

              <div className="bg-gray-50 border-l-4 border-gray-600 p-6 rounded-r-xl my-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ce que nous offrons
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <span><strong>Quiz variés :</strong> Drapeaux, capitales, cartes, frontières et bien plus</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <span><strong>Création de quiz :</strong> Crée tes propres quiz et partage-les avec la communauté</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <span><strong>Défis multijoueurs :</strong> Affronte tes amis en duel ou grimpe dans le classement</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <span><strong>Système de progression :</strong> Niveaux, XP, badges et titres exclusifs</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <span><strong>Fonctionnalités sociales :</strong> Chat en temps réel et système d'amis</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-3 flex items-center">
                  <Globe className="w-6 h-6 mr-2" />
                  Rejoins l'aventure
                </h3>
                <p className="text-emerald-50">
                  Que tu sois un passionné de géographie ou simplement curieux d'apprendre,
                  TerraCoast t'offre un environnement stimulant pour développer tes connaissances
                  tout en t'amusant. Crée ton compte maintenant et fais partie de notre communauté grandissante !
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">100%</div>
            <div className="text-gray-600">Gratuit</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">0</div>
            <div className="text-gray-600">Publicités</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-600 mb-2">∞</div>
            <div className="text-gray-600">Quiz disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
            <div className="text-gray-600">Disponible</div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Prêt à commencer ?
          </h3>
          <button
            onClick={() => onNavigate('register')}
            className="px-12 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-xl font-bold text-xl"
          >
            Créer mon compte gratuitement
          </button>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2025 TerraCoast - Fait avec passion pour rendre la géographie accessible à tous
            </p>
            <div className="flex gap-4">
              <a
                href="https://discord.gg/VOTRE_INVITE_CODE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Discord
              </a>
              <a
                href="https://www.patreon.com/VOTRE_PAGE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Patreon
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
