import React from 'react';
import { Menu, X, ChevronRight, BarChart3, Rocket, Users, Brain, Mail, Phone, MapPin } from 'lucide-react';

function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white shadow-lg fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-teal hover:text-coral">Início</a>
              <a href="#servicos" className="text-teal hover:text-coral">Serviços</a>
              <a href="#sobre" className="text-teal hover:text-coral">Sobre</a>
              <a href="#contato" className="text-teal hover:text-coral">Contato</a>
              <button className="bg-coral text-white px-6 py-2 rounded-md hover:bg-teal transition-colors">
                Fale Conosco
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-teal">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#inicio" className="block px-3 py-2 text-teal hover:text-coral">Início</a>
              <a href="#servicos" className="block px-3 py-2 text-teal hover:text-coral">Serviços</a>
              <a href="#sobre" className="block px-3 py-2 text-teal hover:text-coral">Sobre</a>
              <a href="#contato" className="block px-3 py-2 text-teal hover:text-coral">Contato</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="pt-20 bg-gradient-to-br from-teal to-coral">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Transformando Negócios através da Tecnologia
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Soluções estratégicas para impulsionar seu crescimento e aumentar sua participação no mercado
            </p>
            <button className="bg-white text-teal px-8 py-3 rounded-md hover:bg-coral hover:text-white transition-colors font-semibold">
              Saiba Mais
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-teal text-center mb-12">Nossos Serviços</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <BarChart3 className="text-coral w-12 h-12 mb-4" />
              <h3 className="text-xl font-semibold text-teal mb-3">Consultoria Estratégica</h3>
              <p className="text-gray-600">Análise de mercado e desenvolvimento de estratégias para maximizar resultados</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <Brain className="text-coral w-12 h-12 mb-4" />
              <h3 className="text-xl font-semibold text-teal mb-3">Transformação Digital</h3>
              <p className="text-gray-600">Modernização de processos e implementação de soluções tecnológicas</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <Rocket className="text-coral w-12 h-12 mb-4" />
              <h3 className="text-xl font-semibold text-teal mb-3">Inovação Empresarial</h3>
              <p className="text-gray-600">Desenvolvimento de produtos e serviços inovadores para seu negócio</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-teal mb-6">Sobre Nós</h2>
              <p className="text-gray-600 mb-4">
                Somos especialistas em transformar desafios em oportunidades de crescimento. Nossa equipe combina expertise em negócios e tecnologia para entregar resultados excepcionais.
              </p>
              <p className="text-gray-600 mb-6">
                Com anos de experiência no mercado, já ajudamos centenas de empresas a alcançarem seus objetivos estratégicos.
              </p>
              <div className="flex items-center space-x-4">
                <Users className="text-coral w-8 h-8" />
                <span className="text-lg font-semibold text-teal">+50 clientes satisfeitos</span>
              </div>
            </div>
            <div className="relative h-96">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Equipe de consultoria"
                className="rounded-lg shadow-xl object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-teal text-center mb-12">Entre em Contato</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center mb-6">
                <Mail className="text-coral w-6 h-6 mr-3" />
                <span className="text-gray-600">contato@axcellera.com.br</span>
              </div>
              <div className="flex items-center mb-6">
                <Phone className="text-coral w-6 h-6 mr-3" />
                <span className="text-gray-600">(11) 96000-2280</span>
              </div>
              <div className="flex items-center">
                <MapPin className="text-coral w-6 h-6 mr-3" />
                <span className="text-gray-600">São Paulo, SP - Brasil</span>
              </div>
            </div>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Nome"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral"
              />
              <textarea
                placeholder="Mensagem"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral"
              ></textarea>
              <button className="w-full bg-coral text-white px-6 py-3 rounded-md hover:bg-teal transition-colors">
                Enviar Mensagem
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
            </div>
            <div className="text-center md:text-right">
              <p>&copy; 2024 Axcellera. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;