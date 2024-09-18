"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  Video,
  Instagram,
  Youtube,
  Menu,
  X,
  Globe,
  Linkedin,
  Github,
  Twitch,
  Facebook,
} from "lucide-react";

const getIconForLink = (url: string) => {
  if (url.includes("instagram")) return Instagram;
  if (url.includes("youtube")) return Youtube;
  if (url.includes("linkedin")) return Linkedin;
  if (url.includes("github")) return Github;
  if (url.includes("twitch")) return Twitch;
  if (url.includes("facebook")) return Facebook;
  return Globe;
};

export function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const links = [
    { url: "https://www.instagram.com/kamscomputers/", name: "Instagram" },
    { url: "https://www.youtube.com/@codificatufuturo", name: "YouTube" },
    {
      url: "https://www.linkedin.com/in/jesús-romero-7202b1264/",
      name: "LinkedIn",
    },
    { url: "https://github.com/Arnaldocloud", name: "GitHub" },
    { url: "https://www.facebook.com/codificatufuturo", name: "Facebook" },
    { url: "https://www.twitch.tv/codificatufuturo", name: "Twitch" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <header
        className={`px-4 lg:px-6 h-16 flex items-center fixed w-full z-10 transition-all duration-300 ${scrollPosition > 50 ? "bg-purple-600 shadow-lg" : "bg-transparent"}`}
      >
        <Link className="flex items-center justify-center" href="#inicio">
          <span className="sr-only">Codificatufuturo</span>
          <BookOpen className="h-6 w-6 text-white transition-transform duration-300 hover:scale-110" />
          <span className="ml-2 text-2xl font-bold text-white">
            Codificatufuturo
          </span>
        </Link>
        <button
          className="ml-auto lg:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        <nav
          className={`${isMenuOpen ? "flex" : "hidden"} lg:flex absolute lg:relative top-16 lg:top-0 left-0 w-full lg:w-auto flex-col lg:flex-row lg:ml-auto gap-4 sm:gap-6 bg-purple-600 lg:bg-transparent p-4 lg:p-0`}
        >
          {["inicio", "articulos", "videos", "sobre-mi", "enlaces"].map(
            (item) => (
              <Link
                key={item}
                className="text-sm font-medium text-white relative group"
                href={`#${item}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
              </Link>
            )
          )}
        </nav>
      </header>
      <main className="flex-1 pt-16">
        <section
          id="inicio"
          className="w-full py-12 md:py-24 lg:py-32 xl:py-48"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                  Bienvenidos a mi mundo creativo
                </h1>
                <p className="mx-auto max-w-[700px] text-white md:text-xl">
                  Explora mis artículos, videos y más. Mantente actualizado con
                  todo mi contenido.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <form className="flex space-x-2">
                  <Input
                    className="max-w-lg flex-1 bg-white/10 text-white placeholder:text-white/70 focus:ring-2 focus:ring-white transition-all duration-300"
                    placeholder="Ingresa tu email"
                    type="email"
                  />
                  <Button
                    className="bg-white text-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-300"
                    type="submit"
                  >
                    Suscribirse
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
        <section
          id="articulos"
          className="w-full py-12 md:py-24 lg:py-32 bg-white/10 backdrop-blur-lg"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white text-center mb-8">
              Artículos Destacados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Último Artículo",
                  desc: "Descubre mis pensamientos más recientes en este artículo PDF.",
                  badge: "PDF",
                  pdf: "https://drive.google.com/file/d/1JmykoaRHugSjt-NHZtMZHKQB8DNoMsFH/view?usp=drive_link",
                },
                {
                  title: "Guía Completa",
                  desc: "Una guía detallada sobre un tema de gran interés.",
                  badge: "Nuevo",
                  pdf: "https://drive.google.com/file/d/1k3r6k51RVOyxlv458jPuLxnouvZDqiSn/view?usp=drive_link",
                },
                {
                  title: "Análisis en Profundidad",
                  desc: "Un análisis detallado de las últimas tendencias.",
                  badge: "Popular",
                  pdf: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                },
              ].map((article, index) => (
                <Card
                  key={index}
                  className="bg-white/20 backdrop-blur-lg border-0 group hover:bg-white/30 transition-all duration-300 transform hover:-translate-y-2"
                >
                  <CardContent className="p-6">
                    <FileText className="h-12 w-12 text-white mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {article.title}
                    </h3>
                    <p className="text-white/80 mb-4">{article.desc}</p>
                    <Link
                      href={article.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Badge
                        className="mt-4 bg-purple-600 text-white group-hover:bg-white group-hover:text-purple-600 transition-colors duration-300 cursor-pointer"
                        variant="secondary"
                      >
                        {article.badge}
                      </Badge>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section
          id="videos"
          className="w-full py-12 md:py-24 lg:py-32 bg-white/5 backdrop-blur-lg"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white text-center mb-8">
              Videos Populares
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Video Trending",
                  desc: "Mira mi video más popular de esta semana.",
                  badge: "YouTube",
                  link: "https://www.youtube.com/watch?v=DvdJ1E5pbT8&t=3s",
                },
                {
                  title: "Tutorial Paso a Paso",
                  desc: "Aprende una nueva habilidad con este tutorial detallado.",
                  badge: "Educativo",
                  link: "https://www.youtube.com/watch?v=VxrIZGQfxmE&t=9s",
                },
                {
                  title: "Entrevista Exclusiva",
                  desc: "Una conversación fascinante con un experto en el campo.",
                  badge: "Exclusivo",
                  link: "https://www.youtube.com/watch?v=PR7ysC-6-00&t=19s",
                },
              ].map((video, index) => (
                <Card
                  key={index}
                  className="bg-white/20 backdrop-blur-lg border-0 group hover:bg-white/30 transition-all duration-300 transform hover:-translate-y-2"
                >
                  <CardContent className="p-6">
                    <Video className="h-12 w-12 text-white mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {video.title}
                    </h3>
                    <p className="text-white/80">{video.desc}</p>
                    {video.link ? (
                      <Link
                        href={video.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Badge
                          className="mt-4 bg-red-600 text-white group-hover:bg-white group-hover:text-red-600 transition-colors duration-300 cursor-pointer"
                          variant="secondary"
                        >
                          {video.badge}
                        </Badge>
                      </Link>
                    ) : (
                      <Badge
                        className="mt-4 bg-red-600 text-white group-hover:bg-white group-hover:text-red-600 transition-colors duration-300"
                        variant="secondary"
                      >
                        {video.badge}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <section
          id="sobre-mi"
          className="w-full py-12 md:py-24 lg:py-32 bg-white/10 backdrop-blur-lg"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white text-center mb-8">
              Sobre Mí
            </h2>
            <Card className="bg-white/20 backdrop-blur-lg border-0 hover:bg-white/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="aspect-square bg-gray-100 rounded-full overflow-hidden group">
                      <Image
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/profile-pic%20(2)-Z3rreBr6OALIi9VuadmweRCLfEMwr0.png"
                        alt="Tu Nombre"
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                        width={300}
                        height={300}
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-2/3">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Jesús Romero
                    </h3>
                    <p className="text-white/80 mb-4">
                      Soy un apasionado creador de contenido con una profunda
                      conexión con la tecnología. A lo largo de los años, he
                      acumulado experiencia en la reparación y mantenimiento de
                      computadoras, la configuración de redes inalámbricas y el
                      desarrollo web. Mi objetivo principal es compartir
                      conocimientos y experiencias que inspiren y ayuden a otros
                      a alcanzar sus metas.
                    </p>
                    <p className="text-white/80">
                      A través de artículos, videos y tutoriales, busco
                      proporcionar contenido valioso y práctico que marque la
                      diferencia en la vida de mis seguidores. ¡Te invito a
                      unirte a mí en este emocionante viaje de aprendizaje y
                      crecimiento continuo!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <section
          id="enlaces"
          className="w-full py-12 md:py-24 lg:py-32 bg-white/5 backdrop-blur-lg"
        >
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white text-center mb-8">
              Mis Enlaces
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {links.map((link, index) => {
                const Icon = getIconForLink(link.url);
                return (
                  <Link
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-4 bg-white/20 backdrop-blur-lg rounded-lg hover:bg-white/30 transition-all duration-300 group"
                  >
                    <Icon className="h-8 w-8 text-white mb-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-sm font-medium text-white text-center">
                      {link.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-white/10">
        <p className="text-xs text-white/70">
          © 2024 Codificatufuturo. Todos los derechos reservados.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-xs hover:underline underline-offset-4 text-white transition-colors duration-300"
            href="#"
          >
            Términos de Servicio
          </Link>
          <Link
            className="text-xs hover:underline underline-offset-4 text-white transition-colors duration-300"
            href="#"
          >
            Privacidad
          </Link>
        </nav>
      </footer>
    </div>
  );
}
