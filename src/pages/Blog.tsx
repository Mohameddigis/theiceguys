import React from 'react';
import { Calendar, User, ArrowRight, Clock, Tag } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
}

function Blog() {
  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Les Différents Types de Glaçons : Guide Complet pour Professionnels',
      excerpt: 'Découvrez les caractéristiques uniques de chaque type de glaçon et comment choisir le bon pour votre établissement.',
      content: `
        <h2>Introduction aux Types de Glaçons</h2>
        <p>Dans l'industrie de la restauration et de l'hôtellerie à Marrakech, le choix du bon type de glaçon peut faire toute la différence dans l'expérience client. Chez The Ice Guys, nous proposons trois types principaux de glaçons, chacun ayant ses propres avantages.</p>
        
        <h3>1. Glaçons Nugget's - Les Favoris des Cocktails</h3>
        <p>Les glaçons Nugget's, également appelés glaçons en pépites, sont parfaits pour les cocktails et boissons premium. Leur forme unique permet une fonte lente et uniforme, préservant ainsi le goût de vos boissons plus longtemps.</p>
        <ul>
          <li>Fonte lente et uniforme</li>
          <li>Idéaux pour les cocktails haut de gamme</li>
          <li>Texture agréable en bouche</li>
          <li>Parfaits pour les bars et lounges</li>
        </ul>
        
        <h3>2. Glaçons Gourmet - L'Excellence Cylindrique</h3>
        <p>Nos glaçons Gourmet, de forme cylindrique, sont conçus pour les établissements qui recherchent l'excellence. Leur forme élégante et leur clarté cristalline en font le choix privilégié des restaurants gastronomiques.</p>
        
        <h3>3. Glaçons Cubiques - La Polyvalence Classique</h3>
        <p>La glace paillette offre une solution unique pour la présentation et le refroidissement rapide. Parfaite pour les buffets et présentations, elle offre un excellent rapport qualité-prix.</p>
        
        <h2>Comment Choisir le Bon Type ?</h2>
        <p>Le choix dépend de plusieurs facteurs : type d'établissement, clientèle cible, budget, et volume de consommation. Contactez-nous pour des conseils personnalisés.</p>
      `,
      author: 'Équipe Glaçons Marrakech',
      author: 'Équipe The Ice Guys',
      date: '2024-01-15',
      readTime: '5 min',
      category: 'Guide Professionnel',
      tags: ['glaçons', 'restauration', 'cocktails', 'marrakech'],
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/nugget-verre.png'
    },
    {
      id: '2',
      title: 'Optimiser la Conservation des Glaçons : Conseils d\'Expert',
      excerpt: 'Apprenez les meilleures techniques pour conserver vos glaçons et maintenir leur qualité optimale.',
      content: `
        <h2>L'Importance de la Conservation</h2>
        <p>Une bonne conservation des glaçons est essentielle pour maintenir leur qualité et éviter le gaspillage. Voici nos conseils d'experts pour optimiser la conservation de vos glaçons à Marrakech.</p>
        
        <h3>Température et Stockage</h3>
        <p>La température de stockage idéale se situe entre -18°C et -15°C. Un stockage approprié peut prolonger la durée de vie de vos glaçons jusqu'à plusieurs semaines.</p>
        
        <h3>Équipements Recommandés</h3>
        <ul>
          <li>Congélateurs professionnels</li>
          <li>Bacs de stockage isolés</li>
          <li>Couvercles hermétiques</li>
          <li>Thermomètres de contrôle</li>
        </ul>
        
        <h3>Bonnes Pratiques</h3>
        <p>Évitez les variations de température, utilisez des contenants propres, et respectez la règle du "premier entré, premier sorti" pour une rotation optimale.</p>
      `,
      author: 'Expert Glaçons Marrakech',
      author: 'Expert The Ice Guys',
      date: '2024-01-10',
      readTime: '4 min',
      category: 'Conseils Techniques',
      tags: ['conservation', 'stockage', 'qualité', 'professionnels'],
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/gourmet-verre.png'
    },
    {
      id: '3',
      title: 'Événements à Marrakech : Calculer ses Besoins en Glaçons',
      excerpt: 'Guide pratique pour estimer la quantité de glaçons nécessaire selon le type d\'événement.',
      content: `
        <h2>Planification d'Événements</h2>
        <p>Organiser un événement à Marrakech nécessite une planification minutieuse, notamment pour les besoins en glaçons. Voici comment calculer précisément vos besoins.</p>
        
        <h3>Facteurs à Considérer</h3>
        <ul>
          <li>Nombre d'invités</li>
          <li>Durée de l'événement</li>
          <li>Type de boissons servies</li>
          <li>Température ambiante</li>
          <li>Saison (été/hiver)</li>
        </ul>
        
        <h3>Calculs par Type d'Événement</h3>
        <h4>Mariage (100 personnes)</h4>
        <p>Pour un mariage de 100 personnes sur 6 heures : environ 80-100 kg de glaçons</p>
        
        <h4>Événement Corporate</h4>
        <p>Pour un événement professionnel : 0.5-0.8 kg par personne</p>
        
        <h4>Fête Privée</h4>
        <p>Pour une fête privée : 0.7-1 kg par personne selon la durée</p>
        
        <h3>Conseils de Livraison</h3>
        <p>Prévoyez une livraison 2-3 heures avant l'événement pour une fraîcheur optimale. Notre service express peut livrer en moins d'1 heure si nécessaire.</p>
      `,
      author: 'Organisateur Événements',
      date: '2024-01-05',
      readTime: '6 min',
      category: 'Événements',
      tags: ['événements', 'mariage', 'calcul', 'livraison'],
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/glace-en-paillettes-110145.jpg'
    },
    {
      id: '4',
      title: 'L\'Impact de la Qualité des Glaçons sur vos Cocktails',
      excerpt: 'Découvrez comment la qualité des glaçons influence directement le goût et la présentation de vos cocktails.',
      content: `
        <h2>La Science derrière les Glaçons Premium</h2>
        <p>La qualité des glaçons joue un rôle crucial dans l'art de la mixologie. À Marrakech, où la température peut être élevée, utiliser des glaçons de qualité supérieure devient encore plus important.</p>
        
        <h3>Clarté et Pureté</h3>
        <p>Nos glaçons sont produits avec de l'eau purifiée, garantissant une clarté cristalline qui améliore la présentation visuelle de vos cocktails.</p>
        
        <h3>Vitesse de Fonte</h3>
        <p>Des glaçons de qualité fondent plus lentement, préservant l'équilibre des saveurs sans diluer excessivement la boisson.</p>
        
        <h3>Absence de Goût Parasite</h3>
        <p>Nos processus de production éliminent tout goût ou odeur indésirable, permettant aux arômes de vos cocktails de s'exprimer pleinement.</p>
        
        <h3>Recommandations par Type de Cocktail</h3>
        <ul>
          <li><strong>Whisky/Spiritueux purs :</strong> Glaçons Gourmet pour une fonte lente</li>
          <li><strong>Cocktails fruités :</strong> Nugget's pour une texture agréable</li>
          <li><strong>Présentations :</strong> Glace Paillette pour l'effet visuel</li>
        </ul>
      `,
      author: 'Mixologue Expert',
      date: '2023-12-28',
      readTime: '5 min',
      category: 'Mixologie',
      tags: ['cocktails', 'mixologie', 'qualité', 'bars'],
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/nugget-verre.png'
    },
    {
      id: '5',
      title: 'Glaçons Marrakech : Notre Engagement Écologique',
      excerpt: 'Découvrez nos initiatives environnementales et notre approche durable de la production de glaçons.',
      content: `
        <h2>Production Responsable</h2>
        <p>Chez Glaçons Marrakech, nous sommes conscients de notre responsabilité environnementale. Découvrez nos initiatives pour une production plus durable.</p>
        
        <h3>Économie d'Énergie</h3>
        <p>Nos installations utilisent des technologies de pointe pour réduire la consommation énergétique de 30% par rapport aux méthodes traditionnelles.</p>
        
        <h3>Gestion de l'Eau</h3>
        <ul>
          <li>Système de recyclage de l'eau</li>
          <li>Filtration avancée pour réduire le gaspillage</li>
          <li>Utilisation d'eau locale de qualité</li>
        </ul>
        
        <h3>Emballage Écologique</h3>
        <p>Nos sacs de glaçons sont fabriqués à partir de matériaux recyclables, réduisant notre impact environnemental.</p>
        
        <h3>Livraison Optimisée</h3>
        <p>Nos circuits de livraison sont optimisés pour réduire les émissions de CO2 tout en maintenant la fraîcheur de nos produits.</p>
        
        <h3>Engagement Communautaire</h3>
        <p>Nous soutenons les initiatives locales de préservation de l'environnement à Marrakech et sensibilisons nos clients aux bonnes pratiques.</p>
      `,
      author: 'Direction Glaçons Marrakech',
      author: 'Direction The Ice Guys',
      date: '2023-12-20',
      readTime: '4 min',
      category: 'Environnement',
      tags: ['écologie', 'durabilité', 'environnement', 'responsabilité'],
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/gourmet-verre.png'
    },
    {
      id: '6',
      title: 'Tendances 2024 : L\'Évolution du Marché des Glaçons à Marrakech',
      excerpt: 'Analyse des nouvelles tendances et innovations dans l\'industrie des glaçons au Maroc.',
      content: `
        <h2>Le Marché en Évolution</h2>
        <p>L'industrie des glaçons à Marrakech connaît une transformation significative en 2024. Analysons les principales tendances qui façonnent notre secteur.</p>
        
        <h3>Demande Croissante de Qualité Premium</h3>
        <p>Les établissements haut de gamme recherchent de plus en plus des glaçons de qualité supérieure pour se différencier.</p>
        
        <h3>Personnalisation des Services</h3>
        <ul>
          <li>Livraisons sur mesure</li>
          <li>Conditionnements adaptés</li>
          <li>Services express</li>
          <li>Conseils personnalisés</li>
        </ul>
        
        <h3>Innovation Technologique</h3>
        <p>L'adoption de nouvelles technologies de production permet d'améliorer la qualité tout en réduisant les coûts.</p>
        
        <h3>Croissance du Secteur Événementiel</h3>
        <p>Marrakech étant une destination prisée pour les événements, la demande en glaçons pour les mariages, conférences et fêtes privées explose.</p>
        
        <h3>Nos Prévisions 2024</h3>
        <p>Nous anticipons une croissance de 40% du marché, portée par le développement touristique et l'ouverture de nouveaux établissements.</p>
      `,
      author: 'Analyste Marché',
      date: '2023-12-15',
      readTime: '7 min',
      category: 'Marché',
      tags: ['tendances', '2024', 'marché', 'innovation'],
      image: 'https://kzwjpsztcfrrikbsjsed.supabase.co/storage/v1/object/public/assets/glace-en-paillettes-110145.jpg'
    }
  ];

  const categories = ['Tous', 'Guide Professionnel', 'Conseils Techniques', 'Événements', 'Mixologie', 'Environnement', 'Marché'];
  const [selectedCategory, setSelectedCategory] = React.useState('Tous');
  const [selectedPost, setSelectedPost] = React.useState<BlogPost | null>(null);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  const filteredPosts = selectedCategory === 'Tous' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  if (selectedPost) {
    return (
      <div className="py-16 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => {
              setSelectedPost(null);
              setTimeout(scrollToTop, 100);
            }}
            className="flex items-center space-x-2 text-brand-primary hover:text-brand-secondary transition-colors mb-8"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
            <span>Retour au blog</span>
          </button>

          <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 relative overflow-hidden">
              <img 
                src={selectedPost.image} 
                alt={selectedPost.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            
            <div className="p-8">
              <div className="flex items-center space-x-4 text-sm text-slate-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedPost.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{selectedPost.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{selectedPost.readTime}</span>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-4">{selectedPost.title}</h1>
              
              <div className="flex items-center space-x-2 mb-6">
                <Tag className="h-4 w-4 text-brand-primary" />
                <div className="flex flex-wrap gap-2">
                  {selectedPost.tags.map((tag, index) => (
                    <span key={index} className="bg-brand-light/20 text-brand-primary px-2 py-1 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />

              <div className="mt-8 pt-8 border-t border-slate-200">
                <div className="bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl p-6 text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Besoin de glaçons de qualité ?</h3>
                  <p className="mb-4">Contactez-nous pour vos commandes ou pour plus d'informations</p>
                  <a
                    href="https://wa.me/212693675981"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-white text-brand-primary px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    <span>Contactez-nous sur WhatsApp</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Blog
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
              The Ice Guys
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Découvrez nos conseils d'experts, guides pratiques et actualités 
            sur l'univers des glaçons premium à Marrakech
          </p>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setTimeout(scrollToTop, 100);
              }}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article 
              key={post.id} 
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
              onClick={() => {
                setSelectedPost(post);
                setTimeout(scrollToTop, 100);
              }}
            >
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-cyan-100 relative overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-brand-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-primary transition-colors">
                  {post.title}
                </h2>
                
                <p className="text-slate-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-sm text-slate-500">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-brand-primary font-medium group-hover:translate-x-1 transition-transform">
                    <span className="text-sm">Lire plus</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Une question sur nos glaçons ?</h2>
          <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
            Notre équipe d'experts The Ice Guys est à votre disposition pour vous conseiller 
            et répondre à toutes vos questions sur nos produits et services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/212693675981"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-brand-secondary px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center space-x-2"
            >
              <span>Contactez-nous sur WhatsApp</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Blog;