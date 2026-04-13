export type CarouselImageSlide = {
  kind: "image";
  title: string;
  subtitle: string;
  image: string;
  theme: string;
};

export type CarouselMessageSlide = {
  kind: "message";
  title: string;
  subtitle: string;
  body: string;
  theme: string;
  epigraph?: string;
  epigraphTranslation?: string;
};

export type CarouselSlide = CarouselImageSlide | CarouselMessageSlide;
