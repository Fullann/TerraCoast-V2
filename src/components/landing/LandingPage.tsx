import { Trophy, Users, BookOpen, Zap, Target, Star, Globe, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Trophy className="w-16 h-16 text-emerald-600 animate-pulse" />
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 mb-6">
            Bienvenue sur <span className="text-emerald-600">TerraCoast</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            La plateforme ultime pour tester et enrichir tes connaissances en géographie
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
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Quiz variés</h3>
            <p className="text-gray-600">
              Drapeaux, capitales, cartes, frontières et bien plus. Découvre des centaines de quiz créés par la communauté.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Défis multijoueurs</h3>
            <p className="text-gray-600">
              Affronte tes amis en duel ou grimpe dans le classement mensuel pour devenir le champion.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Star className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Progression</h3>
            <p className="text-gray-600">
              Gagne de l'expérience, monte de niveau et débloque des badges et titres exclusifs.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
              Notre Histoire
            </h2>

            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>
                <span className="font-bold text-emerald-600">TerraCoast</span> est né d'une passion pour la géographie et l'apprentissage ludique.
                Ce projet a été créé avec l'ambition de rendre l\'apprentissage de la géographie accessible, amusant et compétitif.
              </p>

              <p>
                Au départ, c'était une simple idée : créer une plateforme où les utilisateurs pourraient non seulement
                tester leurs connaissances géographiques, mais aussi créer leurs propres quiz et les partager avec
                la communauté. Rapidement, le projet a évolué pour intégrer des fonctionnalités sociales innovantes.
              </p>

              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-6 rounded-r-xl my-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-emerald-600" />
                  Le Développement
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <span><strong>Architecture moderne :</strong> Développé avec React, TypeScript et Supabase pour une expérience fluide et réactive</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <span><strong>Base de données robuste :</strong> Système de sécurité RLS pour protéger les données utilisateurs</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <span><strong>Fonctionnalités sociales :</strong> Chat en temps réel, système d'amis et duels multijoueurs</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                    <span><strong>Gamification poussée :</strong> Niveaux, XP, badges, titres et classement mensuel</span>
                  </li>
                </ul>
              </div>

              <p>
                Le projet continue d'évoluer grâce aux retours de la communauté. Chaque quiz créé, chaque duel joué
                et chaque suggestion contribue à améliorer la plateforme. Notre objectif est de créer l'expérience
                d'apprentissage géographique la plus complète et engageante possible.
              </p>

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
            <div className="text-4xl font-bold text-emerald-600 mb-2">1000+</div>
            <div className="text-gray-600">Quiz disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600">Joueurs actifs</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-600 mb-2">50+</div>
            <div className="text-gray-600">Badges à débloquer</div>
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
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 TerraCoast - Fait avec passion pour l'apprentissage de la géographie
          </p>
        </div>
      </footer>
    </div>
  );
}
